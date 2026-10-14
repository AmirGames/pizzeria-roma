export type CatalogCartSelection = { productId: string; quantity: number; sizeId?: string; extraIds?: string[] };
export type CatalogProduct = {
  id: string;
  nameFr: string;
  active: boolean;
  baseCents: number;
  category: { fulfillmentCategory: 'PIZZA' | 'PASTA' | 'OTHER' };
  sizes: Array<{ id: string; label: string; priceCents: number; active: boolean }>;
  extras: Array<{ id: string; priceCents: number; active: boolean }>;
};
export type CatalogCartPreview = {
  items: Array<{ productId: string; label: string; quantity: number; sizeLabel?: string; extraIds: string[]; unitCents: number; totalCents: number }>;
  subtotalCents: number;
  fulfillment: { eligible: boolean; minimum: number; dishCount: number; deliveryFeeCents: number };
};
export function previewCatalogCart(
  products: CatalogProduct[],
  selections: CatalogCartSelection[],
  fulfillment: { mode: 'delivery' | 'pickup'; zoneId?: string },
): CatalogCartPreview;
