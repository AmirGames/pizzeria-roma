'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import CartItemEditor from './cart-item-editor';
import { replaceCatalogCartItem, setCatalogCartQuantity } from '../../lib/catalog-cart.mjs';
import type { CatalogCartLine } from '../../lib/catalog-cart.mjs';

type Preview = { items: Array<{ productId: string; label: string; quantity: number; sizeLabel?: string; extraIds: string[]; extraLabels: string[]; removedIngredients: string[]; unitCents: number; totalCents: number; loyaltyFreeQuantity?: number }>; subtotalCents: number; totalCents?: number; discountCents?: number; loyaltyDiscountCents?: number; promotion?: { name: string } | null };
const money = (cents: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export default function CatalogCartPanel({ items, setItems }: {
  items: CatalogCartLine[];
  setItems: Dispatch<SetStateAction<CatalogCartLine[]>>;
}) {
  const [editing, setEditing] = useState<CatalogCartLine | null>(null);
  const [actionError, setActionError] = useState('');
  const latestItems = useRef(items);
  useEffect(() => { latestItems.current = items; }, [items]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    fetch('/api/cart/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, mode: 'pickup' }),
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error('PREVIEW_UNAVAILABLE');
      return response.json() as Promise<Preview>;
    }).then(result => { setPreview(result); setStatus('ready'); })
      .catch(error => { if (error.name !== 'AbortError') setStatus('unavailable'); });
    return () => controller.abort();
  }, [items]);

  function changeQuantity(index: number, quantity: number) {
    try {
      const next = setCatalogCartQuantity(latestItems.current, index, quantity);
      latestItems.current = next; setItems(next); setActionError('');
    } catch { setActionError('Quantité maximale atteinte : 99 exemplaires par recette.'); }
  }

  return <>
    <div className="roma-cart-intro"><p className="eyebrow">VOTRE SÉLECTION</p><h1>Votre panier</h1><p>Prix et articles relus depuis la carte du restaurant. Aucune commande n’est envoyée.</p></div>
    {editing && <CartItemEditor original={editing} onCancel={() => setEditing(null)} onApply={(original, replacement) => {
      const next = replaceCatalogCartItem(latestItems.current, original, replacement);
      latestItems.current = next; setItems(next); setEditing(null); setActionError('');
    }} />}
    {actionError && <p role="alert" className="roma-error">{actionError}</p>}
    <div className="roma-cart-layout">
      <section className="roma-cart-main" aria-label="Articles du panier">
        {!items.length ? <div className="roma-empty"><span aria-hidden="true">🍕</span><h2>Votre panier est vide</h2><p>Choisissez un article depuis la carte.</p><Link href="/menu">Explorer la carte →</Link></div> :
          status === 'loading' ? <p role="status">Vérification des prix depuis la carte…</p> :
          status === 'unavailable' || !preview ? <>
            <p role="alert" className="roma-error">Impossible de vérifier une sélection. Modifiez les articles concernés, retirez-les ou réessayez plus tard.</p>
            <ul className="roma-cart-items">{items.map((line, index) => <li key={`${line.productId}-${index}`} className="roma-cart-item">
              <div className="roma-item-details"><h2>Article à vérifier</h2><p>Quantité : {line.quantity}</p><button type="button" disabled={!!editing} onClick={() => setEditing({ ...line })}>Modifier les options</button></div>
              <button type="button" className="roma-remove" disabled={!!editing} onClick={() => changeQuantity(index, 0)}>Retirer</button>
            </li>)}</ul>
          </> :
          <ul className="roma-cart-items">{preview.items.map((item, index) => <li key={`${item.productId}-${index}`} className="roma-cart-item">
            <div className="roma-item-icon" aria-hidden="true">🍕</div><div className="roma-item-details"><h2>{item.label}</h2>
              <p>{[item.sizeLabel, ...item.extraLabels.map(label => `Supplément ${label}`), ...item.removedIngredients.map(label => `Sans ${label}`)].filter(Boolean).join(' · ') || 'Article du menu'}</p>
              <button type="button" disabled={!!editing} onClick={() => setEditing({ ...items[index] })} aria-label={`Modifier les options de ${item.label}`}>Modifier les options</button>
              <div className="roma-qty" aria-label={`Quantité pour ${item.label}`}><button type="button" disabled={!!editing} onClick={() => changeQuantity(index, items[index].quantity - 1)} aria-label="Diminuer la quantité">−</button><output aria-live="polite">{item.quantity}</output><button type="button" disabled={!!editing} onClick={() => changeQuantity(index, items[index].quantity + 1)} aria-label="Augmenter la quantité">+</button></div>
            </div><div className="roma-item-end"><strong>{money(item.totalCents - item.unitCents * (item.loyaltyFreeQuantity ?? 0))}</strong><button type="button" className="roma-remove" disabled={!!editing} onClick={() => changeQuantity(index, 0)} aria-label={`Supprimer ${item.label}`}>Supprimer</button></div>
          </li>)}</ul>}
      </section>
      <aside className="roma-summary" aria-label="Récapitulatif du panier"><h2>Récapitulatif vérifié</h2>
        <div><span>Sous-total</span><strong>{status === 'ready' && preview ? money(preview.subtotalCents) : '—'}</strong></div>
        {preview?.loyaltyDiscountCents ? <div className="roma-summary-promo"><span>Carte fidélité — plat offert</span><strong>−{money(preview.loyaltyDiscountCents)}</strong></div> : null}
        {preview?.discountCents ? <div className="roma-summary-promo"><span>{preview.promotion?.name ?? 'Promotion'}</span><strong>−{money(preview.discountCents)}</strong></div> : null}
        <div><span>Livraison</span><span>À calculer selon le mode choisi</span></div>
        <div className="roma-summary-total"><span>Total</span><strong>{status === 'ready' && preview ? money(preview.totalCents ?? preview.subtotalCents) : '—'}</strong></div>
        <Link href="/commande" className="roma-checkout">Prévisualiser livraison ou retrait →</Link>
        <p>Les prix et le sous-total proviennent du serveur. Ce récapitulatif ne crée ni commande ni paiement.</p>
      </aside>
    </div>
  </>;
}
