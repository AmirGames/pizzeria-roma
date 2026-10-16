/** Add the shared ingredient catalogue as optional toppings to each pizza. */
export function attachGlobalPizzaIngredients(products, ingredients) {
  if (!Array.isArray(products) || !Array.isArray(ingredients)) throw new Error('INVALID_INGREDIENT_CATALOG');
  return products.map(product => {
    if (product.category?.fulfillmentCategory !== 'PIZZA') return product;
    const catalogNames = new Set(ingredients.map(item => item.nameFr.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')));
    const specific = (product.extras ?? []).filter(extra => !catalogNames.has(extra.nameFr.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')));
    const shared = ingredients.filter(item => item.active).map(item => ({
      id: item.id, nameFr: item.nameFr, nameEn: item.nameEn, priceCents: item.price33Cents, active: true,
      sizePrices: product.sizes?.length ? Object.fromEntries(product.sizes.map(size => [size.id, /50\s*cm/i.test(size.label) ? item.price50Cents : item.price33Cents])) : null,
    }));
    return { ...product, extras: [...specific, ...shared] };
  });
}
