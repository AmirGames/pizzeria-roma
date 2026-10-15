import { prisma } from '../../../../../lib/db';
import { requireCustomer } from '../../../../../lib/customer-session';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { testOrdersEnabled } from '../../../../../lib/test-mode';
import { readJson } from '../../../../../lib/http-json';
import { prepareCustomerReorder } from '../../../../../lib/customer-reorder.mjs';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const user = await requireCustomer();
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = await readJson(request, 1024);
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('INVALID_REQUEST');
    const { id } = await context.params;
    const order = await prisma.testOrder.findFirst({ where: { id, userId: user.id }, select: { itemsSnapshot: true, totalCents: true } });
    if (!order) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    const snapshot = order.itemsSnapshot;
    if (!Array.isArray(snapshot) || !snapshot.length || snapshot.length > 30) throw new Error('REORDER_UNAVAILABLE');
    const ids = snapshot.flatMap(line => line && typeof line === 'object' && !Array.isArray(line) && typeof line.productId === 'string' ? [line.productId] : []);
    const products = await prisma.product.findMany({ where: { id: { in: ids } }, include: { category: true, sizes: true, extras: true } });
    return Response.json({ ...prepareCustomerReorder(products, snapshot), previousTotalCents: order.totalCents }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'INVALID_REQUEST' ? 400 : code === 'REORDER_UNAVAILABLE' ? 409 : 503;
    return Response.json({ error: status === 503 ? 'SERVICE_UNAVAILABLE' : code }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
