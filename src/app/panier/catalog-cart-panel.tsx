'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import CartItemEditor from './cart-item-editor';
import { replaceCatalogCartItem, setCatalogCartQuantity } from '../../lib/catalog-cart.mjs';
import type { CatalogCartLine } from '../../lib/catalog-cart.mjs';
import type { SiteLocale } from '../../lib/locale';
import { getMessages } from '../../i18n/messages';

type Preview = { items: Array<{ productId: string; label: string; quantity: number; sizeLabel?: string; extraIds: string[]; extraLabels: string[]; removedIngredients: string[]; unitCents: number; totalCents: number; loyaltyFreeQuantity?: number }>; subtotalCents: number; totalCents?: number; discountCents?: number; loyaltyDiscountCents?: number; promotion?: { name: string } | null };
const money = (cents: number, locale: SiteLocale) => new Intl.NumberFormat(locale === 'en' ? 'en-BE' : 'fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export default function CatalogCartPanel({ items, setItems, realOrdersEnabled = false, locale = 'fr' }: {
  items: CatalogCartLine[];
  setItems: Dispatch<SetStateAction<CatalogCartLine[]>>;
  realOrdersEnabled?: boolean;
  locale?: SiteLocale;
}) {
  const t = getMessages(locale).cart;
  const [editing, setEditing] = useState<CatalogCartLine | null>(null);
  const [actionError, setActionError] = useState('');
  const latestItems = useRef(items);
  useEffect(() => { latestItems.current = items; }, [items]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    fetch(realOrdersEnabled ? '/api/orders/preview' : '/api/cart/preview', {
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
  }, [items, locale, realOrdersEnabled]);

  function changeQuantity(index: number, quantity: number) {
    try {
      const next = setCatalogCartQuantity(latestItems.current, index, quantity);
      latestItems.current = next; setItems(next); setActionError('');
    } catch { setActionError(t.maxQuantity); }
  }

  return <>
    <div className="roma-cart-intro"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{realOrdersEnabled ? t.realIntro : t.testIntro}</p></div>
    {editing && <CartItemEditor original={editing} onCancel={() => setEditing(null)} onApply={(original, replacement) => {
      const next = replaceCatalogCartItem(latestItems.current, original, replacement);
      latestItems.current = next; setItems(next); setEditing(null); setActionError('');
    }} locale={locale} />}
    {actionError && <p role="alert" className="roma-error">{actionError}</p>}
    <div className="roma-cart-layout">
      <section className="roma-cart-main" aria-label={t.itemsLabel}>
        {!items.length ? <div className="roma-empty"><span aria-hidden="true">🍕</span><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p><Link href="/menu">{t.browseMenu}</Link></div> :
          status === 'loading' ? <p role="status">{t.checkingPrices}</p> :
          status === 'unavailable' || !preview ? <>
            <p role="alert" className="roma-error">{t.verificationError}</p>
            <ul className="roma-cart-items">{items.map((line, index) => <li key={`${line.productId}-${index}`} className="roma-cart-item">
              <div className="roma-item-details"><h2>{t.itemToVerify}</h2><p>{t.quantity} : {line.quantity}</p><button type="button" disabled={!!editing} onClick={() => setEditing({ ...line })}>{t.editOptions}</button></div>
              <button type="button" className="roma-remove" disabled={!!editing} onClick={() => changeQuantity(index, 0)}>{t.remove}</button>
            </li>)}</ul>
          </> :
          <ul className="roma-cart-items">{preview.items.map((item, index) => <li key={`${item.productId}-${index}`} className="roma-cart-item">
            <div className="roma-item-icon" aria-hidden="true">🍕</div><div className="roma-item-details"><h2>{item.label}</h2>
              <p>{[item.sizeLabel, ...item.extraLabels.map(label => `${t.extra} ${label}`), ...item.removedIngredients.map(label => `${t.without} ${label}`)].filter(Boolean).join(' · ') || t.menuItem}</p>
              <button type="button" disabled={!!editing} onClick={() => setEditing({ ...items[index] })} aria-label={t.editOptionsFor(item.label)}>{t.editOptions}</button>
              <div className="roma-qty" aria-label={t.quantityFor(item.label)}><button type="button" disabled={!!editing} onClick={() => changeQuantity(index, items[index].quantity - 1)} aria-label={t.decrease}>−</button><output aria-live="polite">{item.quantity}</output><button type="button" disabled={!!editing} onClick={() => changeQuantity(index, items[index].quantity + 1)} aria-label={t.increase}>+</button></div>
            </div><div className="roma-item-end"><strong>{money(item.totalCents - item.unitCents * (item.loyaltyFreeQuantity ?? 0), locale)}</strong><button type="button" className="roma-remove" disabled={!!editing} onClick={() => changeQuantity(index, 0)} aria-label={t.removeItem(item.label)}>{t.remove}</button></div>
          </li>)}</ul>}
      </section>
      <aside className="roma-summary" aria-label={t.summaryLabel}><h2>{t.verifiedSummary}</h2>
        <div><span>{t.subtotal}</span><strong>{status === 'ready' && preview ? money(preview.subtotalCents, locale) : '—'}</strong></div>
        {preview?.loyaltyDiscountCents ? <div className="roma-summary-promo"><span>{t.loyalty}</span><strong>−{money(preview.loyaltyDiscountCents, locale)}</strong></div> : null}
        {preview?.discountCents ? <div className="roma-summary-promo"><span>{preview.promotion?.name ?? t.promotion}</span><strong>−{money(preview.discountCents, locale)}</strong></div> : null}
        <div><span>{t.delivery}</span><span>{t.deliveryLater}</span></div>
        <div className="roma-summary-total"><span>{t.total}</span><strong>{status === 'ready' && preview ? money(preview.totalCents ?? preview.subtotalCents, locale) : '—'}</strong></div>
        <section className="roma-cart-access" aria-labelledby="cart-access-title">
          <h3 id="cart-access-title">{t.continueTitle}</h3>
          <Link href="/compte?retour=commande" className="roma-checkout">{t.accountLink}</Link>
          <Link href="/commande" className="roma-cart-guest">{t.guestLink}</Link>
          <p>{realOrdersEnabled ? t.accountOrGuest : t.guestTestNotice}</p>
        </section>
        <p>{t.serverPrices}</p>
      </aside>
    </div>
  </>;
}
