import type { CatalogCartLine } from './catalog-cart.mjs';
import type { CatalogProduct, CatalogCartPreview } from './catalog-cart-preview.mjs';
export type CustomerReorder = { items: CatalogCartLine[]; preview: CatalogCartPreview; previousTotalCents: number };
export function prepareCustomerReorder(products: CatalogProduct[], snapshot: unknown): Omit<CustomerReorder, 'previousTotalCents'>;
export function appendCustomerReorder(rawCart: string | null, selections: CatalogCartLine[]): CatalogCartLine[];
