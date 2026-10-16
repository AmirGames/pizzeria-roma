export type CatalogCartSelection = { productId: string; quantity: number; sizeId?: string; extraIds?: string[]; removedIngredients?: string[] };
export type CatalogProduct = {
  id: string;
  nameFr: string;
  active: boolean;
  baseCents: number;
  removableIngredients?: string[];
  category: { fulfillmentCategory: 'PIZZA' | 'PASTA' | 'OTHER' };
  sizes: Array<{ id: string; label: string; priceCents: number; active: boolean }>;
  extras: Array<{ id: string; nameFr?: string; priceCents: number; sizePrices?: unknown; active: boolean }>;
};
export type CatalogCartPreview = {
  items: Array<{ productId: string; label: string; quantity: number; sizeId?: string; sizeLabel?: string; extraIds: string[]; extraLabels: string[]; removedIngredients: string[]; unitCents: number; totalCents: number; loyaltyFreeQuantity?: number }>;
  subtotalCents: number;
  discountCents?: number;
  loyaltyDiscountCents?: number;
  loyaltyFreeDishCount?: number;
  loyaltyPaidDishCount?: number;
  totalCents?: number;
  codeError?: string;
  codeNotSelected?: boolean;
  promotion?: { id: string; name: string; code: string | null } | null;
  pizzaCount: number;
  fulfillment: { eligible: boolean; minimum: number; dishCount: number; deliveryFeeCents: number };
};
export function previewCatalogCart(
  products: CatalogProduct[],
  selections: CatalogCartSelection[],
  fulfillment: { mode: 'delivery' | 'pickup'; zoneId?: string },
): CatalogCartPreview;
