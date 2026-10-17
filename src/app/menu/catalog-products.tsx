'use client';

import ProductConfigurator from '../../components/product-configurator';
import type { CatalogProduct } from '../../lib/catalog-types';
import { useEffect, useMemo, useState } from 'react';
import { addCatalogCartItem } from '../../lib/catalog-cart.mjs';
import type { CatalogCartLine } from '../../lib/catalog-cart.mjs';
import { useCatalogCart } from '../../lib/use-catalog-cart';

type CatalogCategory = { id: string; nameFr: string; products: CatalogProduct[] };
type CatalogEntry = { product: CatalogProduct; displayName?: string; selectedSizeId?: string };
const money = (cents: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

function categorySlug(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-BE').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const recipes: Record<string, string> = {
  Margherita: 'Tomates, mozzarella',
  Prosciutto: 'Tomates, mozzarella, jambon',
  Funghi: 'Tomates, mozzarella, champignons',
  Napoli: 'Tomates, mozzarella, câpres, anchois',
  Salami: 'Tomates, mozzarella, salami ou chorizo',
  Bolognese: 'Bolognaise, mozzarella',
  '4 Formaggi': 'Tomates, mozzarella, Bel Paese, gorgonzola, taleggio',
};

// Photos that were confidently identified from the restaurant's image folder.
// Products without a matching photo keep using the existing menu collage.
const pizzaPhotoBySlug: Record<string, string> = {
  margherita: 'margherita',
  salami: 'salami-ou-chorizo',
  chorizo: 'salami-ou-chorizo',
  napoli: 'napoli',
  prosciutto: 'prosciutto',
  funghi: 'funghi',
  'sole-mio': 'sole-mio',
  hawai: 'hawaienne',
  regina: 'regina',
  viennese: 'viennese',
  calzone: 'calzone',
  capricciosa: 'capricciosa',
  '4-stagioni': 'quattro-stagioni',
  ortolana: 'ortolana',
  brocoli: 'brocoli',
  roma: 'roma',
  colosseo: 'colosseo',
  vegetarienne: 'vegetarienne',
  maria: 'maria',
  forestiere: 'forestiere',
  merguez: 'merguez',
  'mamma-mia': 'mamma-mia',
  rucola: 'rucola',
  exotic: 'exotic',
  carpaccio: 'carpaccio',
  tartiflette: 'tartiflette',
  'al-tonno': 'al-tonno',
  salmone: 'salmone',
  'frutti-di-mare': 'frutti-di-mare',
  scampi: 'scampi',
  'mare-e-monte': 'mare-e-monte',
  royale: 'royale',
};

function priceRange(product: CatalogProduct) {
  const prices = product.sizes.length ? product.sizes.map(size => size.priceCents) : [product.baseCents];
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  return lowest === highest ? money(lowest) : `${money(lowest)} – ${money(highest)}`;
}

function thumbnailIndex(name: string, fallback: number) {
  const normalized = name.toLocaleLowerCase('fr-BE');
  if (normalized.includes('margherita')) return 0;
  if (normalized.includes('prosciutto')) return 1;
  if (normalized.includes('funghi')) return 2;
  if (normalized.includes('salami') || normalized.includes('chorizo')) return 3;
  if (normalized.includes('formaggi')) return 4;
  if (normalized.includes('veget')) return 5;
  return fallback % 6;
}

function menuItemPhotoIndex(categoryName: string, product: CatalogProduct, displayName?: string) {
  const category = categorySlug(categoryName);
  const item = categorySlug([displayName ?? product.nameFr, ...(product.ingredients ?? [])].join(' '));
  if (category.startsWith('pates')) {
    if (item.includes('lasagne') || item.includes('al-forno')) return 8;
    if (item.includes('carbonara')) return 3;
    if (item.includes('tonnata') || item.includes('thon')) return 4;
    if (/fruits-de-mer|scampis|fruits-de/.test(item)) return 5;
    if (item.includes('salmone') || item.includes('saumon')) return 6;
    if (/formaggi|fromage|ravioles|champignons|pesto/.test(item)) return 7;
    if (/jambon|creme|tortellini/.test(item)) return 2;
    if (/napoli|primavera|strozzapreti|maison/.test(item)) return 1;
    return 0;
  }
  if (category.startsWith('desserts')) {
    if (item.includes('mousse')) return 4;
    if (item.includes('profiterole')) return 5;
    return 3;
  }
  if (category.startsWith('boissons')) {
    if (/vin|rouge|rose|blanc/.test(item)) return 8;
    if (item.includes('jupiler') || item.includes('biere')) return 7;
    return 6;
  }
  return undefined;
}

function ProductCard({ product, onAdd, index, isPizza, itemPhotoIndex, itemPhotoSource, allowCustomization, displayName, selectedSizeId }: { product: CatalogProduct; onAdd: (line: Omit<CatalogCartLine, 'quantity'>) => boolean; index: number; isPizza: boolean; itemPhotoIndex?: number; itemPhotoSource?: 'pasta' | 'menu'; allowCustomization: boolean; displayName?: string; selectedSizeId?: string }) {
  const [added, setAdded] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const directChoices = !allowCustomization && !selectedSizeId && product.sizes.length > 1 ? product.sizes : [];
  const selectedSize = product.sizes.find(size => size.id === selectedSizeId);
  const sizeId = selectedSizeId ?? product.sizes[0]?.id;
  const name = displayName ?? product.nameFr;
  const photoIndex = isPizza ? thumbnailIndex(product.nameFr, index) : itemPhotoIndex ?? index % 6;
  const position = `${(photoIndex % 3) * 50}% ${itemPhotoIndex !== undefined ? Math.floor(photoIndex / 3) * 50 : photoIndex < 3 ? 0 : 100}%`;
  const pizzaPhoto = isPizza ? pizzaPhotoBySlug[categorySlug(product.nameFr)] : undefined;
  const photoUrl = pizzaPhoto ? `/pizzas/${pizzaPhoto}.webp` : isPizza ? '/roma-pizzas.webp' : itemPhotoIndex !== undefined ? itemPhotoSource === 'pasta' ? '/roma-pasta-items.webp' : '/roma-menu-items.webp' : '/roma-categories-portrait.webp';
  const ingredients = product.ingredients?.length ? product.ingredients.join(', ') : recipes[product.nameFr] ?? (product.removableIngredients?.length ? product.removableIngredients.join(', ') : '');
  const sizes = product.sizes.map(size => size.label).join(' · ');
  return <article className={`catalog-product${allowCustomization ? '' : ' catalog-product-simple'}`} onChange={() => setAdded(false)} onClick={event => {
    if (!allowCustomization) return;
    const target = event.target;
    if (!(target instanceof Element) || target.closest('button, a, input, select, textarea, label, .catalog-product-options, [role="status"], [role="alert"]')) return;
    setCustomizing(open => !open);
  }}>
    <div className="catalog-product-art" aria-hidden="true" style={pizzaPhoto ? undefined : { backgroundImage: `url('${photoUrl}')`, backgroundPosition: position, backgroundSize: isPizza || itemPhotoIndex === undefined ? '300% 200%' : '300% 300%' }}>
      {pizzaPhoto && <img src={photoUrl} alt="" loading="lazy" decoding="async" />}
    </div>
    <div className="catalog-product-copy">
      {allowCustomization
        ? <button type="button" className="catalog-product-name" onClick={() => setCustomizing(open => !open)} aria-expanded={customizing}>{product.nameFr}</button>
      : <h4 className="catalog-product-name">{name}</h4>}
      <p>{selectedSize ? 'Dessert' : directChoices.length ? `Choisissez : ${directChoices.map(size => size.label).join(' ou ')}` : ingredients || (sizes ? `Formats : ${sizes}` : product.choiceLabel ?? 'À la carte')}</p>
      {allowCustomization && <button type="button" className="catalog-personalize" onClick={() => setCustomizing(open => !open)} aria-expanded={customizing}>{customizing ? 'Fermer les options' : 'Personnaliser'}</button>}
    </div>
    <strong className="catalog-product-price">{selectedSize ? money(selectedSize.priceCents) : priceRange(product)}</strong>
    {directChoices.length
      ? <div className="catalog-direct-choices">{directChoices.map(size => <button type="button" className="catalog-quick-add catalog-quick-add-choice" key={size.id} onClick={() => setAdded(onAdd({ productId: product.id, sizeId: size.id, extraIds: [], removedIngredients: [] }))}>Ajouter · {size.label}</button>)}</div>
      : <button type="button" className="catalog-quick-add" onClick={() => setAdded(onAdd({ productId: product.id, ...(sizeId ? { sizeId } : {}), extraIds: [], removedIngredients: [] }))}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l2.2 12.1a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.5L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>Ajouter</button>}
    {allowCustomization && customizing && <div className="catalog-product-options"><ProductConfigurator product={product} onSubmit={line => setAdded(onAdd(line))} /></div>}
    {added && <p role="status" className="catalog-product-added">Ajouté au panier ✓</p>}
  </article>;
}

export default function CatalogProducts({ initialCategories }: { initialCategories: CatalogCategory[] }) {
  const [categories] = useState<CatalogCategory[]>(initialCategories);
  const [activeCategory, setActiveCategory] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const { items, setItems } = useCatalogCart();

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('category');
    const match = requested ? categories.find(category => categorySlug(category.nameFr) === requested)?.id : '';
    setActiveCategory(current => current || match || categories[0]?.id || '');
  }, [categories]);

  function add(line: Omit<CatalogCartLine, 'quantity'>) {
    try {
      setItems(addCatalogCartItem(items, line));
      setError('');
      return true;
    } catch {
      setError('Le panier est complet ou la quantité maximale est atteinte.');
      return false;
    }
  }

  const currentCategory = categories.find(category => category.id === activeCategory) ?? categories[0];
  const categoryProducts = useMemo<CatalogEntry[]>(() => {
    const products = currentCategory?.products ?? [];
    if (categorySlug(currentCategory?.nameFr ?? '') !== 'desserts') return products.map(product => ({ product }));

    const expanded = products.flatMap(product => product.sizes.length > 1
      ? product.sizes.map(size => ({ product, displayName: size.label, selectedSizeId: size.id }))
      : [{ product, ...(categorySlug(product.nameFr).includes('mousse') ? { displayName: 'Mousse' } : {}) }]);
    const order = ['tiramisu', 'mousse', 'profiteroles'];
    return expanded.sort((a, b) => {
      const aIndex = order.findIndex(name => categorySlug(a.displayName ?? a.product.nameFr).includes(name));
      const bIndex = order.findIndex(name => categorySlug(b.displayName ?? b.product.nameFr).includes(name));
      return (aIndex < 0 ? order.length : aIndex) - (bIndex < 0 ? order.length : bIndex);
    });
  }, [currentCategory]);
  const visibleProducts = useMemo(() => categoryProducts.filter(entry => {
    const search = query.trim().toLocaleLowerCase('fr-BE');
    return !search || (entry.displayName ?? entry.product.nameFr).toLocaleLowerCase('fr-BE').includes(search) || (!entry.selectedSizeId && entry.product.nameFr.toLocaleLowerCase('fr-BE').includes(search));
  }), [categoryProducts, query]);
  const isPizza = /pizza/i.test(currentCategory?.nameFr ?? '');
  const currentCategorySlug = categorySlug(currentCategory?.nameFr ?? '');
  const itemPhotoSource = currentCategorySlug.startsWith('pates') ? 'pasta' : 'menu';
  const allowCustomization = !/^(boissons?|desserts?)$/.test(currentCategorySlug);

  if (categories.length === 0) return <p className="catalog-message" role="status">Les plats et tarifs seront affichés après validation et publication de la carte.</p>;
  return <>
    {error && <p role="alert" className="roma-error">{error}</p>}
    <nav className="catalog-category-tabs" aria-label="Catégories du menu">{categories.map(category => <button type="button" key={category.id} aria-pressed={activeCategory === category.id} onClick={() => setActiveCategory(category.id)}>{category.nameFr}</button>)}</nav>
    <section className="catalog-current-category" aria-labelledby="catalog-active-title">
      <div className="catalog-category-title"><h3 id="catalog-active-title">Nos {(currentCategory?.nameFr ?? 'plats').toLocaleLowerCase('fr-BE')}</h3><label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une pizza…" aria-label="Rechercher une pizza" /></label></div>
      {!visibleProducts.length ? <p className="catalog-message">Aucun article ne correspond à votre recherche dans cette catégorie.</p> : <div className="catalog-products">{visibleProducts.map((entry, index) => <ProductCard key={`${entry.product.id}-${entry.selectedSizeId ?? 'default'}`} product={entry.product} displayName={entry.displayName} selectedSizeId={entry.selectedSizeId} onAdd={add} index={index} isPizza={isPizza} itemPhotoIndex={menuItemPhotoIndex(currentCategory?.nameFr ?? '', entry.product, entry.displayName)} itemPhotoSource={itemPhotoSource} allowCustomization={allowCustomization} />)}</div>}
    </section>
  </>;
}
