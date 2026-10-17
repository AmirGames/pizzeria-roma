import { prisma } from '../../../../lib/db';
import { getCurrentUser } from '../../../../lib/auth';
import { getCustomerRealLoyaltyStatus } from '../../../../lib/customer-loyalty';
import { realOrdersEnabled } from '../../../../lib/real-orders';
import { previewCatalogCart } from '../../../../lib/catalog-cart-preview.mjs';
// @ts-ignore JavaScript module
import { attachGlobalPizzaIngredients } from '../../../../lib/global-pizza-ingredients.mjs';
// @ts-ignore JavaScript module
import { selectPromotion } from '../../../../lib/promotions.mjs';
// @ts-ignore JavaScript module
import { calculateLoyaltyReward } from '../../../../lib/loyalty.mjs';

export async function POST(request: Request) {
  if (!realOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  let body: unknown;
  try { const raw = await request.text(); if (raw.length > 16_384) return Response.json({ error: 'TOO_LARGE' }, { status: 413 }); body = JSON.parse(raw); }
  catch { return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  const input = body as { items?: unknown; mode?: unknown; zoneId?: unknown };
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 30 || !['pickup','delivery'].includes(String(input.mode)) || (input.zoneId !== undefined && typeof input.zoneId !== 'string')) return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  try {
    const selections = input.items as Array<{productId:string;quantity:number;sizeId?:string;extraIds?:string[];removedIngredients?:string[]}>;
    if (selections.some(item => !item || typeof item.productId !== 'string')) return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    const ids = [...new Set(selections.map(item => item.productId))];
    const [products, ingredients] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: ids }, active: true }, include: { category: true, sizes: true, extras: true } }),
      prisma.ingredient.findMany({ where: { active: true } }),
    ]);
    const preview = previewCatalogCart(attachGlobalPizzaIngredients(products, ingredients), selections, { mode: input.mode as 'delivery'|'pickup', zoneId: input.zoneId as string | undefined });
    const [user, automaticRaw] = await Promise.all([
      getCurrentUser(),
      prisma.promotion.findFirst({ where: { kind: 'AUTOMATIC', active: true }, orderBy: { updatedAt: 'desc' } }),
    ]);
    const loyaltyStatus = user?.role === 'CUSTOMER' ? await getCustomerRealLoyaltyStatus(user.id) : null;
    const loyalty = loyaltyStatus ? calculateLoyaltyReward(products, preview.items, loyaltyStatus.paidDishCount, loyaltyStatus.reservedFreeDishCount) : {
      loyaltyPaidDishCount: 0, loyaltyFreeDishCount: 0, loyaltyDiscountCents: 0, loyaltyFreeByLine: Array(preview.items.length).fill(0),
    };
    const hasPastOrder = user?.role === 'CUSTOMER' ? !!await prisma.order.findFirst({ where: { userId: user.id, OR: [
      { paymentStatus: { in: ['PAID', 'CREDITED'] } },
      { paymentStatus: 'PENDING', status: 'PENDING', placedAt: { gt: new Date(Date.now() - 45 * 60_000) } },
    ] }, select: { id: true } }) : true;
    const automatic = automaticRaw?.firstOrderOnly && (user?.role !== 'CUSTOMER' || hasPastOrder) ? null : automaticRaw;
    const discount = selectPromotion({ automatic, subtotalCents: preview.subtotalCents - loyalty.loyaltyDiscountCents });
    return Response.json({ ...preview, ...discount, ...loyalty, items: preview.items.map((item, index) => ({ ...item, loyaltyFreeQuantity: loyalty.loyaltyFreeByLine[index] ?? 0 })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'PRODUCT_UNAVAILABLE' ? 404 : ['INVALID_CART','INVALID_REMOVALS','INVALID_EXTRAS','INVALID_SIZE','INVALID_COUNT','INVALID_MODE','UNKNOWN_ZONE','INVALID_PRICE','PRICE_OVERFLOW'].includes(code) ? 400 : 503;
    return Response.json({ error: status === 503 ? 'CATALOG_UNAVAILABLE' : code }, { status });
  }
}
