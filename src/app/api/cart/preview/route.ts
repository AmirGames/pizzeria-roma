import { prisma } from '../../../../lib/db';
import { getCurrentUser } from '../../../../lib/auth';
import { getCustomerLoyaltyStatus } from '../../../../lib/customer-loyalty';
// @ts-ignore JavaScript module
import { attachGlobalPizzaIngredients } from '../../../../lib/global-pizza-ingredients.mjs';
// @ts-ignore JavaScript module; covered by unit tests
import { previewCatalogCart } from '../../../../lib/catalog-cart-preview.mjs';
// @ts-ignore JavaScript module
import { normalizePromotionCode, selectPromotion } from '../../../../lib/promotions.mjs';
// @ts-ignore JavaScript module
import { calculateLoyaltyReward } from '../../../../lib/loyalty.mjs';

const MAX_CART_LINES = 30;
const allowedBodyKeys = new Set(['items', 'mode', 'zoneId', 'promoCode']);

function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 16_384) return jsonError(413, 'REQUEST_TOO_LARGE');
    body = JSON.parse(raw);
  } catch {
    return jsonError(400, 'INVALID_REQUEST');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !allowedBodyKeys.has(key))) {
    return jsonError(400, 'INVALID_REQUEST');
  }

  const input = body as { items?: unknown; mode?: unknown; zoneId?: unknown; promoCode?: unknown };
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > MAX_CART_LINES ||
      !['delivery', 'pickup'].includes(String(input.mode)) ||
      (input.zoneId !== undefined && typeof input.zoneId !== 'string') ||
      (input.promoCode !== undefined && (typeof input.promoCode !== 'string' || input.promoCode.length > 32))) {
    return jsonError(400, 'INVALID_REQUEST');
  }
  if (input.items.some(item => !item || typeof item !== 'object' || Array.isArray(item) ||
      typeof (item as { productId?: unknown }).productId !== 'string' ||
      (item as { productId: string }).productId.length > 128 ||
      !(item as { productId: string }).productId)) {
    return jsonError(400, 'INVALID_REQUEST');
  }

  try {
    const selections = input.items as Array<{ productId: string; sizeId?: string; extraIds?: string[]; removedIngredients?: string[]; quantity: number }>;
    const productIds = [...new Set(selections.map(item => item.productId))];
    const [catalogProducts, ingredients] = await Promise.all([prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: {
        id: true,
        nameFr: true,
        active: true,
        baseCents: true, removableIngredients: true,
        choiceLabel: true,
        extraSelectionMode: true,
        category: { select: { fulfillmentCategory: true } },
        sizes: { orderBy: [{ priceCents: 'asc' }, { label: 'asc' }], select: { id: true, label: true, priceCents: true, active: true } },
        extras: { select: { id: true, nameFr: true, priceCents: true, sizePrices: true, active: true } },
      },
    }), prisma.ingredient.findMany({ where: { active: true } })]);
    const products = attachGlobalPizzaIngredients(catalogProducts, ingredients);
    const preview = previewCatalogCart(products, selections, {
      mode: input.mode as 'delivery' | 'pickup',
      zoneId: input.zoneId as string | undefined,
    });
    const user = await getCurrentUser();
    const loyaltyStatus = user?.role === 'CUSTOMER' ? await getCustomerLoyaltyStatus(user.id) : null;
    const loyalty = loyaltyStatus ? calculateLoyaltyReward(products, preview.items, loyaltyStatus.paidDishCount, loyaltyStatus.reservedFreeDishCount) : { loyaltyPaidDishCount: 0, loyaltyFreeDishCount: 0, loyaltyDiscountCents: 0, loyaltyFreeByLine: Array(preview.items.length).fill(0) };
    const [automatic, codePromotion] = await Promise.all([
      prisma.promotion.findFirst({ where: { kind: 'AUTOMATIC', active: true }, orderBy: { updatedAt: 'desc' } }),
      input.promoCode?.trim() ? prisma.promotion.findUnique({ where: { code: normalizePromotionCode(input.promoCode) } }) : Promise.resolve(null),
    ]);
    const discount = selectPromotion({ automatic, codePromotion, code: input.promoCode, subtotalCents: preview.subtotalCents - loyalty.loyaltyDiscountCents });
    return Response.json({ ...preview, ...discount, ...loyalty, items: preview.items.map((item, index) => ({ ...item, loyaltyFreeQuantity: loyalty.loyaltyFreeByLine[index] ?? 0 })) });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (['INVALID_CART', 'INVALID_REMOVALS', 'INVALID_EXTRAS', 'INVALID_SIZE', 'INVALID_COUNT', 'INVALID_MODE', 'UNKNOWN_ZONE', 'INVALID_PRICE', 'PRICE_OVERFLOW'].includes(code)) {
      return jsonError(400, code);
    }
    if (code === 'PRODUCT_UNAVAILABLE') return jsonError(404, code);
    return jsonError(503, 'CATALOG_UNAVAILABLE');
  }
}
