import { prisma } from '../../../../lib/db';
import { requireCustomer } from '../../../../lib/customer-session';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { testOrdersEnabled } from '../../../../lib/test-mode';
import { readJson } from '../../../../lib/http-json';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const user = await requireCustomer();
    const { id } = await context.params;
    const order = await prisma.testOrder.findFirst({ where: { id, userId: user.id }, select: { id: true, publicReference: true, status: true, revision: true, fulfillment: true, totalCents: true, placedAt: true, scheduledFor: true, itemsSnapshot: true, contactName: true, phone: true, address: true, zoneId: true, comment: true } });
    return order ? Response.json({ order }, { headers: { 'Cache-Control': 'no-store' } }) : Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  } catch (error) { return Response.json({ error: 'UNAVAILABLE' }, { status: error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 503 }); }
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const user = await requireCustomer();
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = await readJson(request, 1024) as { revision?: number };
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'revision') || !Number.isSafeInteger(input.revision)) return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    const { id } = await context.params;
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
      return tx.testOrder.updateMany({ where: { id, userId: user.id, status: 'PENDING', revision: input.revision }, data: { status: 'CANCELLED', revision: { increment: 1 } } });
    });
    return Response.json({ ok: result.count === 1 }, { status: result.count === 1 ? 200 : 409 });
  } catch (error) { return Response.json({ error: 'UNAVAILABLE' }, { status: error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : error instanceof Error && error.message === 'INVALID_REQUEST' ? 400 : 503 }); }
}
