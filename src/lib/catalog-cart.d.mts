export type CatalogCartLine = { productId: string; sizeId?: string; extraIds: string[]; removedIngredients?: string[]; quantity: number };
export function readCatalogCart(raw: string | null): CatalogCartLine[];
export function addCatalogCartItem(items: CatalogCartLine[], line: Omit<CatalogCartLine, 'quantity'> & { quantity?: number }): CatalogCartLine[];
export function setCatalogCartQuantity(items: CatalogCartLine[], index: number, quantity: number): CatalogCartLine[];
export function replaceCatalogCartItem(items: CatalogCartLine[], original: CatalogCartLine, replacement: Omit<CatalogCartLine, 'quantity'>): CatalogCartLine[];
