/** Accept only draft pizza data. Category and identifiers are resolved on the server. */
export function validatePizzaCreation(input) {
  const fail = () => { throw new Error('INVALID_PIZZA'); };
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some(key => !['categoryId', 'nameFr', 'price33Cents', 'price50Cents', 'removableIngredients'].includes(key))) fail();
  if (typeof input.categoryId !== 'string' || !input.categoryId || input.categoryId.length > 128 ||
      typeof input.nameFr !== 'string' || !input.nameFr.trim() || input.nameFr !== input.nameFr.trim() || input.nameFr.length > 128) fail();
  const price = value => Number.isSafeInteger(value) && value >= 0 && value <= 2147483647;
  if (!price(input.price33Cents) || (input.price50Cents !== undefined && !price(input.price50Cents))) fail();
  if (!Array.isArray(input.removableIngredients) || input.removableIngredients.length > 30 ||
      new Set(input.removableIngredients).size !== input.removableIngredients.length ||
      !input.removableIngredients.every(value => typeof value === 'string' && value.trim() && value === value.trim() && value.length <= 128)) fail();
  return {
    categoryId: input.categoryId, nameFr: input.nameFr, nameEn: input.nameFr,
    active: false, baseCents: 0, removableIngredients: [...input.removableIngredients],
    sizes: { create: [{ label: '33 cm', priceCents: input.price33Cents }, ...(input.price50Cents === undefined ? [] : [{ label: '50 cm', priceCents: input.price50Cents }])] },
  };
}
