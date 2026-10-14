import { prisma } from '../../../../lib/db';
// @ts-ignore JavaScript module; covered by unit tests
import { previewCatalogCart } from '../../../../lib/catalog-cart-preview.mjs';

const MAX_CART_LINES = 30;
const allowedBodyKeys = new Set(['items', 'mode', 'zoneId']);

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

  const input = body as { items?: unknown; mode?: unknown; zoneId?: unknown };
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > MAX_CART_LINES ||
      !['delivery', 'pickup'].includes(String(input.mode)) ||
      (input.zoneId !== undefined && typeof input.zoneId !== 'string')) {
    return jsonError(400, 'INVALID_REQUEST');
  }
  if (input.items.some(item => !item || typeof item !== 'object' || Array.isArray(item) ||
      typeof (item as { productId?: unknown }).productId !== 'string' ||
      (item as { productId: string }).productId.length > 128 ||
      !(item as { productId: string }).productId)) {
    return jsonError(400, 'INVALID_REQUEST');
  }

  try {
    const selections = input.items as Array<{ productId: string; sizeId?: string; extraIds?: string[]; quantity: number }>;
    const productIds = [...new Set(selections.map(item => item.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: {
        id: true,
        nameFr: true,
        active: true,
        baseCents: true,
        choiceLabel: true,
        extraSelectionMode: true,
        category: { select: { fulfillmentCategory: true } },
        sizes: { select: { id: true, label: true, priceCents: true, active: true } },
        extras: { select: { id: true, priceCents: true, active: true } },
      },
    });
    const preview = previewCatalogCart(products, selections, {
      mode: input.mode as 'delivery' | 'pickup',
      zoneId: input.zoneId as string | undefined,
    });
    return Response.json(preview);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (['INVALID_CART', 'INVALID_EXTRAS', 'INVALID_SIZE', 'INVALID_COUNT', 'INVALID_MODE', 'UNKNOWN_ZONE', 'INVALID_PRICE', 'PRICE_OVERFLOW'].includes(code)) {
      return jsonError(400, code);
    }
    if (code === 'PRODUCT_UNAVAILABLE') return jsonError(404, code);
    return jsonError(503, 'CATALOG_UNAVAILABLE');
  }
}
