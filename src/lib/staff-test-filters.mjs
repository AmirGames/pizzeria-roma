import { parseCustomerHistoryQuery } from './customer-history.mjs';
import { TEST_STATUS_LABELS } from './test-order-policy.mjs';
export const STAFF_TEST_PAGE_SIZE = 20;
export const ACTIVE_TEST_STATUSES = Object.freeze(['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY']);
export function parseStaffTestFilters(input = {}) {
  const { q, page } = parseCustomerHistoryQuery({ q: input.q, page: input.page });
  const value = (key, fallback) => {
    if (input[key] === undefined || input[key] === '') return fallback;
    if (typeof input[key] !== 'string') throw new Error('INVALID_STAFF_FILTER');
    return input[key];
  };
  const status = value('statut', 'active');
  const fulfillment = value('mode', '');
  const sort = value('tri', 'oldest');
  if ((!['active', 'all'].includes(status) && !Object.hasOwn(TEST_STATUS_LABELS, status)) || !['', 'PICKUP', 'DELIVERY'].includes(fulfillment) || !['oldest', 'newest'].includes(sort)) throw new Error('INVALID_STAFF_FILTER');
  return { q, page, status, fulfillment, sort };
}
export function staffTestHref(filters, page = 1) {
  if (!Number.isSafeInteger(page) || page < 1) throw new Error('INVALID_STAFF_FILTER');
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status !== 'active') params.set('statut', filters.status);
  if (filters.fulfillment) params.set('mode', filters.fulfillment);
  if (filters.sort !== 'oldest') params.set('tri', filters.sort);
  if (page > 1) params.set('page', String(page));
  return `/gerant/commandes-test${params.size ? `?${params}` : ''}#staff-test-list-title`;
}
