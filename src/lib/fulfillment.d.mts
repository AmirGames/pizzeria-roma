export type DeliveryZone = { id: string; label: string };
export const DOUBLE_DISH_THRESHOLD_CENTS: 1800;
export const DELIVERY_MINIMUMS: Readonly<Record<string, number>>;
export const DELIVERY_ZONES: ReadonlyArray<DeliveryZone>;
export function minimumMainDishes(zoneId: string): number;
export function evaluateDelivery(input: { mode: 'delivery' | 'pickup'; zoneId?: string; mainDishCount: number }): { eligible: boolean; minimum: number; deliveryFeeCents: number };
export function serviceWindows(weekday: number): Array<{ start: string; end: string }>;
export function isWithinService(weekday: number, time: string): boolean;
/** Informational regular-weekly-hours check in Europe/Brussels; public-holiday overrides are not inferred. */
export function isWithinRestaurantService(instant: Date): boolean;

export function countEligibleDishes(items: Array<{ category: 'pizza' | 'pasta' | 'other'; quantity: number; sizeCm?: '33' | '50'; unitCents?: number }>): number;

export type FulfillmentCartLine = { category: 'pizza' | 'pasta' | 'other'; quantity: number; sizeCm?: '33' | '50'; unitCents?: number };
export function evaluateCartFulfillment(input: { mode: 'delivery' | 'pickup'; zoneId?: string; items: Array<FulfillmentCartLine> }): { eligible: boolean; minimum: number; deliveryFeeCents: number; dishCount: number };
