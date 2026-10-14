export type CartLine = { key: string; unitCents: number; quantity: number; label: string; details: string; category: 'pizza' | 'pasta' | 'other'; sizeCm?: '33' | '50' };
export function cartTotal(items: CartLine[]): number;
export function setCartQuantity<T extends CartLine>(items: T[], key: string, quantity: number): T[];
export function addCartItem<T extends CartLine>(items: T[], incoming: T): T[];
