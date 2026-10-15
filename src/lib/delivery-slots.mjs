import { isBelgianPublicHoliday, serviceWindows } from './fulfillment.mjs';

const zone = 'Europe/Brussels';
const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
const offsetFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'longOffset' });

export function brusselsDateKey(instant = new Date()) {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) throw new Error('INVALID_SLOT_DATE');
  const parts = Object.fromEntries(dateFormatter.formatToParts(instant).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function dateOrdinal(dateKey) {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error('INVALID_SLOT_DATE');
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dateKey) throw new Error('INVALID_SLOT_DATE');
  return Math.floor(date.getTime() / 86_400_000);
}

function nextDateKey(dateKey, increment = 1) {
  return new Date((dateOrdinal(dateKey) + increment) * 86_400_000).toISOString().slice(0, 10);
}

function localTimeToUtc(dateKey, time) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const offsetText = offsetFormatter.formatToParts(new Date(instant)).find(part => part.type === 'timeZoneName')?.value;
    const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(offsetText ?? '');
    if (!match) throw new Error('INVALID_SLOT_DATE');
    const offset = (Number(match[2]) * 60 + Number(match[3])) * (match[1] === '+' ? 1 : -1);
    instant = wall - offset * 60_000;
  }
  return new Date(instant);
}

function windowsForDate(dateKey) {
  const ordinal = dateOrdinal(dateKey);
  const weekday = new Date(ordinal * 86_400_000).getUTCDay();
  if (weekday === 0) return [];
  const [year, month, day] = dateKey.split('-').map(Number);
  if (isBelgianPublicHoliday(year, month, day)) return [{ start: '18:00', end: '22:00' }];
  return serviceWindows(weekday);
}

/** Build bookable 15-minute slots for a Brussels local calendar day. */
export function availableSlots({ date, mode, now = new Date(), pizzaCount = 0, usedBySlot = {}, pickupLeadMinutes = 30, slotPizzaCapacity = 7 }) {
  if (!['pickup', 'delivery'].includes(mode) || !(now instanceof Date) || !Number.isFinite(now.getTime()) ||
      !Number.isSafeInteger(pizzaCount) || pizzaCount < 0 || !Number.isSafeInteger(pickupLeadMinutes) ||
      pickupLeadMinutes < 15 || pickupLeadMinutes > 240 || pickupLeadMinutes % 15 !== 0 ||
      !Number.isSafeInteger(slotPizzaCapacity) || slotPizzaCapacity < 1 || slotPizzaCapacity > 70) throw new Error('INVALID_SLOT_REQUEST');
  const today = brusselsDateKey(now);
  if (dateOrdinal(date) < dateOrdinal(today) || dateOrdinal(date) > dateOrdinal(today) + 7) throw new Error('INVALID_SLOT_DATE');
  const earliest = now.getTime() + (mode === 'pickup' ? pickupLeadMinutes * 60_000 : 0);
  const slots = [];
  for (const window of windowsForDate(date)) {
    const [startHour, startMinute] = window.start.split(':').map(Number);
    const [endHour, endMinute] = window.end.split(':').map(Number);
    for (let minute = startHour * 60 + startMinute; minute < endHour * 60 + endMinute; minute += 15) {
      const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
      const instant = localTimeToUtc(date, time);
      const used = usedBySlot[instant.toISOString()] ?? 0;
      if (instant.getTime() < earliest || used + pizzaCount > slotPizzaCapacity) continue;
      slots.push({ value: instant.toISOString(), time, remainingPizzas: Math.max(0, slotPizzaCapacity - used) });
    }
  }
  return slots;
}

export function listBookableDates(now = new Date()) {
  const today = brusselsDateKey(now);
  return Array.from({ length: 8 }, (_, offset) => nextDateKey(today, offset));
}

export function validateScheduledFor(value, now = new Date()) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:00\.000Z$/.test(value)) throw new Error('INVALID_SLOT');
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== value || instant.getTime() <= now.getTime()) throw new Error('INVALID_SLOT');
  return instant;
}
