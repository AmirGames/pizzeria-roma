import { prisma } from '../../../../lib/db';
import { requirePermission } from '../../../../lib/auth';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
// @ts-ignore JavaScript module
import { validateMenuItem } from '../../../../lib/menu-management.mjs';

export async function POST(request: Request) {
  try {
    await requirePermission('catalog:write');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 16384) return Response.json({ error: 'REQUEST_TOO_LARGE' }, { status: 413 });
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return Response.json({ error: 'INVALID_PIZZA' }, { status: 400 }); }
    const data = validateMenuItem(input);
    const product = await prisma.$transaction(async tx => {
      const category = await tx.menuCategory.findUnique({ where: { id: data.categoryId } });
      if (!category || (category.fulfillmentCategory !== 'PIZZA' && data.removableIngredients.length) || (category.fulfillmentCategory === 'PIZZA' && data.ingredients.length === 0)) throw new Error('INVALID_MENU_ITEM');
      return tx.product.create({ data, include: { category: true, sizes: { orderBy: { priceCents: 'asc' } }, extras: true } });
    });
    return Response.json({ product }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : code === 'INVALID_MENU_ITEM' ? 400 : 503;
    return Response.json({ error: status === 503 ? 'CATALOG_UNAVAILABLE' : code }, { status });
  }
}
