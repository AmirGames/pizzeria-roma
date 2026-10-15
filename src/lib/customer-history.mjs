import { TEST_STATUS_LABELS } from './test-order-policy.mjs';
export const CUSTOMER_HISTORY_PAGE_SIZE = 20;
export function parseCustomerHistoryQuery(input = {}) {
  const value = key => {
    if (input[key] === undefined) return '';
    if (typeof input[key] !== 'string') throw new Error('INVALID_HISTORY_FILTER');
    return input[key];
  };
  const q = value('q').trim().toUpperCase();
  const status = value('statut');
  const rawPage = value('page');
  if ((q && !/^[A-Z0-9-]{1,64}$/.test(q)) || (status && !Object.hasOwn(TEST_STATUS_LABELS, status)) || (rawPage && !/^[1-9]\d{0,8}$/.test(rawPage))) throw new Error('INVALID_HISTORY_FILTER');
  return { q, status, page: rawPage ? Number(rawPage) : 1 };
}
export function customerHistoryHref(filters, page = 1) {
  if (!Number.isSafeInteger(page) || page < 1) throw new Error('INVALID_HISTORY_FILTER');
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('statut', filters.status);
  if (page > 1) params.set('page', String(page));
  return `/compte${params.size ? `?${params}` : ''}#customer-history-title`;
}
