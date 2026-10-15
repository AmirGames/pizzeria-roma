import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVE_TEST_STATUSES, parseStaffTestFilters, staffTestHref } from '../src/lib/staff-test-filters.mjs';
test('the professional queue defaults to active tests and oldest first', () => {
  assert.deepEqual(parseStaffTestFilters(), { q: '', page: 1, status: 'active', fulfillment: '', sort: 'oldest' });
  assert.deepEqual(ACTIVE_TEST_STATUSES, ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY']);
  assert.deepEqual(parseStaffTestFilters({ q: ' test-abc ', statut: 'all', mode: 'DELIVERY', tri: 'newest', page: '2', role: 'MANAGER' }), { q: 'TEST-ABC', page: 2, status: 'all', fulfillment: 'DELIVERY', sort: 'newest' });
});
test('queue filters reject malformed references, repeated parameters and unsupported values', () => {
  for (const input of [{ q: '%' }, { q: 'x'.repeat(65) }, { q: ['A', 'B'] }, { statut: 'UNKNOWN' }, { statut: ['PENDING'] }, { mode: 'unknown' }, { mode: ['PICKUP'] }, { tri: 'random' }, { page: '0' }, { page: '1.5' }, { page: '1e9' }]) assert.throws(() => parseStaffTestFilters(input));
  assert.equal(parseStaffTestFilters({ statut: 'COMPLETED', mode: 'PICKUP' }).status, 'COMPLETED');
});
test('queue links preserve applied filters but never role or owner input', () => {
  const filters = parseStaffTestFilters({ q: 'test-123', statut: 'READY', mode: 'DELIVERY', tri: 'newest', page: '2', userId: 'foreign' });
  assert.equal(staffTestHref(filters, 3), '/gerant/commandes-test?q=TEST-123&statut=READY&mode=DELIVERY&tri=newest&page=3#staff-test-list-title');
  assert.equal(staffTestHref(parseStaffTestFilters()), '/gerant/commandes-test#staff-test-list-title');
  assert.throws(() => staffTestHref(filters, -1));
});
