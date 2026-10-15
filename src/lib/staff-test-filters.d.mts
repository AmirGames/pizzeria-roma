import type { CustomerHistoryFilters, CustomerHistoryStatus } from './customer-history.mjs';
export const STAFF_TEST_PAGE_SIZE: number;
export const ACTIVE_TEST_STATUSES: ReadonlyArray<Exclude<CustomerHistoryStatus, ''>>;
export type StaffTestFilters = Omit<CustomerHistoryFilters, 'status'> & { status: 'active' | 'all' | Exclude<CustomerHistoryStatus, ''>; fulfillment: '' | 'PICKUP' | 'DELIVERY'; sort: 'oldest' | 'newest' | 'scheduled' };
export function parseStaffTestFilters(input?: Record<string, string | string[] | undefined>): StaffTestFilters;
export function staffTestHref(filters: StaffTestFilters, page?: number): string;
