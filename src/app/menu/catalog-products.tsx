'use client';

import Link from 'next/link';
import ProductConfigurator from '../../components/product-configurator';
import type { CatalogProduct } from '../../lib/catalog-types';
import { useEffect, useMemo, useState } from 'react';
import { addCatalogCartItem } from '../../lib/catalog-cart.mjs';
import type { CatalogCartLine } from '../../lib/catalog-cart.mjs';
import { useCatalogCart } from '../../lib/use-catalog-cart';

type CatalogCategory = { id: string; nameFr: string; products: CatalogProduct[] };

function categorySlug(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-BE').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function ProductCard({ product, onAdd, icon }: { product: CatalogProduct; onAdd: (line: Omit<CatalogCartLine, 'quantity'>) => boolean; icon: string }) {
  const [added, setAdded] = useState(false);
  return <article className="catalog-product" onChange={() => setAdded(false)}><div className="catalog-product-art" aria-hidden="true">{icon}</div>
    <ProductConfigurator product={product} onSubmit={line => setAdded(onAdd(line))} />
    {added && <p role="status">Ajouté au panier ✓</p>}
  </article>;
}

export default function CatalogProducts() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [activeCategory, setActiveCategory] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const { items, setItems, ready: cartReady } = useCatalogCart();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/catalog', { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error('CATALOG_UNAVAILABLE'); return response.json() as Promise<{ categories?: CatalogCategory[] }>; })
      .then(result => { const next = Array.isArray(result.categories) ? result.categories : []; const requested = new URLSearchParams(window.location.search).get('category'); const match = requested ? next.find(category => categorySlug(category.nameFr) === requested)?.id : ''; setCategories(next); setActiveCategory(current => current || match || next[0]?.id || ''); setStatus('ready'); })
      .catch(error => { if (error.name !== 'AbortError') setStatus('unavailable'); });
    return () => controller.abort();
  }, []);

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
  const visibleProducts = useMemo(() => (currentCategory?.products ?? []).filter(product => product.nameFr.toLocaleLowerCase('fr-BE').includes(query.trim().toLocaleLowerCase('fr-BE'))), [currentCategory, query]);
  const icon = /pizza/i.test(currentCategory?.nameFr ?? '') ? '✳' : /p[aâ]te/i.test(currentCategory?.nameFr ?? '') ? '〰' : /salade/i.test(currentCategory?.nameFr ?? '') ? '❋' : /dessert/i.test(currentCategory?.nameFr ?? '') ? '✿' : '✦';

  if (status === 'loading') return <p className="catalog-message" aria-live="polite">Chargement de la carte…</p>;
  if (status === 'unavailable') return <p className="catalog-message" role="status">La carte n’est pas disponible pour le moment.</p>;
  if (categories.length === 0) return <p className="catalog-message" role="status">Les plats et tarifs seront affichés après validation et publication de la carte.</p>;
  return <>
    <p className="catalog-cart-link"><Link href="/panier">Voir le panier{cartReady ? ` (${items.reduce((sum, item) => sum + item.quantity, 0)})` : ''} →</Link></p>
    {error && <p role="alert" className="roma-error">{error}</p>}
    <nav className="catalog-category-tabs" aria-label="Catégories du menu">{categories.map(category => <button type="button" key={category.id} aria-pressed={activeCategory === category.id} onClick={() => setActiveCategory(category.id)}>{category.nameFr}</button>)}</nav>
    <label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher dans cette catégorie" aria-label="Rechercher dans cette catégorie" /></label>
    <section className="catalog-current-category" aria-labelledby="catalog-active-title">
      <div className="catalog-category-title"><div><p className="eyebrow">LA CARTE ROMA</p><h3 id="catalog-active-title">{currentCategory?.nameFr ?? 'Nos plats'}</h3></div><span>{visibleProducts.length} article{visibleProducts.length === 1 ? '' : 's'}</span></div>
      {!visibleProducts.length ? <p className="catalog-message">Aucun article ne correspond à votre recherche dans cette catégorie.</p> : <div className="catalog-products">{visibleProducts.map(product => <ProductCard key={product.id} product={product} onAdd={add} icon={icon} />)}</div>}
    </section>
  </>;
}
