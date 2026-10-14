/**
 * Pure pricing engine for a single configurable product.
 * Monetary values are integer euro cents, never floating point.
 * Input prices MUST come from trusted server-side catalog records.
 */
export function priceItem({ baseCents, sizeSurchargeCents = 0, extras = [], quantity = 1 }) {
  const validCents = value => Number.isSafeInteger(value) && value >= 0;
  if (!validCents(baseCents) || !validCents(sizeSurchargeCents)) {
    throw new RangeError('Invalid price');
  }
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new RangeError('Invalid quantity');
  }
  if (!Array.isArray(extras) || extras.length > 30 || !extras.every(validCents)) {
    throw new RangeError('Invalid extras');
  }
  const unitCents = [baseCents, sizeSurchargeCents, ...extras].reduce((a, b) => {
    const sum = a + b;
    if (!Number.isSafeInteger(sum)) throw new RangeError('Price overflow');
    return sum;
  }, 0);
  const totalCents = unitCents * quantity;
  if (!Number.isSafeInteger(totalCents)) throw new RangeError('Price overflow');
  return { unitCents, totalCents, quantity };
}
