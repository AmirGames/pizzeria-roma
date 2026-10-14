/** Pure cart logic. All client-side amounts are previews, never authoritative. */
export function cartTotal(items) {
  if (!Array.isArray(items)) throw new TypeError('Invalid cart');
  return items.reduce((sum, item) => {
    if (!Number.isSafeInteger(item.unitCents) || item.unitCents < 0 ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new RangeError('Invalid cart item');
    }
    const line = item.unitCents * item.quantity;
    if (!Number.isSafeInteger(line) || !Number.isSafeInteger(sum + line)) throw new RangeError('Price overflow');
    return sum + line;
  }, 0);
}
export function setCartQuantity(items, key, quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 99) throw new RangeError('Invalid quantity');
  return items.flatMap(item => item.key === key ? (quantity === 0 ? [] : [{ ...item, quantity }]) : [item]);
}
export function addCartItem(items, incoming) {
  if (!incoming || typeof incoming.key !== 'string' || !incoming.key) throw new TypeError('Invalid item');
  const existing = items.find(item => item.key === incoming.key);
  if (existing) return setCartQuantity(items, incoming.key, existing.quantity + incoming.quantity);
  const result = [...items, incoming];
  cartTotal(result);
  return result;
}
