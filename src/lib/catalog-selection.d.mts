import type { CatalogProduct } from './catalog-types';
import type { CatalogCartLine } from './catalog-cart.mjs';
export function initializeCatalogSelection(product: CatalogProduct, initial?: CatalogCartLine): { sizeId: string; extraIds: string[]; removedIngredients: string[]; changed: boolean };
