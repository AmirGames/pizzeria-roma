import { ACTIVE_TEST_STATUSES } from './staff-test-filters.mjs';
import { TEST_STATUS_LABELS } from './test-order-policy.mjs';
const zone = 'Europe/Brussels';
const dateParts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
const offsetParts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'longOffset' });
function midnightUtc(year, month, day) {
  const wall = Date.UTC(year, month - 1, day);
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const name = offsetParts.formatToParts(new Date(instant)).find(part => part.type === 'timeZoneName').value;
    const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name);
    if (!match) throw new Error('INVALID_DASHBOARD_DATE');
    const offset = (Number(match[2]) * 60 + Number(match[3])) * (match[1] === '+' ? 1 : -1);
    instant = wall - offset * 60000;
  }
  return new Date(instant);
}
/** Use the local calendar day, including the 23/25-hour daylight-saving days. */
export function brusselsDayWindow(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error('INVALID_DASHBOARD_DATE');
  const parts = Object.fromEntries(dateParts.formatToParts(now).map(part => [part.type, part.value]));
  const year = Number(parts.year), month = Number(parts.month), day = Number(parts.day);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, start: midnightUtc(year, month, day), end: midnightUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()) };
}
export function summarizeStaffDashboard(globalGroups, dayGroups) {
  const statuses = Object.fromEntries(Object.keys(TEST_STATUS_LABELS).map(status => [status, 0]));
  for (const group of globalGroups) statuses[group.status] += group._count._all;
  const today = { total: 0, pickup: 0, delivery: 0, cancelledOrRejected: 0 };
  for (const group of dayGroups) {
    const count = group._count._all;
    today.total += count;
    today[group.fulfillment === 'PICKUP' ? 'pickup' : 'delivery'] += count;
    if (['CANCELLED', 'REJECTED'].includes(group.status)) today.cancelledOrRejected += count;
  }
  return { statuses, active: ACTIVE_TEST_STATUSES.reduce((sum, status) => sum + statuses[status], 0), today };
}
