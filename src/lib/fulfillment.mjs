/**
 * Business policy draft. Only the restaurant can approve zone boundaries and times.
 * This module does not geocode or confirm an address belongs to a zone.
 */
export const DELIVERY_MINIMUMS = Object.freeze({
  'namur-centre': 1,
  'belgrade': 2,
  'erpent': 2,
  'saint-servais': 2,
});
export const DELIVERY_ZONES = Object.freeze([
  { id: 'namur-centre', label: 'Namur centre' },
  { id: 'belgrade', label: 'Belgrade' },
  { id: 'erpent', label: 'Erpent' },
  { id: 'saint-servais', label: 'Saint-Servais' },
]);
/** Count quantities of pizza and pasta only, never drinks, desserts or salads. 
 * Product categories must come from trusted server-side catalog records.
 */
export function countEligibleDishes(items) {
  if (!Array.isArray(items)) throw new Error('INVALID_ITEMS');
  return items.reduce((count, item) => {
    if (!item || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error('INVALID_ITEMS');
    if (!['pizza', 'pasta', 'other'].includes(item.category)) throw new Error('INVALID_CATEGORY');
    const next = count + (item.category === 'pizza' || item.category === 'pasta' ? item.quantity : 0);
    if (!Number.isSafeInteger(next)) throw new Error('INVALID_COUNT');
    return next;
  }, 0);
}
export function minimumMainDishes(zoneId) {
  if (!Object.hasOwn(DELIVERY_MINIMUMS, zoneId)) throw new Error('UNKNOWN_ZONE');
  return DELIVERY_MINIMUMS[zoneId];
}
export function evaluateDelivery({ mode, zoneId, mainDishCount }) {
  if (mode === 'pickup') return { eligible: true, minimum: 0, deliveryFeeCents: 0 };
  if (mode !== 'delivery') throw new Error('INVALID_MODE');
  if (!Number.isSafeInteger(mainDishCount) || mainDishCount < 0) throw new Error('INVALID_COUNT');
  const minimum = minimumMainDishes(zoneId);
  return { eligible: mainDishCount >= minimum, minimum, deliveryFeeCents: 0 };
}
/** Restaurant local weekday: 0 Sun, 1 Mon ... 6 Sat. */
export function serviceWindows(weekday) {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error('INVALID_WEEKDAY');
  if (weekday === 0) return [];
  if (weekday === 6) return [{ start: '18:00', end: '22:00' }];
  return [{ start: '11:30', end: '14:00' }, { start: '18:00', end: '22:00' }];
}
export function isWithinService(weekday, time) {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  return serviceWindows(weekday).some(({ start, end }) => time >= start && time < end);
}
