import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../lib/db';
import { getCurrentUser } from '../../../../lib/auth';
// @ts-ignore JavaScript module
import { calculateLoyaltyReward } from '../../../../lib/loyalty.mjs';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { readJson } from '../../../../lib/http-json';
import { previewCatalogCart } from '../../../../lib/catalog-cart-preview.mjs';
// @ts-ignore JavaScript module
import { attachGlobalPizzaIngredients } from '../../../../lib/global-pizza-ingredients.mjs';
import { resolveWalloniaDeliveryAddress } from '../../../../lib/wallonia-delivery';
// @ts-ignore JavaScript module; covered by existing delivery-slot checks
import { validateScheduledFor, availableSlots, brusselsDateKey } from '../../../../lib/delivery-slots.mjs';
import { brusselsDayWindow } from '../../../../lib/staff-dashboard.mjs';
import { configuredStripeMethods, realOrdersEnabled, stripeReady } from '../../../../lib/real-orders';
// @ts-ignore JavaScript module
import { selectPromotion } from '../../../../lib/promotions.mjs';

const fail = (status: number, error: string) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

function validate(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_ORDER');
  const x = value as Record<string, unknown>;
  if (Object.keys(x).some(key => !['items','mode','scheduledFor','contactName','phone','address','comment','email','requestKey','useCredit'].includes(key))) throw new Error('INVALID_ORDER');
  const text = (v: unknown, max: number) => typeof v === 'string' && !!v.trim() && v.trim().length <= max;
  if (!Array.isArray(x.items) || x.items.length < 1 || x.items.length > 30 || !['delivery','pickup'].includes(String(x.mode))) throw new Error('INVALID_ORDER');
  if (!text(x.contactName,128) || !text(x.phone,40) || !/^\+?[0-9 ()-]{7,30}$/.test(String(x.phone).trim())) throw new Error('INVALID_ORDER');
  if (!text(x.email,320) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x.email).trim())) throw new Error('INVALID_ORDER');
  if (typeof x.requestKey !== 'string' || !/^[a-f0-9-]{36}$/i.test(x.requestKey)) throw new Error('INVALID_ORDER');
  if (x.useCredit !== undefined && typeof x.useCredit !== 'boolean') throw new Error('INVALID_ORDER');
  if (typeof x.scheduledFor !== 'string') throw new Error('INVALID_SLOT');
  if (x.mode === 'delivery' && !text(x.address,300)) throw new Error('INVALID_ORDER');
  if (x.mode === 'pickup' && x.address) throw new Error('INVALID_ORDER');
  if (x.comment !== undefined && (typeof x.comment !== 'string' || x.comment.length > 500)) throw new Error('INVALID_ORDER');
  for (const line of x.items) {
    if (!line || typeof line !== 'object' || Array.isArray(line)) throw new Error('INVALID_CART');
  }
  return {
    items: x.items as Array<{ productId: string; quantity: number; sizeId?: string; extraIds?: string[]; removedIngredients?: string[] }>,
    mode: x.mode as 'delivery'|'pickup', scheduledFor: validateScheduledFor(x.scheduledFor),
    contactName: String(x.contactName).trim(), phone: String(x.phone).trim(), email: String(x.email).trim().toLowerCase(),
    address: typeof x.address === 'string' ? x.address.trim() : null, comment: typeof x.comment === 'string' ? x.comment.trim() : '', requestKey: x.requestKey, useCredit: x.useCredit === true,
  };
}

async function stripeSession(sessionId: string) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }, cache: 'no-store',
  });
  if (!response.ok) throw new Error('STRIPE_UNAVAILABLE');
  return response.json() as Promise<{ url?: string }>;
}

export async function POST(request: Request) {
  if (!realOrdersEnabled()) return fail(404, 'ORDERS_NOT_OPEN');
  if (!stripeReady()) return fail(503, 'PAYMENT_NOT_CONFIGURED');
  if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return fail(403, 'FORBIDDEN');
  try {
    const input = validate(await readJson(request));
    const user = await getCurrentUser();
    if (input.useCredit && user?.role !== 'CUSTOMER') throw new Error('LOGIN_REQUIRED_FOR_CREDIT');
    const requestHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const prior = await prisma.order.findUnique({ where: { requestKey: input.requestKey } });
    if (prior) {
      if (prior.requestHash !== requestHash) return fail(409, 'REQUEST_CONFLICT');
      if (prior.paymentStatus === 'CREDITED') return Response.json({ url: `/commande/confirmation?order_id=${encodeURIComponent(prior.id)}` }, { headers: { 'Cache-Control': 'no-store' } });
      if (prior.stripeSessionId) {
        const session = await stripeSession(prior.stripeSessionId);
        if (session.url) return Response.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } });
      }
      return fail(409, 'PAYMENT_SESSION_EXPIRED');
    }
    const addressResult = input.mode === 'delivery' ? await resolveWalloniaDeliveryAddress(input.address!) : null;
    const origin = new URL(process.env.APP_ORIGIN!);
    if (!['https:', 'http:'].includes(origin.protocol) || origin.username || origin.password) return fail(503, 'PAYMENT_NOT_CONFIGURED');

    const order = await prisma.$transaction(async tx => {
      // Serialize slot checks and reservations so concurrent checkouts cannot overbook.
      await tx.$queryRaw`SELECT "id" FROM "DeliveryConfiguration" WHERE "id" = 'global' FOR UPDATE`;
      if (user?.role === 'CUSTOMER') await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
      const config = await tx.deliveryConfiguration.findUnique({ where: { id: 'global' } });
      if (!config) throw new Error('DELIVERY_CONFIGURATION_MISSING');
      const ids = [...new Set(input.items.map(item => item.productId))];
      const [catalog, ingredients] = await Promise.all([
        tx.product.findMany({ where: { id: { in: ids }, active: true }, include: { category: true, sizes: true, extras: true } }),
        tx.ingredient.findMany({ where: { active: true } }),
      ]);
      const products = attachGlobalPizzaIngredients(catalog, ingredients);
      const preview = previewCatalogCart(products, input.items, { mode: input.mode, zoneId: addressResult?.zoneId });
      if (!preview.fulfillment.eligible) throw new Error('MINIMUM_NOT_MET');
      const loyaltyStatus = user?.role === 'CUSTOMER' ? await (async () => {
        const now = new Date();
        const [completed, reserved] = await Promise.all([
          tx.order.aggregate({ where: { userId: user.id, status: 'COMPLETED', paymentStatus: { in: ['PAID', 'CREDITED'] } }, _sum: { loyaltyPaidDishCount: true } }),
          tx.order.aggregate({ where: { userId: user.id, loyaltyFreeDishCount: { gt: 0 }, OR: [
            { paymentStatus: { in: ['PAID', 'CREDITED'] }, status: { notIn: ['CANCELLED', 'REJECTED'] } },
            { paymentStatus: 'PENDING', status: 'PENDING', placedAt: { gt: new Date(now.getTime() - 45 * 60_000) } },
          ] }, _sum: { loyaltyFreeDishCount: true } }),
        ]);
        return { paidDishCount: completed._sum.loyaltyPaidDishCount ?? 0, reservedFreeDishCount: reserved._sum.loyaltyFreeDishCount ?? 0 };
      })() : null;
      const loyalty = loyaltyStatus ? calculateLoyaltyReward(products, preview.items, loyaltyStatus.paidDishCount, loyaltyStatus.reservedFreeDishCount) : {
        loyaltyPaidDishCount: 0, loyaltyFreeDishCount: 0, loyaltyDiscountCents: 0, loyaltyFreeByLine: Array(preview.items.length).fill(0),
      };
      const automatic = await tx.promotion.findFirst({ where: { kind: 'AUTOMATIC', active: true }, orderBy: { updatedAt: 'desc' } });
      const hasPastOrder = user?.role === 'CUSTOMER' ? !!await tx.order.findFirst({ where: { userId: user.id, OR: [
        { paymentStatus: { in: ['PAID', 'CREDITED'] } },
        { paymentStatus: 'PENDING', status: 'PENDING', placedAt: { gt: new Date(Date.now() - 45 * 60_000) } },
      ] }, select: { id: true } }) : true;
      const discount = selectPromotion({ automatic: automatic?.firstOrderOnly && (user?.role !== 'CUSTOMER' || hasPastOrder) ? null : automatic, subtotalCents: preview.subtotalCents - loyalty.loyaltyDiscountCents });
      const pizzaCount = input.items.reduce((sum, item) => sum + (products.find((p: {id:string;category:{fulfillmentCategory:string}}) => p.id === item.productId)?.category.fulfillmentCategory === 'PIZZA' ? item.quantity : 0), 0);
      const date = brusselsDateKey(input.scheduledFor);
      const day = brusselsDayWindow(new Date(`${date}T12:00:00.000Z`));
      const reservations = await tx.order.findMany({
        where: { scheduledFor: { gte: day.start, lt: day.end }, OR: [
          { paymentStatus: { in: ['PAID', 'CREDITED'] }, status: { notIn: ['CANCELLED','REJECTED'] } },
          { paymentStatus: 'PENDING', placedAt: { gt: new Date(Date.now() - 45 * 60_000) }, status: 'PENDING' },
        ] }, select: { scheduledFor: true, pizzaCount: true },
      });
      const usedBySlot: Record<string, number> = {};
      for (const row of reservations) if (row.scheduledFor) usedBySlot[row.scheduledFor.toISOString()] = (usedBySlot[row.scheduledFor.toISOString()] ?? 0) + row.pizzaCount;
      const slots = availableSlots({ date, mode: input.mode, now: new Date(), pizzaCount, usedBySlot, leadTimeMinutes: config.leadTimeMinutes, slotPizzaCapacity: config.slotPizzaCapacity });
      if (!slots.some((slot: {value:string}) => slot.value === input.scheduledFor.toISOString())) throw new Error('SLOT_UNAVAILABLE');
      const publicReference = `ROMA-${randomUUID().replaceAll('-','').slice(0,20).toUpperCase()}`;
      let creditAppliedCents = 0;
      if (input.useCredit) {
        const [entries, reservations] = await Promise.all([
          tx.storeCreditEntry.aggregate({ where: { userId: user!.id }, _sum: { amountCents: true } }),
          tx.storeCreditReservation.aggregate({ where: { userId: user!.id, status: 'ACTIVE' }, _sum: { amountCents: true } }),
        ]);
        const balance = (entries._sum.amountCents ?? 0) - (reservations._sum.amountCents ?? 0);
        if (balance <= 0) throw new Error('CREDIT_BALANCE_CHANGED');
        creditAppliedCents = balance >= discount.totalCents
          ? discount.totalCents
          : Math.min(balance, Math.max(0, discount.totalCents - 50));
      }
      const fullyCredited = creditAppliedCents > 0 && creditAppliedCents === discount.totalCents;
      if (discount.promotion?.id) {
        const used = await tx.promotion.updateMany({ where: { id: discount.promotion.id, active: true, OR: [
          { usageLimit: null }, { usageCount: { lt: automatic?.usageLimit ?? 2_147_483_647 } },
        ] }, data: { usageCount: { increment: 1 } } });
        if (used.count !== 1) throw new Error('PROMOTION_UNAVAILABLE');
      }
      const created = await tx.order.create({ data: {
        publicReference, requestKey: input.requestKey, requestHash, userId: user?.role === 'CUSTOMER' ? user.id : null,
        guestEmail: input.email, fulfillment: input.mode === 'delivery' ? 'DELIVERY' : 'PICKUP', status: fullyCredited ? 'ACCEPTED' : 'PENDING', paymentStatus: fullyCredited ? 'CREDITED' : 'PENDING',
        totalCents: discount.totalCents, subtotalCents: preview.subtotalCents, discountCents: discount.discountCents,
        loyaltyDiscountCents: loyalty.loyaltyDiscountCents, loyaltyPaidDishCount: loyalty.loyaltyPaidDishCount, loyaltyFreeDishCount: loyalty.loyaltyFreeDishCount,
        promotionId: discount.promotion?.id, promotionName: discount.promotion?.name,
        creditAppliedCents, currency: 'EUR', contactName: input.contactName, phone: input.phone,
        address: input.address, zoneId: addressResult?.zoneId, scheduledFor: input.scheduledFor, pizzaCount, comment: input.comment,
        itemsSnapshot: JSON.parse(JSON.stringify(preview.items.map((item, index) => ({ ...item, loyaltyFreeQuantity: loyalty.loyaltyFreeByLine[index] ?? 0 })))),
        items: { create: preview.items.map((item: {productId:string;label:string;quantity:number;unitCents:number}) => ({ productId: item.productId, nameSnapshot: item.label, quantity: item.quantity, unitPriceCents: item.unitCents })) },
      } });
      if (creditAppliedCents > 0) {
        if (fullyCredited) await tx.storeCreditEntry.create({ data: { userId: user!.id, orderId: created.id, kind: 'ORDER_REDEMPTION', amountCents: -creditAppliedCents } });
        else await tx.storeCreditReservation.create({ data: { userId: user!.id, orderId: created.id, amountCents: creditAppliedCents } });
      }
      return created;
    });

    if (order.paymentStatus === 'CREDITED') return Response.json({ url: `/commande/confirmation?order_id=${encodeURIComponent(order.id)}` }, { status: 201, headers: { 'Cache-Control': 'no-store' } });

    const form = new URLSearchParams();
    const fields: Record<string,string> = {
      mode: 'payment', locale: 'fr', customer_email: input.email, client_reference_id: order.id,
      success_url: `${origin.origin}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin.origin}/commande/paiement-annule?reference=${encodeURIComponent(order.publicReference)}`,
      'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(order.totalCents - order.creditAppliedCents),
      'line_items[0][price_data][product_data][name]': `Commande Pizzeria Roma ${order.publicReference}`,
      'metadata[orderId]': order.id, 'payment_intent_data[metadata][orderId]': order.id,
      'payment_method_types[0]': configuredStripeMethods()[0], 'payment_method_types[1]': configuredStripeMethods()[1],
      expires_at: String(Math.floor(Date.now()/1000) + 45*60),
    };
    for (const [key,value] of Object.entries(fields)) form.set(key,value);
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `roma-order-${order.id}` },
      body: form, cache: 'no-store',
    });
    const session = await stripeResponse.json() as { id?: string; url?: string; error?: {message?:string} };
    if (!stripeResponse.ok || !session.id || !session.url) {
      await prisma.$transaction(async tx => {
        await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', paymentStatus: 'FAILED' } });
        await tx.storeCreditReservation.updateMany({ where: { orderId: order.id, status: 'ACTIVE' }, data: { status: 'RELEASED' } });
        if (order.promotionId) await tx.promotion.updateMany({ where: { id: order.promotionId, usageCount: { gt: 0 } }, data: { usageCount: { decrement: 1 } } });
      });
      return fail(503, 'PAYMENT_SESSION_FAILED');
    }
    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    return Response.json({ url: session.url }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return fail(409, 'REQUEST_CONFLICT');
    const code = error instanceof Error ? error.message : '';
    const status = code === 'ADDRESS_OUTSIDE_DELIVERY' || code === 'ADDRESS_NOT_FOUND' ? 422
      : code === 'SLOT_UNAVAILABLE' || code === 'MINIMUM_NOT_MET' ? 409
      : code === 'PROMOTION_UNAVAILABLE' ? 409
      : ['INVALID_ORDER','INVALID_SLOT','INVALID_CART','INVALID_SIZE','INVALID_EXTRAS','INVALID_REMOVALS','PRODUCT_UNAVAILABLE','UNKNOWN_ZONE','LOGIN_REQUIRED_FOR_CREDIT','CREDIT_BALANCE_CHANGED'].includes(code) ? 400 : 503;
    return fail(status, status === 503 ? 'ORDER_UNAVAILABLE' : code);
  }
}
