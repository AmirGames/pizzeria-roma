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
// @ts-ignore JavaScript module
import { selectPromotion } from '../../../lib/promotions.mjs';
// @ts-ignore JavaScript module
import { calculateLoyaltyReward } from '../../../lib/loyalty.mjs';
// @ts-ignore JavaScript module
import { attachGlobalPizzaIngredients } from '../../../lib/global-pizza-ingredients.mjs';
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
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
        const config = await tx.deliveryConfiguration.findUnique({ where: { id: 'global' } });
        if (!config) throw new Error('DELIVERY_CONFIGURATION_MISSING');
        const [catalogProducts, ingredients] = await Promise.all([
          tx.product.findMany({ where: { id: { in: input.items.map(item => item.productId) }, active: true }, include: { category: true, sizes: true, extras: true } }),
          tx.ingredient.findMany({ where: { active: true } }),
        ]);
        const products = attachGlobalPizzaIngredients(catalogProducts, ingredients);
        const preview = previewCatalogCart(products, input.items, { mode: input.mode, zoneId: trustedZoneId });
        if (!preview.fulfillment.eligible) throw new Error('MINIMUM_NOT_MET');
        if (preview.subtotalCents > 2147483647) throw new Error('INVALID_TEST_ORDER');
        const [completed, reserved] = await Promise.all([
          tx.testOrder.aggregate({ where: { userId: user.id, status: 'COMPLETED' }, _sum: { loyaltyPaidDishCount: true } }),
          tx.testOrder.aggregate({ where: { userId: user.id, status: { notIn: ['CANCELLED', 'REJECTED'] }, loyaltyFreeDishCount: { gt: 0 } }, _sum: { loyaltyFreeDishCount: true } }),
        ]);
        const loyalty = calculateLoyaltyReward(products, preview.items, completed._sum.loyaltyPaidDishCount ?? 0, reserved._sum.loyaltyFreeDishCount ?? 0);
        const [automatic, codePromotion] = await Promise.all([
          tx.promotion.findFirst({ where: { kind: 'AUTOMATIC', active: true }, orderBy: { updatedAt: 'desc' } }),
          input.promoCode ? tx.promotion.findUnique({ where: { code: input.promoCode } }) : Promise.resolve(null),
        ]);
        const discount = selectPromotion({ automatic, codePromotion, code: input.promoCode, subtotalCents: preview.subtotalCents - loyalty.loyaltyDiscountCents });
        if (discount.totalCents !== input.expectedTotalCents) throw new Error('PRICE_CHANGED');
        if (discount.codeError) throw new Error('PROMO_CODE_INVALID');
        if (discount.promotion) {
          const usage = await tx.promotion.updateMany({ where: { id: discount.promotion.id, active: true, ...(discount.promotion.code ? { code: discount.promotion.code } : {}), OR: [{ usageLimit: null }, { usageCount: { lt: (automatic?.id === discount.promotion.id ? automatic.usageLimit : codePromotion?.usageLimit) ?? 2147483647 } }] }, data: { usageCount: { increment: 1 } } });
          if (usage.count !== 1) throw new Error('PROMOTION_UNAVAILABLE');
        }
        const pizzaCount = input.items.reduce((count, item) => count + (products.find(product => product.id === item.productId)?.category.fulfillmentCategory === 'PIZZA' ? item.quantity : 0), 0);
        const date = brusselsDateKey(scheduledFor);
        const day = brusselsDayWindow(new Date(`${date}T12:00:00.000Z`));
        const reservations = await tx.testOrder.groupBy({
          by: ['scheduledFor'],
          where: { scheduledFor: { gte: day.start, lt: day.end }, status: { notIn: ['REJECTED', 'CANCELLED'] } },
          _sum: { pizzaCount: true },
        });
        const usedBySlot = Object.fromEntries(reservations.map(row => [row.scheduledFor.toISOString(), row._sum.pizzaCount ?? 0]));
        const available = availableSlots({ date, mode: input.mode, now: new Date(), pizzaCount, usedBySlot, leadTimeMinutes: config.leadTimeMinutes, slotPizzaCapacity: config.slotPizzaCapacity });
        if (!available.some(slot => slot.value === scheduledFor.toISOString())) throw new Error('SLOT_UNAVAILABLE');
        return tx.testOrder.create({ data: {
          userId: user.id, requestKey: input.requestKey, requestHash, publicReference: `TEST-${randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`,
          fulfillment: input.mode === 'delivery' ? 'DELIVERY' : 'PICKUP', zoneId: trustedZoneId, scheduledFor, pizzaCount,
          contactName: input.contactName, phone: input.phone, address: input.address, comment: input.comment,
          subtotalCents: preview.subtotalCents, discountCents: discount.discountCents, loyaltyDiscountCents: loyalty.loyaltyDiscountCents, totalCents: discount.totalCents,
          loyaltyPaidDishCount: loyalty.loyaltyPaidDishCount, loyaltyFreeDishCount: loyalty.loyaltyFreeDishCount,
          promotionId: discount.promotion?.id, promotionCode: discount.promotion?.code, promotionName: discount.promotion?.name,
          itemsSnapshot: JSON.parse(JSON.stringify(preview.items.map((item, index) => ({ ...item, loyaltyFreeQuantity: loyalty.loyaltyFreeByLine[index] ?? 0 })))) as Prisma.InputJsonValue,
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
    const status = code === 'UNAUTHORIZED' ? 401 : ['PRICE_CHANGED', 'SLOT_UNAVAILABLE', 'PROMOTION_UNAVAILABLE'].includes(code) ? 409 : code === 'PROMO_CODE_INVALID' ? 400 : code === 'ADDRESS_OUTSIDE_DELIVERY' || code === 'ADDRESS_NOT_FOUND' ? 422 : ['INVALID_REQUEST', 'INVALID_TEST_ORDER', 'INVALID_CART', 'INVALID_EXTRAS', 'INVALID_SIZE', 'INVALID_REMOVALS', 'PRODUCT_UNAVAILABLE', 'MINIMUM_NOT_MET', 'UNKNOWN_ZONE', 'INVALID_SLOT'].includes(code) ? 400 : 503;
    return Response.json({ error: status === 503 ? code || 'SERVICE_UNAVAILABLE' : code }, { status });
  }
}
