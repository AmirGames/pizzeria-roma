import { unstable_cache } from 'next/cache';
import { prisma } from './db';
// @ts-ignore JavaScript module
import { attachGlobalPizzaIngredients } from './global-pizza-ingredients.mjs';
// @ts-ignore JavaScript module
import { buildPublicCatalog } from './public-catalog.mjs';
import type { CatalogProduct } from './catalog-types';

export type PublicCatalogCategory = { id: string; nameFr: string; products: CatalogProduct[] };

async function queryPublicCatalog(): Promise<PublicCatalogCategory[]> {
  const [categories, ingredients] = await Promise.all([
    prisma.menuCategory.findMany({
      orderBy: [{ position: 'asc' }, { nameFr: 'asc' }],
      select: {
        id: true, nameFr: true, position: true, fulfillmentCategory: true,
        products: { where: { active: true }, select: {
          id: true, nameFr: true, active: true, baseCents: true, ingredients: true, removableIngredients: true, choiceLabel: true, extraSelectionMode: true,
          sizes: { where: { active: true }, orderBy: [{ priceCents: 'asc' }, { label: 'asc' }], select: { id: true, label: true, priceCents: true, active: true } },
          extras: { where: { active: true }, select: { id: true, nameFr: true, priceCents: true, sizePrices: true, active: true } },
        } },
      },
    }),
    prisma.ingredient.findMany({ where: { active: true }, orderBy: { nameFr: 'asc' } }),
  ]);
  const withGlobalIngredients = categories.map(category => ({
    ...category,
    products: attachGlobalPizzaIngredients(category.products.map(product => ({ ...product, category: { fulfillmentCategory: category.fulfillmentCategory } })), ingredients),
  }));
  return buildPublicCatalog(withGlobalIngredients) as PublicCatalogCategory[];
}

const loadCachedPublicCatalog = unstable_cache(queryPublicCatalog, ['public-catalog-v1'], {
  revalidate: 120,
  tags: ['public-catalog'],
});

export async function loadPublicCatalog(): Promise<PublicCatalogCategory[]> {
  return loadCachedPublicCatalog();
}
