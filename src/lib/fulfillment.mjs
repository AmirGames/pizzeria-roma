/**
 * Business policy draft. Only the restaurant can approve zone boundaries and times.
 * This module does not geocode or confirm an address belongs to a zone.
 */
export const DOUBLE_DISH_THRESHOLD_CENTS = 1800;
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
 * Product categories, sizes and configured unit prices must come from trusted server-side catalog records.
 */
export function countEligibleDishes(items) {
  if (!Array.isArray(items)) throw new Error('INVALID_ITEMS');
  return items.reduce((count, item) => {
    if (!item || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error('INVALID_ITEMS');
    if (!['pizza', 'pasta', 'other'].includes(item.category)) throw new Error('INVALID_CATEGORY');
    // The 50 cm maxi counts as two dishes. This must be based on a
    // trusted product-size record, never a client-supplied size label.
    if (item.category === 'pizza' && !['33', '50'].includes(item.sizeCm)) throw new Error('INVALID_SIZE');
    let multiplier = item.category === 'pasta' ? 1 : 0;
    if (item.category === 'pizza') {
      if (!Number.isSafeInteger(item.unitCents) || item.unitCents < 0) throw new Error('INVALID_PRICE');
      // Trusted, per-unit configured price including supplements, excluding delivery.
      multiplier = item.sizeCm === '50' || item.unitCents >= DOUBLE_DISH_THRESHOLD_CENTS ? 2 : 1;
    }
    const next = count + item.quantity * multiplier;
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

/** Return Belgian legal public holidays as local calendar dates (without substitute days). */
export function isBelgianPublicHoliday(year, month, day) {
  const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const fixedHolidays = new Set([
    '01-01', '05-01', '07-21', '08-15', '11-01', '11-11', '12-25',
  ]);
  if (fixedHolidays.has(key)) return true;

  // Gregorian Easter date (Meeus/Jones/Butcher), then the three movable holidays.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(Date.UTC(year, easterMonth - 1, easterDay));
  const date = new Date(Date.UTC(year, month - 1, day));
  const daysAfterEaster = Math.round((date - easter) / 86_400_000);
  return daysAfterEaster === 1 || daysAfterEaster === 39 || daysAfterEaster === 50;
}

/**
 * Informational check in the restaurant timezone. Legal Belgian holidays use
 * the printed 18:00–22:00 schedule, except Sundays which remain closed.
 */
export function isWithinRestaurantService(instant) {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) return false;

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const weekday = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[values.weekday];
  if (weekday === undefined || !values.year || !values.month || !values.day || !values.hour || !values.minute) return false;
  if (weekday === 0) return false;
  const time = `${values.hour}:${values.minute}`;
  if (isBelgianPublicHoliday(Number(values.year), Number(values.month), Number(values.day))) {
    return time >= '18:00' && time < '22:00';
  }
  return isWithinService(weekday, time);
}

/** Preview fulfillment rules from cart lines. Call only with trusted catalog data on a server. */
export function evaluateCartFulfillment({ mode, zoneId, items }) {
  const dishCount = countEligibleDishes(items);
  return { ...evaluateDelivery({ mode, zoneId, mainDishCount: dishCount }), dishCount };
}
