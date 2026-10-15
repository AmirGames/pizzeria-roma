'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { CATALOG_CART_STORAGE_KEY } from '../lib/catalog-cart.mjs';
import { appendCustomerReorder, type CustomerReorder } from '../lib/customer-reorder.mjs';
import TestOrderSummary from './test-order-summary';
const money = (cents: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
export default function CustomerReorder({ orderId }: { orderId: string }) {
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
        setError(response.status === 401 ? 'La session a expiré. Reconnectez-vous.' : response.status === 409 ? 'Un article, un format ou une option de cet essai n’est plus disponible. Refaites votre sélection depuis la carte ; le panier est conservé.' : 'Impossible de reprendre cet essai. Réessayez plus tard.');
        return;
      }
      setPrepared(await response.json() as CustomerReorder);
    } catch { setError('Connexion interrompue. Réessayez.'); }
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
    } catch { setError('Ajout impossible : vérifiez le panier, sa capacité et les quantités (99 maximum par recette). Aucun article n’a été ajouté.'); }
    finally { pending.current = false; }
  }
  return <section aria-labelledby="customer-reorder-title"><h2 id="customer-reorder-title">Commander à nouveau</h2>
    <p>Reprenez les articles de cet essai aux prix actuels. Vérifiez le panier avant de confirmer une nouvelle commande de test.</p>
    {added ? <><p role="status">Les articles ont été ajoutés au panier. Aucune nouvelle commande n’a été créée.</p><Link href="/panier">Voir mon panier</Link></> : <>
      <button type="button" disabled={busy} onClick={() => void prepare()}>{busy ? 'Vérification…' : prepared ? 'Actualiser les articles et les prix' : 'Commander à nouveau'}</button>
      {prepared && <div><h3>Articles aux prix actuels</h3><TestOrderSummary items={prepared.preview.items} totalCents={prepared.preview.subtotalCents} />
        {prepared.previousTotalCents !== prepared.preview.subtotalCents && <p role="status">Le total a changé : ancien essai {money(prepared.previousTotalCents)}, sélection actuelle {money(prepared.preview.subtotalCents)}.</p>}
        <p>Ces articles s’ajoutent à votre panier. Les recettes identiques sont regroupées. L’adresse, les coordonnées et le commentaire de l’ancien essai ne sont pas repris.</p>
        <button type="button" onClick={confirm}>Ajouter ces articles au panier</button><button type="button" onClick={() => { setPrepared(null); setError(''); }}>Annuler la reprise</button>
      </div>}
    </>}
    {error && <p role="alert">{error}</p>}<p><Link href="/menu">Choisir depuis la carte</Link></p>
  </section>;
}
