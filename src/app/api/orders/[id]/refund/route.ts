import { prisma } from '../../../../../lib/db';
import { requirePermission } from '../../../../../lib/auth';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { stripeReady, realOrdersEnabled } from '../../../../../lib/real-orders';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!realOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    await requirePermission('orders:refund');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const { id } = await context.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (order?.paymentStatus === 'CREDITED' && order.creditAppliedCents > 0 && !order.stripePaymentIntentId && !['CANCELLED', 'REJECTED'].includes(order.status)) {
      const restored = await prisma.$transaction(async tx => {
        if (order.userId) await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${order.userId} FOR UPDATE`;
        const changed = await tx.order.updateMany({ where: { id: order.id, paymentStatus: 'CREDITED', status: order.status, revision: order.revision }, data: { status: 'CANCELLED', revision: { increment: 1 } } });
        if (!changed.count) throw new Error('ORDER_NOT_REFUNDABLE');
        await tx.storeCreditEntry.upsert({
          where: { orderId_kind: { orderId: order.id, kind: 'ORDER_REFUND' } },
          create: { userId: order.userId!, orderId: order.id, kind: 'ORDER_REFUND', amountCents: order.creditAppliedCents, note: `Avoir restitué · ${order.publicReference}` },
          update: {},
        });
        return order.creditAppliedCents;
      });
      return Response.json({ ok: true, paymentStatus: 'CREDITED', amountCents: restored });
    }
    if (!stripeReady()) return Response.json({ error: 'NOT_CONFIGURED' }, { status: 503 });
    if (!order || order.paymentStatus !== 'PAID' || !order.stripePaymentIntentId || order.status === 'CANCELLED' || order.status === 'REJECTED') {
      return Response.json({ error: 'ORDER_NOT_REFUNDABLE' }, { status: 409 });
    }

    const reserved = await prisma.order.updateMany({
      where: { id: order.id, revision: order.revision, paymentStatus: 'PAID', status: order.status },
      data: { paymentStatus: 'REFUND_REQUIRED', revision: { increment: 1 } },
    });
    if (!reserved.count) return Response.json({ error: 'ORDER_NOT_REFUNDABLE' }, { status: 409 });

    // One stable idempotency key prevents duplicate full refunds on retries or double clicks.
    const body = new URLSearchParams({ payment_intent: order.stripePaymentIntentId, 'metadata[order_id]': order.id });
    const stripeResponse = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `roma-full-refund-${order.id}-${order.revision}`,
      },
      body,
      cache: 'no-store',
    });
    if (!stripeResponse.ok) {
      console.error('Stripe full refund request failed', { orderId: order.id, status: stripeResponse.status });
      return Response.json({ error: 'REFUND_FAILED' }, { status: 502 });
    }
    const refund = await stripeResponse.json() as { status?: string };
    if (!refund.status || !['succeeded', 'pending', 'requires_action'].includes(refund.status)) {
      console.error('Stripe refund returned an unexpected status', { orderId: order.id, status: refund.status });
      return Response.json({ error: 'REFUND_FAILED' }, { status: 502 });
    }
    const succeeded = refund.status === 'succeeded';
    await prisma.$transaction(async tx => {
      if (succeeded && order.userId && order.creditAppliedCents > 0) await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${order.userId} FOR UPDATE`;
      if (succeeded) await tx.order.updateMany({ where: { id: order.id, paymentStatus: 'REFUND_REQUIRED' }, data: { paymentStatus: 'REFUNDED', status: 'CANCELLED', revision: { increment: 1 } } });
      if (succeeded && order.creditAppliedCents > 0 && order.userId) await tx.storeCreditEntry.upsert({
        where: { orderId_kind: { orderId: order.id, kind: 'ORDER_REFUND' } },
        create: { userId: order.userId, orderId: order.id, kind: 'ORDER_REFUND', amountCents: order.creditAppliedCents, note: `Avoir restitué · ${order.publicReference}` },
        update: {},
      });
    });
    return Response.json({ ok: true, paymentStatus: succeeded ? 'REFUNDED' : 'REFUND_REQUIRED' });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : code === 'ORDER_NOT_REFUNDABLE' ? 409 : 503;
    return Response.json({ error: status === 403 ? 'FORBIDDEN' : status === 409 ? 'ORDER_NOT_REFUNDABLE' : 'UNAVAILABLE' }, { status });
  }
}
