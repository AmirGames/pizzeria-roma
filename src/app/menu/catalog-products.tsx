'use client';

import { useEffect, useState } from 'react';

type CatalogProduct = { id: string; nameFr: string; baseCents: number; sizes: Array<{ id: string; label: string; priceCents: number }>; extras: Array<{ id: string; nameFr: string; priceCents: number }> };
type CatalogCategory = { id: string; nameFr: string; products: CatalogProduct[] };
function euros(cents: number) { return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100); }

export default function CatalogProducts() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/catalog', { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error('CATALOG_UNAVAILABLE'); return response.json() as Promise<{ categories?: CatalogCategory[] }>; })
      .then(result => { setCategories(Array.isArray(result.categories) ? result.categories : []); setStatus('ready'); })
      .catch(error => { if (error.name !== 'AbortError') setStatus('unavailable'); });
    return () => controller.abort();
  }, []);
  if (status === 'loading') return <p className="catalog-message" aria-live="polite">Chargement de la carte…</p>;
  if (status === 'unavailable') return <p className="catalog-message" role="status">La carte n’est pas disponible pour le moment.</p>;
  if (categories.length === 0) return <p className="catalog-message" role="status">Les plats et tarifs seront affichés après validation et publication de la carte.</p>;
  return <div className="catalog-groups">{categories.map(category => <section key={category.id} aria-labelledby={`catalog-${category.id}`}>
    <h3 id={`catalog-${category.id}`}>{category.nameFr}</h3><div className="catalog-products">
      {category.products.map(product => <article className="catalog-product" key={product.id}><h4>{product.nameFr}</h4>
        {product.sizes.length > 0 ? <ul>{product.sizes.map(size => <li key={size.id}>{size.label} <span>{euros(size.priceCents)}</span></li>)}</ul> : <p>{euros(product.baseCents)}</p>}
        {product.extras.length > 0 && <p className="catalog-extras">Suppléments disponibles : {product.extras.map(extra => `${extra.nameFr} (${euros(extra.priceCents)})`).join(', ')}.</p>}
      </article>)}
    </div></section>)}</div>;
}
