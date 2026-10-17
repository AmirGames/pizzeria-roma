import { prisma } from '../../../../../lib/db';
import { requirePermission } from '../../../../../lib/auth';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { realOrdersEnabled } from '../../../../../lib/real-orders';
import { readJson } from '../../../../../lib/http-json';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!realOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const staff = await requirePermission('orders:refund');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    let input: { consentConfirmed?: unknown };
    try { input = await readJson(request, 1024) as { consentConfirmed?: unknown }; }
    catch { return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 }); }
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'consentConfirmed') || input.consentConfirmed !== true) {
      return Response.json({ error: 'CUSTOMER_CONSENT_REQUIRED' }, { status: 400 });
    }
    const { id } = await context.params;
    const result = await prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order?.userId || order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'REFUND_REQUIRED' || ['CANCELLED', 'REJECTED'].includes(order.status)) throw new Error('ORDER_NOT_CREDITABLE');
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${order.userId} FOR UPDATE`;
      const owner = await tx.user.findUnique({ where: { id: order.userId }, select: { role: true } });
      if (owner?.role !== 'CUSTOMER') throw new Error('ORDER_NOT_CREDITABLE');
      const updated = await tx.order.updateMany({
        where: { id: order.id, revision: order.revision, status: order.status, paymentStatus: order.paymentStatus },
        data: { status: 'CANCELLED', revision: { increment: 1 } },
      });
      if (updated.count !== 1) throw new Error('ORDER_CHANGED');
      await tx.storeCreditEntry.create({ data: {
        userId: order.userId!, orderId: order.id, kind: 'MANAGER_GRANT', amountCents: order.totalCents,
        note: `Avoir après commande ${order.publicReference}`,
        consentConfirmedAt: new Date(), consentConfirmedBy: staff.id,
      } });
      return order.totalCents;
    });
    return Response.json({ ok: true, amountCents: result });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : code === 'ORDER_NOT_CREDITABLE' ? 409 : code === 'ORDER_CHANGED' ? 409 : 503;
    return Response.json({ error: status === 403 ? 'FORBIDDEN' : status === 409 ? code : 'UNAVAILABLE' }, { status });
  }
}
