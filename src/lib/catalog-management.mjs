import { validateSizePrices } from './extra-pricing.mjs';

function invalid() { throw new Error('INVALID_CATALOG_EDIT'); }
function object(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) invalid();
}
function text(value, max = 128) {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim() || value.length > max) invalid();
  return value;
}
function cents(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 2147483647) invalid();
  return value;
}
function active(value) { if (typeof value !== 'boolean') invalid(); return value; }

/** Validate a complete edit against the current database product, including ownership. */
export function validateCatalogEdit(input, product) {
  object(input, ['revision', 'nameFr', 'baseCents', 'active', 'removableIngredients', 'sizes', 'extras']);
  if (!Number.isSafeInteger(input.revision) || input.revision < 0) invalid();
  const isPizza = product.category.fulfillmentCategory === 'PIZZA';
  if (!Array.isArray(input.removableIngredients) || input.removableIngredients.length > 30 ||
      new Set(input.removableIngredients).size !== input.removableIngredients.length ||
      (!isPizza && input.removableIngredients.length)) invalid();
  input.removableIngredients.forEach(value => text(value));
  if (!Array.isArray(input.sizes) || input.sizes.length !== product.sizes.length ||
      new Set(input.sizes.map(size => size?.id)).size !== input.sizes.length) invalid();
  const sizes = input.sizes.map(size => {
    object(size, ['id', 'priceCents', 'active']);
    if (!product.sizes.some(current => current.id === size.id)) invalid();
    return { id: size.id, priceCents: cents(size.priceCents), active: active(size.active) };
  });
  if (input.active && (isPizza || product.choiceLabel) && !sizes.some(size => size.active)) invalid();
  if (!Array.isArray(input.extras) || input.extras.length > 20) invalid();
  const ids = input.extras.filter(extra => extra?.id !== undefined).map(extra => extra.id);
  if (new Set(ids).size !== ids.length) invalid();
  const extras = input.extras.map(extra => {
    object(extra, ['id', 'nameFr', 'priceCents', 'active', 'sizePrices']);
    if (extra.id !== undefined && !product.extras.some(current => current.id === extra.id)) invalid();
    let sizePrices = null;
    if (extra.sizePrices != null) {
      if (!isPizza) invalid();
      try { sizePrices = validateSizePrices(extra.sizePrices); } catch { invalid(); }
      if (Object.keys(sizePrices).some(id => !product.sizes.some(size => size.id === id))) invalid();
    }
    return { ...(extra.id ? { id: extra.id } : {}), nameFr: text(extra.nameFr), priceCents: cents(extra.priceCents), active: active(extra.active), sizePrices };
  });
  return { revision: input.revision, nameFr: text(input.nameFr), baseCents: cents(input.baseCents), active: active(input.active), removableIngredients: [...input.removableIngredients], sizes, extras };
}

export function isSameOriginMutation(request, configuredOrigin) {
  try {
    const origin = request.headers.get('origin');
    return !!origin && origin === new URL(configuredOrigin || request.url).origin &&
      request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() === 'application/json' &&
      !['cross-site', 'none'].includes(request.headers.get('sec-fetch-site'));
  } catch { return false; }
}

/** Parse euros without floating point rounding or silently accepting malformed input. */
export function parseEuroCents(value) {
  if (typeof value !== 'string' || !/^\d{1,7}(?:[.,]\d{1,2})?$/.test(value.trim())) invalid();
  const [whole, fraction = ''] = value.trim().replace(',', '.').split('.');
  return cents(Number(whole) * 100 + Number(fraction.padEnd(2, '0')));
}
