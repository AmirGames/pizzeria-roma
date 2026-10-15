import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/db';
import { requireCustomer } from '../../../lib/customer-session';
import { isSameOriginMutation } from '../../../lib/catalog-management.mjs';
import { testOrdersEnabled } from '../../../lib/test-mode';
import { validateTestOrder } from '../../../lib/test-order-policy.mjs';
import { previewCatalogCart } from '../../../lib/catalog-cart-preview.mjs';
import { readJson } from '../../../lib/http-json';

export async function POST(request: Request) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const user = await requireCustomer();
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = validateTestOrder(await readJson(request));
    const requestHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const where = { userId_requestKey: { userId: user.id, requestKey: input.requestKey } };
    const existing = await prisma.testOrder.findUnique({ where });
    if (existing) return existing.requestHash === requestHash ? Response.json({ id: existing.id }, { headers: { 'Cache-Control': 'no-store' } }) : Response.json({ error: 'REQUEST_CONFLICT' }, { status: 409 });
    try {
      const order = await prisma.$transaction(async tx => {
        const products = await tx.product.findMany({ where: { id: { in: input.items.map(item => item.productId) }, active: true }, include: { category: true, sizes: true, extras: true } });
        const preview = previewCatalogCart(products, input.items, { mode: input.mode, zoneId: input.zoneId });
        if (!preview.fulfillment.eligible) throw new Error('MINIMUM_NOT_MET');
        if (preview.subtotalCents > 2147483647) throw new Error('INVALID_TEST_ORDER');
        if (preview.subtotalCents !== input.expectedTotalCents) throw new Error('PRICE_CHANGED');
        return tx.testOrder.create({ data: {
          userId: user.id, requestKey: input.requestKey, requestHash, publicReference: `TEST-${randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`,
          fulfillment: input.mode === 'delivery' ? 'DELIVERY' : 'PICKUP', zoneId: input.zoneId,
          contactName: input.contactName, phone: input.phone, address: input.address, comment: input.comment,
          totalCents: preview.subtotalCents, itemsSnapshot: JSON.parse(JSON.stringify(preview.items)) as Prisma.InputJsonValue,
        } });
      });
      return Response.json({ id: order.id }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      // Concurrent retries share a unique key. Only one test order can be recorded.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const recorded = await prisma.testOrder.findUnique({ where });
        if (recorded?.requestHash === requestHash) return Response.json({ id: recorded.id }, { headers: { 'Cache-Control': 'no-store' } });
        return Response.json({ error: 'REQUEST_CONFLICT' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'PRICE_CHANGED' ? 409 : ['INVALID_REQUEST', 'INVALID_TEST_ORDER', 'INVALID_CART', 'INVALID_EXTRAS', 'INVALID_SIZE', 'INVALID_REMOVALS', 'PRODUCT_UNAVAILABLE', 'MINIMUM_NOT_MET', 'UNKNOWN_ZONE'].includes(code) ? 400 : 503;
    return Response.json({ error: status === 503 ? 'SERVICE_UNAVAILABLE' : code }, { status });
  }
}
