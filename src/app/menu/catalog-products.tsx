'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { addCatalogCartItem } from '../../lib/catalog-cart.mjs';
import type { CatalogCartLine } from '../../lib/catalog-cart.mjs';
import { useCatalogCart } from '../../lib/use-catalog-cart';

type CatalogProduct = { id: string; nameFr: string; baseCents: number; choiceLabel: string | null; extraSelectionMode: 'SINGLE' | 'MULTIPLE'; sizes: Array<{ id: string; label: string; priceCents: number }>; extras: Array<{ id: string; nameFr: string; priceCents: number }> };
type CatalogCategory = { id: string; nameFr: string; products: CatalogProduct[] };
function euros(cents: number) { return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100); }

function ProductCard({ product, onAdd }: { product: CatalogProduct; onAdd: (line: Omit<CatalogCartLine, 'quantity'>) => void }) {
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? '');
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [added, setAdded] = useState(false);
  function toggleExtra(id: string) {
    setExtraIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }
  return <article className="catalog-product" key={product.id}>
    <h4>{product.nameFr}</h4>
    {product.sizes.length > 0 ? <>
      <label className="catalog-option">{product.choiceLabel ?? 'Format'}<select value={sizeId} onChange={event => setSizeId(event.target.value)}>
        {product.sizes.map(size => <option key={size.id} value={size.id}>{size.label} · {euros(size.priceCents)}</option>)}
      </select></label>
    </> : <p>{euros(product.baseCents)}</p>}
    {product.extras.length > 0 && <fieldset className="catalog-extra-options"><legend>{product.extraSelectionMode === 'SINGLE' ? 'Supplément (au choix)' : 'Suppléments'}</legend>
      {product.extraSelectionMode === 'SINGLE' ? <>
        <label><input type="radio" name={`extras-${product.id}`} checked={extraIds.length === 0} onChange={() => setExtraIds([])} /> Aucun</label>
        {product.extras.map(extra => <label key={extra.id}><input type="radio" name={`extras-${product.id}`} checked={extraIds[0] === extra.id} onChange={() => setExtraIds([extra.id])} /> {extra.nameFr} (+{euros(extra.priceCents)})</label>)}
      </> : product.extras.map(extra =>
        <label key={extra.id}><input type="checkbox" checked={extraIds.includes(extra.id)} onChange={() => toggleExtra(extra.id)} /> {extra.nameFr} (+{euros(extra.priceCents)})</label>
      )}
    </fieldset>}
    <button className="catalog-add" type="button" disabled={product.sizes.length > 0 && !sizeId} onClick={() => { onAdd({ productId: product.id, ...(sizeId ? { sizeId } : {}), extraIds }); setAdded(true); }}>
      {added ? 'Ajouté au panier ✓' : 'Ajouter au panier'}
    </button>
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
      setItems(current => addCatalogCartItem(current, line));
      setError('');
    } catch {
      setError('Le panier est complet ou la quantité maximale est atteinte.');
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
