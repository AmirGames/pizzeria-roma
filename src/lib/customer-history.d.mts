export const CUSTOMER_HISTORY_PAGE_SIZE: number;
export type CustomerHistoryStatus = '' | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type CustomerHistoryFilters = { q: string; status: CustomerHistoryStatus; page: number };
export function parseCustomerHistoryQuery(input?: Record<string, string | string[] | undefined>): CustomerHistoryFilters;
export function customerHistoryHref(filters: CustomerHistoryFilters, page?: number): string;
