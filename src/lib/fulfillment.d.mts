export type DeliveryZone = { id: string; label: string };
export const DELIVERY_MINIMUMS: Readonly<Record<string, number>>;
export const DELIVERY_ZONES: ReadonlyArray<DeliveryZone>;
export function minimumMainDishes(zoneId: string): number;
export function evaluateDelivery(input: { mode: 'delivery' | 'pickup'; zoneId?: string; mainDishCount: number }): { eligible: boolean; minimum: number; deliveryFeeCents: number };
export function serviceWindows(weekday: number): Array<{ start: string; end: string }>;
export function isWithinService(weekday: number, time: string): boolean;

export function countEligibleDishes(items: Array<{ category: 'pizza' | 'pasta' | 'other'; quantity: number }>): number;
