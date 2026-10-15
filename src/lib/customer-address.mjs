import { DELIVERY_ZONES } from './fulfillment.mjs';
export const MAX_CUSTOMER_ADDRESSES = 10;
function invalid() { throw new Error('INVALID_ADDRESS'); }
function object(input, keys) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !keys.includes(key))) invalid();
}
export function validateAddressRevision(input) {
  object(input, ['revision']);
  if (!Number.isSafeInteger(input.revision) || input.revision < 0) invalid();
  return input.revision;
}
export function validateCustomerAddress(input, editing = false) {
  object(input, ['label', 'address', 'zoneId', 'isDefault', ...(editing ? ['revision'] : [])]);
  const result = {};
  for (const [field, max] of [['label', 60], ['address', 300]]) {
    if (typeof input[field] !== 'string' || !input[field].trim() || input[field].trim().length > max || /[\u0000-\u001f\u007f]/.test(input[field])) invalid();
    result[field] = input[field].trim();
  }
  if (!DELIVERY_ZONES.some(zone => zone.id === input.zoneId) || typeof input.isDefault !== 'boolean') invalid();
  return { ...result, zoneId: input.zoneId, isDefault: input.isDefault, ...(editing ? { revision: validateAddressRevision({ revision: input.revision }) } : {}) };
}
