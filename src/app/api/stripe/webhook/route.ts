import { createHmac, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../lib/db';
import { stripeReady } from '../../../../lib/real-orders';

function validSignature(raw: string, header: string, secret: string) {
  const parts = header.split(',').map(part => part.trim().split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !/^\d+$/.test(timestamp) || !signatures.length || Math.abs(Date.now()/1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest();
  return signatures.some(signature => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const received = Buffer.from(signature, 'hex');
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

export async function POST(request: Request) {
  if (!stripeReady()) return Response.json({ error: 'NOT_CONFIGURED' }, { status: 503 });
  const raw = await request.text();
  if (raw.length > 1_000_000) return Response.json({ error: 'TOO_LARGE' }, { status: 413 });
  const signature = request.headers.get('stripe-signature') ?? '';
  if (!validSignature(raw, signature, process.env.STRIPE_WEBHOOK_SECRET!)) return Response.json({ error: 'INVALID_SIGNATURE' }, { status: 400 });
  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try { event = JSON.parse(raw); }
  catch { return Response.json({ error: 'INVALID_EVENT' }, { status: 400 }); }
  if (!event.id || !event.type || !event.data?.object) return Response.json({ error: 'INVALID_EVENT' }, { status: 400 });
  const object = event.data.object;
  try {
    await prisma.$transaction(async tx => {
      await tx.stripeWebhookEvent.create({ data: { id: event.id!, type: event.type! } });
      if (['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type!)) {
        const orderId = typeof object.metadata === 'object' && object.metadata !== null ? (object.metadata as Record<string, unknown>).orderId : null;
        const amount = object.amount_total;
        if (typeof orderId === 'string') {
          const order = await tx.order.findUnique({ where: { id: orderId } });
          if (order && order.paymentStatus === 'PENDING' && (!order.stripeSessionId || order.stripeSessionId === object.id) && typeof object.id === 'string' && amount === order.totalCents - order.creditAppliedCents && object.currency === 'eur' && object.payment_status === 'paid') {
            const intent = typeof object.payment_intent === 'string' ? object.payment_intent : null;
            await tx.order.update({ where: { id: order.id }, data: { stripeSessionId: String(object.id), paymentStatus: 'PAID', status: 'ACCEPTED', stripePaymentIntentId: intent, revision: { increment: 1 } } });
            const reservation = await tx.storeCreditReservation.findUnique({ where: { orderId: order.id } });
            if (reservation?.status === 'ACTIVE') {
              await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${reservation.userId} FOR UPDATE`;
              await tx.storeCreditEntry.create({ data: { userId: reservation.userId, orderId: order.id, kind: 'ORDER_REDEMPTION', amountCents: -reservation.amountCents } });
              await tx.storeCreditReservation.update({ where: { id: reservation.id }, data: { status: 'CONSUMED' } });
            }
          }
        }
      } else if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
        const sessionId = object.id;
        if (typeof sessionId === 'string') {
          const orders = await tx.order.findMany({ where: { stripeSessionId: sessionId, paymentStatus: 'PENDING', status: 'PENDING' }, select: { id: true, promotionId: true } });
          if (orders.length) {
            for (const order of orders) {
              const changed = await tx.order.updateMany({ where: { id: order.id, paymentStatus: 'PENDING', status: 'PENDING' }, data: { paymentStatus: 'FAILED', status: 'CANCELLED', revision: { increment: 1 } } });
              if (!changed.count) continue;
              await tx.storeCreditReservation.updateMany({ where: { orderId: order.id, status: 'ACTIVE' }, data: { status: 'RELEASED' } });
              if (order.promotionId) await tx.promotion.updateMany({ where: { id: order.promotionId, usageCount: { gt: 0 } }, data: { usageCount: { decrement: 1 } } });
            }
          }
        }
      } else if (event.type === 'charge.refunded') {
        const paymentIntent = object.payment_intent;
        if (typeof paymentIntent === 'string' && object.refunded === true) {
          const order = await tx.order.findUnique({ where: { stripePaymentIntentId: paymentIntent } });
          if (order) {
            if (order.userId && order.creditAppliedCents > 0) await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${order.userId} FOR UPDATE`;
            await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'REFUNDED', status: 'CANCELLED', revision: { increment: 1 } } });
            if (order.userId && order.creditAppliedCents > 0) await tx.storeCreditEntry.upsert({
              where: { orderId_kind: { orderId: order.id, kind: 'ORDER_REFUND' } },
              create: { userId: order.userId, orderId: order.id, kind: 'ORDER_REFUND', amountCents: order.creditAppliedCents, note: `Avoir restitué · ${order.publicReference}` },
              update: {},
            });
          }
        }
      } else if (event.type === 'refund.failed') {
        const paymentIntent = object.payment_intent;
        if (typeof paymentIntent === 'string') await tx.order.updateMany({ where: { stripePaymentIntentId: paymentIntent, paymentStatus: 'REFUND_REQUIRED' }, data: { paymentStatus: 'PAID', revision: { increment: 1 } } });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      try {
        const recorded = await prisma.stripeWebhookEvent.findUnique({ where: { id: event.id }, select: { id: true } });
        if (recorded) return Response.json({ received: true, duplicate: true });
      } catch { /* Return 500 so Stripe retries when the event state cannot be checked. */ }
    }
    console.error('Stripe webhook processing failed', error);
    return Response.json({ error: 'WEBHOOK_PROCESSING_FAILED' }, { status: 500 });
  }
  return Response.json({ received: true });
}
