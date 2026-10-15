import test from 'node:test';
import assert from 'node:assert/strict';
import { CUSTOMER_HISTORY_PAGE_SIZE, parseCustomerHistoryQuery, customerHistoryHref } from '../src/lib/customer-history.mjs';
test('history filters normalize references and accept only known statuses and positive pages', () => {
  assert.equal(CUSTOMER_HISTORY_PAGE_SIZE, 20);
  assert.deepEqual(parseCustomerHistoryQuery(), { q: '', status: '', page: 1 });
  assert.deepEqual(parseCustomerHistoryQuery({ q: ' test-123 ', statut: 'CANCELLED', page: '3', userId: 'foreign' }), { q: 'TEST-123', status: 'CANCELLED', page: 3 });
  for (const input of [{ q: '%' }, { q: 'a_b' }, { q: 'x'.repeat(65) }, { q: ['TEST', 'OTHER'] }, { statut: 'UNKNOWN' }, { statut: ['PENDING'] }, { page: '0' }, { page: '-1' }, { page: '1.5' }, { page: '1e3' }, { page: '99999999999999999999' }, { page: ['1', '2'] }]) assert.throws(() => parseCustomerHistoryQuery(input), /INVALID_HISTORY_FILTER/);
});
test('pagination keeps applied filters and never carries identity or unrelated query parameters', () => {
  const filters = parseCustomerHistoryQuery({ q: 'test-123', statut: 'PENDING', page: '2', userId: 'foreign' });
  assert.equal(customerHistoryHref(filters, 3), '/compte?q=TEST-123&statut=PENDING&page=3#customer-history-title');
  assert.equal(customerHistoryHref(filters), '/compte?q=TEST-123&statut=PENDING#customer-history-title');
  assert.equal(customerHistoryHref(parseCustomerHistoryQuery()), '/compte#customer-history-title');
  assert.throws(() => customerHistoryHref(filters, 0));
});
