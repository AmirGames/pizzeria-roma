'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { addCatalogCartItem } from '../../lib/catalog-cart.mjs';
import type { CatalogCartLine } from '../../lib/catalog-cart.mjs';
import { useCatalogCart } from '../../lib/use-catalog-cart';

type CatalogProduct = { id: string; nameFr: string; baseCents: number; removableIngredients?: string[]; choiceLabel: string | null; extraSelectionMode: 'SINGLE' | 'MULTIPLE'; sizes: Array<{ id: string; label: string; priceCents: number }>; extras: Array<{ id: string; nameFr: string; priceCents: number; sizePrices?: Record<string, number> }> };
type CatalogCategory = { id: string; nameFr: string; products: CatalogProduct[] };
function euros(cents: number) { return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100); }

function ProductCard({ product, onAdd }: { product: CatalogProduct; onAdd: (line: Omit<CatalogCartLine, 'quantity'>) => void }) {
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? '');
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const availableExtras = product.extras.filter(extra => !extra.sizePrices || Object.hasOwn(extra.sizePrices, sizeId));
  const extraPrice = (extra: CatalogProduct['extras'][number]) => extra.sizePrices ? extra.sizePrices[sizeId] : extra.priceCents;
  const unitCents = (product.sizes.find(size => size.id === sizeId)?.priceCents ?? product.baseCents) + availableExtras.filter(extra => extraIds.includes(extra.id)).reduce((sum, extra) => sum + extraPrice(extra), 0);
  const [added, setAdded] = useState(false);
  function toggleExtra(id: string) {
    setAdded(false);
    setExtraIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }
  return <article className="catalog-product" key={product.id}>
    <h4>{product.nameFr}</h4>
    {product.sizes.length > 0 ? <>
      <label className="catalog-option">{product.choiceLabel ?? 'Format'}<select value={sizeId} onChange={event => { setSizeId(event.target.value); setExtraIds(current => current.filter(id => product.extras.some(extra => extra.id === id && (!extra.sizePrices || Object.hasOwn(extra.sizePrices, event.target.value))))); setAdded(false); }}>
        {product.sizes.map(size => <option key={size.id} value={size.id}>{size.label} · {euros(size.priceCents)}</option>)}
      </select></label>
    </> : <p>{euros(product.baseCents)}</p>}
    {product.removableIngredients !== undefined && <>
      {product.removableIngredients.length > 0 ? <fieldset className="catalog-extra-options"><legend>Retirer des ingrédients</legend>
        <p>Le retrait ne réduit pas le prix de la pizza.</p>
        {product.removableIngredients.map(ingredient => <label key={ingredient}><input type="checkbox" checked={removedIngredients.includes(ingredient)} onChange={() => { setRemovedIngredients(current => current.includes(ingredient) ? current.filter(item => item !== ingredient) : [...current, ingredient]); setAdded(false); }} /> Sans {ingredient}</label>)}
      </fieldset> : <p>La composition de cette pizza sera bientôt disponible pour choisir les ingrédients à retirer.</p>}
      {availableExtras.length === 0 && <p>Aucun supplément disponible pour ce format.</p>}
    </>}
    {availableExtras.length > 0 && <fieldset className="catalog-extra-options"><legend>{product.extraSelectionMode === 'SINGLE' ? 'Supplément (au choix)' : 'Suppléments'}</legend>
      {product.extraSelectionMode === 'SINGLE' ? <>
        <label><input type="radio" name={`extras-${product.id}`} checked={extraIds.length === 0} onChange={() => { setExtraIds([]); setAdded(false); }} /> Aucun</label>
        {availableExtras.map(extra => <label key={extra.id}><input type="radio" name={`extras-${product.id}`} checked={extraIds[0] === extra.id} onChange={() => { setExtraIds([extra.id]); setAdded(false); }} /> {extra.nameFr} (+{euros(extraPrice(extra))})</label>)}
      </> : availableExtras.map(extra =>
        <label key={extra.id}><input type="checkbox" checked={extraIds.includes(extra.id)} onChange={() => toggleExtra(extra.id)} /> {extra.nameFr} (+{euros(extraPrice(extra))})</label>
      )}
    </fieldset>}
    <p aria-live="polite"><strong>Prix : {euros(unitCents)}</strong></p>
    <button className="catalog-add" type="button" disabled={product.sizes.length > 0 && !sizeId} onClick={() => { onAdd({ productId: product.id, ...(sizeId ? { sizeId } : {}), extraIds, removedIngredients }); setAdded(true); }}>
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
