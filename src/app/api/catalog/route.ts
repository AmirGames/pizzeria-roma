import { prisma } from '../../../lib/db';
// @ts-ignore JavaScript module
import { attachGlobalPizzaIngredients } from '../../../lib/global-pizza-ingredients.mjs';
// @ts-ignore JavaScript module; covered by unit tests
import { buildPublicCatalog } from '../../../lib/public-catalog.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [categories, ingredients] = await Promise.all([prisma.menuCategory.findMany({
      orderBy: [{ position: 'asc' }, { nameFr: 'asc' }],
      select: {
        id: true, nameFr: true, position: true, fulfillmentCategory: true,
        products: { where: { active: true }, select: {
          id: true, nameFr: true, active: true, baseCents: true, ingredients: true, removableIngredients: true, choiceLabel: true, extraSelectionMode: true,
          sizes: { where: { active: true }, orderBy: [{ priceCents: 'asc' }, { label: 'asc' }], select: { id: true, label: true, priceCents: true, active: true } },
          extras: { where: { active: true }, select: { id: true, nameFr: true, priceCents: true, sizePrices: true, active: true } },
        } },
      },
    }), prisma.ingredient.findMany({ where: { active: true }, orderBy: { nameFr: 'asc' } })]);
    const withGlobalIngredients = categories.map(category => ({ ...category, products: attachGlobalPizzaIngredients(category.products.map(product => ({ ...product, category: { fulfillmentCategory: category.fulfillmentCategory } })), ingredients) }));
    return Response.json({ categories: buildPublicCatalog(withGlobalIngredients) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/catalog] Failed to load the public catalog:', error);
    return Response.json({ error: 'CATALOG_UNAVAILABLE' }, { status: 503 });
  }
}
