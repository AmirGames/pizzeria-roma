/** Null means the existing flat price; an explicit map permits only its sizes. */
export function validateSizePrices(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length < 1 || Object.keys(value).length > 30 ||
      Object.entries(value).some(([id, cents]) => !id || id.length > 128 || !Number.isSafeInteger(cents) || cents < 0 || cents > 2147483647)) {
    throw new Error('CATALOG_INVALID');
  }
  return value;
}

export function extraPriceForSize(extra, sizeId) {
  if (extra.sizePrices == null) return extra.priceCents;
  const prices = validateSizePrices(extra.sizePrices);
  if (!Object.hasOwn(prices, sizeId)) throw new Error('INVALID_EXTRAS');
  return prices[sizeId];
}
