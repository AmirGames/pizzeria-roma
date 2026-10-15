import test from 'node:test';
import assert from 'node:assert/strict';
import { brusselsDayWindow, summarizeStaffDashboard } from '../src/lib/staff-dashboard.mjs';
test('Brussels daily boundaries cover winter, summer, daylight saving and year rollover', () => {
  for (const [now, date, start, end, hours] of [
    ['2026-01-15T12:00:00Z', '2026-01-15', '2026-01-14T23:00:00.000Z', '2026-01-15T23:00:00.000Z', 24],
    ['2026-07-15T12:00:00Z', '2026-07-15', '2026-07-14T22:00:00.000Z', '2026-07-15T22:00:00.000Z', 24],
    ['2026-03-29T12:00:00Z', '2026-03-29', '2026-03-28T23:00:00.000Z', '2026-03-29T22:00:00.000Z', 23],
    ['2026-10-25T12:00:00Z', '2026-10-25', '2026-10-24T22:00:00.000Z', '2026-10-25T23:00:00.000Z', 25],
    ['2026-12-31T23:30:00Z', '2027-01-01', '2026-12-31T23:00:00.000Z', '2027-01-01T23:00:00.000Z', 24],
  ]) {
    const result = brusselsDayWindow(new Date(now));
    assert.equal(result.date, date); assert.equal(result.start.toISOString(), start); assert.equal(result.end.toISOString(), end);
    assert.equal((result.end - result.start) / 3600000, hours);
  }
  assert.throws(() => brusselsDayWindow(new Date('invalid')), /INVALID_DASHBOARD_DATE/);
});
test('active counters cover all dates while the daily summary uses only its own groups', () => {
  const group = (status, count, fulfillment) => ({ status, _count: { _all: count }, ...(fulfillment ? { fulfillment } : {}) });
  const result = summarizeStaffDashboard([
    group('PENDING', 2), group('ACCEPTED', 1), group('PREPARING', 3), group('READY', 4), group('OUT_FOR_DELIVERY', 5), group('COMPLETED', 100), group('CANCELLED', 50), group('REJECTED', 20),
  ], [group('PENDING', 2, 'PICKUP'), group('COMPLETED', 1, 'PICKUP'), group('READY', 3, 'DELIVERY'), group('CANCELLED', 1, 'DELIVERY'), group('REJECTED', 1, 'PICKUP')]);
  assert.equal(result.active, 15); assert.equal(result.statuses.READY, 4);
  assert.deepEqual(result.today, { total: 8, pickup: 4, delivery: 4, cancelledOrRejected: 2 });
  const empty = summarizeStaffDashboard([], []);
  assert.equal(empty.active, 0); assert.ok(Object.values(empty.statuses).every(count => count === 0));
  assert.equal(empty.today.total, 0);
});
