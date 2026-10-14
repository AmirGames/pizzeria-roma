const MAX_LINES = 30;
const MAX_EXTRAS = 20;
const allowedKeys = new Set(['productId', 'sizeId', 'extraIds', 'quantity']);

function validateLine(line) {
  if (!line || typeof line !== 'object' || Array.isArray(line) ||
      Object.keys(line).some(key => !allowedKeys.has(key)) ||
      typeof line.productId !== 'string' || line.productId.length < 1 || line.productId.length > 128 ||
      (line.sizeId !== undefined && (typeof line.sizeId !== 'string' || !line.sizeId || line.sizeId.length > 128)) ||
      !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) {
    throw new Error('INVALID_CART');
  }
  const extraIds = line.extraIds ?? [];
  if (!Array.isArray(extraIds) || extraIds.length > MAX_EXTRAS || new Set(extraIds).size !== extraIds.length ||
      !extraIds.every(id => typeof id === 'string' && id.length > 0 && id.length <= 128)) {
    throw new Error('INVALID_CART');
  }
  return { productId: line.productId, ...(line.sizeId ? { sizeId: line.sizeId } : {}), extraIds: [...extraIds].sort(), quantity: line.quantity };
}

function lineKey(line) {
  return JSON.stringify([line.productId, line.sizeId ?? null, line.extraIds]);
}

export function readCatalogCart(raw) {
  if (typeof raw !== 'string') return [];
  try {
    const lines = JSON.parse(raw);
    if (!Array.isArray(lines) || lines.length > MAX_LINES) return [];
    const validated = lines.map(validateLine);
    if (new Set(validated.map(lineKey)).size !== validated.length) return [];
    return validated;
  } catch {
    return [];
  }
}

export function addCatalogCartItem(items, input) {
  if (!Array.isArray(items) || items.length > MAX_LINES) throw new Error('INVALID_CART');
  const line = validateLine({ ...input, quantity: input?.quantity ?? 1 });
  const key = lineKey(line);
  const index = items.findIndex(item => lineKey(validateLine(item)) === key);
  if (index < 0) {
    if (items.length >= MAX_LINES) throw new Error('INVALID_CART');
    return [...items.map(validateLine), line];
  }
  const nextQuantity = items[index].quantity + line.quantity;
  if (nextQuantity > 99) throw new Error('INVALID_CART');
  return items.map((item, i) => i === index ? { ...line, quantity: nextQuantity } : validateLine(item));
}

export function setCatalogCartQuantity(items, index, quantity) {
  if (!Array.isArray(items) || !Number.isSafeInteger(index) || index < 0 || index >= items.length ||
      !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 99) throw new Error('INVALID_CART');
  if (quantity === 0) return items.filter((_, i) => i !== index).map(validateLine);
  return items.map((item, i) => i === index ? validateLine({ ...item, quantity }) : validateLine(item));
}
