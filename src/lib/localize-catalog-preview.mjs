import { englishMenuTerm } from './menu-translation.mjs';

export function localizeCatalogPreviewItems(items, products, locale) {
  if (locale !== 'en') return items;
  return items.map(item => {
    const product = products.find(candidate => candidate.id === item.productId);
    const extras = product?.extras ?? [];
    return {
      ...item,
      label: product?.nameEn && product.nameEn !== product.nameFr
        ? product.nameEn
        : englishMenuTerm(product?.nameFr || item.label),
      extraLabels: item.extraIds.map(id => {
        const extra = extras.find(candidate => candidate.id === id);
        return englishMenuTerm(extra?.nameEn || extra?.nameFr || 'Extra');
      }),
      removedIngredients: item.removedIngredients.map(englishMenuTerm),
    };
  });
}
