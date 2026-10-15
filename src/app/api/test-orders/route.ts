import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/db';
import { requireCustomer } from '../../../lib/customer-session';
import { isSameOriginMutation } from '../../../lib/catalog-management.mjs';
import { testOrdersEnabled } from '../../../lib/test-mode';
import { validateTestOrder } from '../../../lib/test-order-policy.mjs';
import { previewCatalogCart } from '../../../lib/catalog-cart-preview.mjs';
import { readJson } from '../../../lib/http-json';
import { resolveWalloniaDeliveryAddress } from '../../../lib/wallonia-delivery';
import { brusselsDayWindow } from '../../../lib/staff-dashboard.mjs';
// @ts-ignore JavaScript module; covered by unit tests
import { availableSlots, brusselsDateKey, validateScheduledFor } from '../../../lib/delivery-slots.mjs';

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
    if (!input.scheduledFor) return Response.json({ error: 'INVALID_SLOT' }, { status: 400 });
    const scheduledFor = validateScheduledFor(input.scheduledFor);
    const addressResult = input.mode === 'delivery' ? await resolveWalloniaDeliveryAddress(input.address!) : null;
    const trustedZoneId = addressResult?.zoneId;
    try {
      const order = await prisma.$transaction(async tx => {
        // Serialize slot reservations so concurrent requests cannot take the same remaining capacity.
        await tx.$queryRaw`SELECT "id" FROM "DeliveryConfiguration" WHERE "id" = 'global' FOR UPDATE`;
        const config = await tx.deliveryConfiguration.findUnique({ where: { id: 'global' } });
        if (!config) throw new Error('DELIVERY_CONFIGURATION_MISSING');
        const products = await tx.product.findMany({ where: { id: { in: input.items.map(item => item.productId) }, active: true }, include: { category: true, sizes: true, extras: true } });
        const preview = previewCatalogCart(products, input.items, { mode: input.mode, zoneId: trustedZoneId });
        if (!preview.fulfillment.eligible) throw new Error('MINIMUM_NOT_MET');
        if (preview.subtotalCents > 2147483647) throw new Error('INVALID_TEST_ORDER');
        if (preview.subtotalCents !== input.expectedTotalCents) throw new Error('PRICE_CHANGED');
        const pizzaCount = input.items.reduce((count, item) => count + (products.find(product => product.id === item.productId)?.category.fulfillmentCategory === 'PIZZA' ? item.quantity : 0), 0);
        const date = brusselsDateKey(scheduledFor);
        const day = brusselsDayWindow(new Date(`${date}T12:00:00.000Z`));
        const reservations = await tx.testOrder.groupBy({
          by: ['scheduledFor'],
          where: { scheduledFor: { gte: day.start, lt: day.end }, status: { notIn: ['REJECTED', 'CANCELLED', 'COMPLETED'] } },
          _sum: { pizzaCount: true },
        });
        const usedBySlot = Object.fromEntries(reservations.map(row => [row.scheduledFor.toISOString(), row._sum.pizzaCount ?? 0]));
        const available = availableSlots({ date, mode: input.mode, now: new Date(), pizzaCount, usedBySlot, pickupLeadMinutes: config.pickupLeadMinutes, slotPizzaCapacity: config.slotPizzaCapacity });
        if (!available.some(slot => slot.value === scheduledFor.toISOString())) throw new Error('SLOT_UNAVAILABLE');
        return tx.testOrder.create({ data: {
          userId: user.id, requestKey: input.requestKey, requestHash, publicReference: `TEST-${randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`,
          fulfillment: input.mode === 'delivery' ? 'DELIVERY' : 'PICKUP', zoneId: trustedZoneId, scheduledFor, pizzaCount,
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
    const status = code === 'UNAUTHORIZED' ? 401 : ['PRICE_CHANGED', 'SLOT_UNAVAILABLE'].includes(code) ? 409 : code === 'ADDRESS_OUTSIDE_DELIVERY' || code === 'ADDRESS_NOT_FOUND' ? 422 : ['INVALID_REQUEST', 'INVALID_TEST_ORDER', 'INVALID_CART', 'INVALID_EXTRAS', 'INVALID_SIZE', 'INVALID_REMOVALS', 'PRODUCT_UNAVAILABLE', 'MINIMUM_NOT_MET', 'UNKNOWN_ZONE', 'INVALID_SLOT'].includes(code) ? 400 : 503;
    return Response.json({ error: status === 503 ? code || 'SERVICE_UNAVAILABLE' : code }, { status });
  }
}
