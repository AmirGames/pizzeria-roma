export const MAX_CUSTOMER_ADDRESSES: number;
export type CustomerAddressInput = { label: string; address: string; zoneId: string; isDefault: boolean };
export type SavedCustomerAddress = CustomerAddressInput & { id: string; revision: number };
export function validateAddressRevision(input: unknown): number;
export function validateCustomerAddress(input: unknown, editing?: boolean): CustomerAddressInput & { revision?: number };
