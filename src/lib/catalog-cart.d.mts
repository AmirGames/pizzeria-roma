export type CatalogCartLine = { productId: string; sizeId?: string; extraIds: string[]; quantity: number };
export function readCatalogCart(raw: string | null): CatalogCartLine[];
export function addCatalogCartItem(items: CatalogCartLine[], line: Omit<CatalogCartLine, 'quantity'> & { quantity?: number }): CatalogCartLine[];
export function setCatalogCartQuantity(items: CatalogCartLine[], index: number, quantity: number): CatalogCartLine[];
