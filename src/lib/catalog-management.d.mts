export type ManagerProduct = {
  id: string; categoryId: string; nameFr: string; nameEn: string; active: boolean; baseCents: number; catalogRevision: number;
  choiceLabel: string | null; ingredients: string[]; removableIngredients: string[];
  category: { nameFr: string; fulfillmentCategory: 'PIZZA' | 'PASTA' | 'OTHER' };
  sizes: Array<{ id: string; label: string; priceCents: number; active: boolean }>;
  extras: Array<{ id: string; nameFr: string; priceCents: number; active: boolean; sizePrices: unknown }>;
};
export type CatalogEdit = {
  revision: number; nameFr: string; baseCents: number; active: boolean; ingredients: string[]; removableIngredients: string[];
  sizes: Array<{ id: string; priceCents: number; active: boolean }>;
  extras: Array<{ id?: string; nameFr: string; priceCents: number; active: boolean; sizePrices: Record<string, number> | null }>;
};
export function validateCatalogEdit(input: unknown, product: ManagerProduct): CatalogEdit;
export function isSameOriginMutation(request: Request, configuredOrigin?: string): boolean;
export function parseEuroCents(value: string): number;
