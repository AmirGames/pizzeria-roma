import { readCatalogCart } from './catalog-cart.mjs';
export const TEST_STATUS_LABELS = Object.freeze({ PENDING: 'Test enregistré', ACCEPTED: 'Test accepté', PREPARING: 'Préparation simulée', READY: 'Test prêt', OUT_FOR_DELIVERY: 'Livraison simulée', COMPLETED: 'Test terminé', REJECTED: 'Test refusé', CANCELLED: 'Test annulé' });
export function nextTestStatuses(status, fulfillment) {
  return ({ PENDING: ['ACCEPTED', 'REJECTED'], ACCEPTED: ['PREPARING', 'CANCELLED'], PREPARING: ['READY'], READY: fulfillment === 'DELIVERY' ? ['OUT_FOR_DELIVERY'] : ['COMPLETED'], OUT_FOR_DELIVERY: ['COMPLETED'] })[status] ?? [];
}
export function validateTestOrder(input) {
  const fail = () => { throw new Error('INVALID_TEST_ORDER'); };
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['items', 'mode', 'zoneId', 'contactName', 'phone', 'address', 'comment', 'requestKey', 'expectedTotalCents'].includes(key))) fail();
  if (!['delivery', 'pickup'].includes(input.mode) || typeof input.requestKey !== 'string' || !/^[a-f0-9-]{36}$/i.test(input.requestKey) || !Number.isSafeInteger(input.expectedTotalCents) || input.expectedTotalCents < 0) fail();
  const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
  if (!text(input.contactName, 128) || !text(input.phone, 40) || !/^\+?[0-9 ()-]{7,30}$/.test(input.phone.trim()) || (input.comment !== undefined && (typeof input.comment !== 'string' || input.comment.length > 500))) fail();
  if (input.mode === 'delivery' && (!text(input.address, 300) || !text(input.zoneId, 128))) fail();
  if (input.mode === 'pickup' && (input.zoneId !== undefined || (input.address !== undefined && input.address !== ''))) fail();
  const items = readCatalogCart(JSON.stringify(input.items));
  if (!items.length) fail();
  return { items, mode: input.mode, ...(input.mode === 'delivery' ? { address: input.address.trim(), zoneId: input.zoneId } : {}), contactName: input.contactName.trim(), phone: input.phone.trim(), comment: input.comment?.trim() ?? '', requestKey: input.requestKey, expectedTotalCents: input.expectedTotalCents };
}
