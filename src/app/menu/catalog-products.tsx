'use client';

import Link from 'next/link';
import ProductConfigurator from '../../components/product-configurator';
import type { CatalogProduct } from '../../lib/catalog-types';
import { useEffect, useState } from 'react';
import { addCatalogCartItem } from '../../lib/catalog-cart.mjs';
import type { CatalogCartLine } from '../../lib/catalog-cart.mjs';
import { useCatalogCart } from '../../lib/use-catalog-cart';

type CatalogCategory = { id: string; nameFr: string; products: CatalogProduct[] };

function ProductCard({ product, onAdd }: { product: CatalogProduct; onAdd: (line: Omit<CatalogCartLine, 'quantity'>) => boolean }) {
  const [added, setAdded] = useState(false);
  return <article className="catalog-product" onChange={() => setAdded(false)}>
    <ProductConfigurator product={product} onSubmit={line => setAdded(onAdd(line))} />
    {added && <p role="status">Ajouté au panier ✓</p>}
  </article>;
}

export default function CatalogProducts() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [error, setError] = useState('');
  const { items, setItems, ready: cartReady } = useCatalogCart();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/catalog', { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error('CATALOG_UNAVAILABLE'); return response.json() as Promise<{ categories?: CatalogCategory[] }>; })
      .then(result => { setCategories(Array.isArray(result.categories) ? result.categories : []); setStatus('ready'); })
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

  if (status === 'loading') return <p className="catalog-message" aria-live="polite">Chargement de la carte…</p>;
  if (status === 'unavailable') return <p className="catalog-message" role="status">La carte n’est pas disponible pour le moment.</p>;
  if (categories.length === 0) return <p className="catalog-message" role="status">Les plats et tarifs seront affichés après validation et publication de la carte.</p>;
  return <>
    <p className="catalog-cart-link"><Link href="/panier">Voir le panier{cartReady ? ` (${items.reduce((sum, item) => sum + item.quantity, 0)})` : ''} →</Link></p>
    {error && <p role="alert" className="roma-error">{error}</p>}
    <div className="catalog-groups">{categories.map(category => <section key={category.id} aria-labelledby={`catalog-${category.id}`}>
      <h3 id={`catalog-${category.id}`}>{category.nameFr}</h3><div className="catalog-products">
        {category.products.map(product => <ProductCard key={product.id} product={product} onAdd={add} />)}
      </div></section>)}</div>
  </>;
}
