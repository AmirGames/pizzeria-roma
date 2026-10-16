import type { CatalogCartLine } from './catalog-cart.mjs';
export const TEST_STATUS_LABELS: Record<string, string>;
export function nextTestStatuses(status: string, fulfillment: string): string[];
export function validateTestOrder(input: unknown): { items: CatalogCartLine[]; mode: 'delivery' | 'pickup'; address?: string; zoneId?: string; scheduledFor?: string; contactName: string; phone: string; comment: string; requestKey: string; expectedTotalCents: number; promoCode: string };
export type TestOrderSnapshot = { productId: string; label: string; quantity: number; sizeId?: string; sizeLabel?: string; extraIds: string[]; extraLabels: string[]; removedIngredients: string[]; unitCents: number; totalCents: number; loyaltyFreeQuantity?: number };
