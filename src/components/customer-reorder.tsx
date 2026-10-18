'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { CATALOG_CART_STORAGE_KEY } from '../lib/catalog-cart.mjs';
import { appendCustomerReorder, type CustomerReorder } from '../lib/customer-reorder.mjs';
import TestOrderSummary from './test-order-summary';
import type { SiteLocale } from '../lib/locale';
const money = (cents: number, locale: SiteLocale) => new Intl.NumberFormat(locale === 'en' ? 'en-BE' : 'fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
export default function CustomerReorder({ orderId, locale = 'fr' }: { orderId: string; locale?: SiteLocale }) {
  const en = locale === 'en';
  const [prepared, setPrepared] = useState<CustomerReorder | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const addedOnce = useRef(false);
  async function prepare() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setPrepared(null);
    try {
      const response = await fetch(`/api/test-orders/${encodeURIComponent(orderId)}/reorder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!response.ok) {
        setError(en ? (response.status === 401 ? 'Your session expired. Please sign in again.' : response.status === 409 ? 'An item, size or option from this test order is no longer available. Choose items from the menu again; your cart will be kept.' : 'Could not repeat this test order. Please try again later.') : (response.status === 401 ? 'La session a expiré. Reconnectez-vous.' : response.status === 409 ? 'Un article, un format ou une option de cet essai n’est plus disponible. Refaites votre sélection depuis la carte ; le panier est conservé.' : 'Impossible de reprendre cet essai. Réessayez plus tard.'));
        return;
      }
      setPrepared(await response.json() as CustomerReorder);
    } catch { setError(en ? 'Connection interrupted. Please try again.' : 'Connexion interrompue. Réessayez.'); }
    finally { pending.current = false; setBusy(false); }
  }
  function confirm() {
    if (!prepared || addedOnce.current || pending.current) return;
    pending.current = true; setError('');
    try {
      // Read at confirmation time to preserve additions from other pages/tabs.
      const cart = appendCustomerReorder(window.localStorage.getItem(CATALOG_CART_STORAGE_KEY), prepared.items);
      window.localStorage.setItem(CATALOG_CART_STORAGE_KEY, JSON.stringify(cart));
      addedOnce.current = true; setAdded(true); setPrepared(null);
    } catch { setError(en ? 'Could not add items. Check cart capacity and quantities (maximum 99 per item). Nothing was added.' : 'Ajout impossible : vérifiez le panier, sa capacité et les quantités (99 maximum par recette). Aucun article n’a été ajouté.'); }
    finally { pending.current = false; }
  }
  return <section aria-labelledby="customer-reorder-title"><h2 id="customer-reorder-title">{en ? 'Order again' : 'Commander à nouveau'}</h2>
    <p>{en ? 'Repeat the items from this test order at current prices. Review your cart before placing another test order.' : 'Reprenez les articles de cet essai aux prix actuels. Vérifiez le panier avant de confirmer une nouvelle commande de test.'}</p>
    {added ? <><p role="status">{en ? 'Items were added to your cart. No new order was created.' : 'Les articles ont été ajoutés au panier. Aucune nouvelle commande n’a été créée.'}</p><Link href="/panier">{en ? 'View my cart' : 'Voir mon panier'}</Link></> : <>
      <button type="button" disabled={busy} onClick={() => void prepare()}>{busy ? (en ? 'Checking…' : 'Vérification…') : prepared ? (en ? 'Refresh items and prices' : 'Actualiser les articles et les prix') : (en ? 'Order again' : 'Commander à nouveau')}</button>
      {prepared && <div><h3>{en ? 'Items at current prices' : 'Articles aux prix actuels'}</h3><TestOrderSummary items={prepared.preview.items} totalCents={prepared.preview.subtotalCents} locale={locale} />
        {prepared.previousTotalCents !== prepared.preview.subtotalCents && <p role="status">{en ? `The total changed: previous test ${money(prepared.previousTotalCents, locale)}, current selection ${money(prepared.preview.subtotalCents, locale)}.` : `Le total a changé : ancien essai ${money(prepared.previousTotalCents, locale)}, sélection actuelle ${money(prepared.preview.subtotalCents, locale)}.`}</p>}
        <p>{en ? 'These items will be added to your cart. Identical recipes are grouped. The old address, contact details and comment are not copied.' : 'Ces articles s’ajoutent à votre panier. Les recettes identiques sont regroupées. L’adresse, les coordonnées et le commentaire de l’ancien essai ne sont pas repris.'}</p>
        <button type="button" onClick={confirm}>{en ? 'Add these items to my cart' : 'Ajouter ces articles au panier'}</button><button type="button" onClick={() => { setPrepared(null); setError(''); }}>{en ? 'Cancel' : 'Annuler la reprise'}</button>
      </div>}
    </>}
    {error && <p role="alert">{error}</p>}<p><Link href="/menu">{en ? 'Choose from the menu' : 'Choisir depuis la carte'}</Link></p>
  </section>;
}
