function invalid() { throw new Error('INVALID_MENU_ITEM'); }
function text(value, max = 128) {
  if (typeof value !== 'string' || !value.trim() || value.trim() !== value || value.length > max) invalid();
  return value;
}
function cents(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 2147483647) invalid();
  return value;
}
function list(value, max = 40) {
  if (!Array.isArray(value) || value.length > max || new Set(value).size !== value.length) invalid();
  return value.map(item => text(item));
}
export function validateMenuCategory(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['nameFr', 'nameEn', 'fulfillmentCategory', 'position'].includes(key))) invalid();
  if (!['PIZZA', 'PASTA', 'OTHER'].includes(input.fulfillmentCategory) || !Number.isSafeInteger(input.position) || input.position < 0 || input.position > 10000) invalid();
  return { nameFr: text(input.nameFr), nameEn: text(input.nameEn), fulfillmentCategory: input.fulfillmentCategory, position: input.position };
}
export function validateMenuItem(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['categoryId', 'nameFr', 'nameEn', 'baseCents', 'ingredients', 'removableIngredients', 'sizes', 'choiceLabel'].includes(key))) invalid();
  if (typeof input.categoryId !== 'string' || !input.categoryId || input.categoryId.length > 128) invalid();
  if (!Array.isArray(input.sizes) || input.sizes.length > 12 || new Set(input.sizes.map(size => size?.label)).size !== input.sizes.length) invalid();
  const sizes = input.sizes.map(size => {
    if (!size || typeof size !== 'object' || Object.keys(size).some(key => !['label', 'priceCents'].includes(key))) invalid();
    return { label: text(size.label, 40), priceCents: cents(size.priceCents) };
  });
  const categoryId = input.categoryId;
  const nameFr = text(input.nameFr);
  const nameEn = text(input.nameEn);
  const baseCents = cents(input.baseCents);
  if (!sizes.length && baseCents <= 0) invalid();
  return { categoryId, nameFr, nameEn, baseCents, ingredients: list(input.ingredients), removableIngredients: list(input.removableIngredients, 30), choiceLabel: input.choiceLabel == null || input.choiceLabel === '' ? null : text(input.choiceLabel, 60), active: false, sizes: { create: sizes } };
}
