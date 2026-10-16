function invalid() { throw new Error('INVALID_INGREDIENT'); }
function text(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim() !== value || value.length > 128) invalid();
  return value;
}
function cents(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 2147483647) invalid();
  return value;
}
export function validateIngredient(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['nameFr', 'nameEn', 'price33Cents', 'price50Cents', 'active'].includes(key))) invalid();
  if (typeof input.active !== 'boolean') invalid();
  return { nameFr: text(input.nameFr), nameEn: text(input.nameEn), price33Cents: cents(input.price33Cents), price50Cents: cents(input.price50Cents), active: input.active };
}
