export type PizzaCreationData = { categoryId: string; nameFr: string; nameEn: string; active: false; baseCents: number; removableIngredients: string[]; sizes: { create: Array<{ label: string; priceCents: number }> } };
export function validatePizzaCreation(input: unknown): PizzaCreationData;
