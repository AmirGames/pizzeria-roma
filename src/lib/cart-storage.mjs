import { cartTotal } from './cart.mjs';

const validLine = item => item && typeof item === 'object' &&
  typeof item.key === 'string' && item.key.length > 0 && item.key.length <= 120 &&
  typeof item.label === 'string' && item.label.length > 0 &&
  typeof item.details === 'string' &&
  Number.isSafeInteger(item.unitCents) && item.unitCents >= 0 &&
  Number.isSafeInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 99 &&
  ['pizza', 'pasta', 'other'].includes(item.category) &&
  (item.category !== 'pizza' || ['33', '50'].includes(item.sizeCm));

/** Read only the demo cart shape from browser storage; never use it as trusted pricing data. */
export function readCart(raw) {
  if (typeof raw !== 'string') return [];
  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items) || !items.every(validLine)) return [];
    cartTotal(items);
    return items;
  } catch {
    return [];
  }
}
