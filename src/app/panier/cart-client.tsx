'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { addCartItem, cartTotal, setCartQuantity } from '../../lib/cart.mjs';
import type { CartLine } from '../../lib/cart.mjs';
import { useCart } from '../../lib/use-cart';
import { useCatalogCart } from '../../lib/use-catalog-cart';
import CatalogCartPanel from './catalog-cart-panel';
import type { SiteLocale } from '../../lib/locale';

const demoProduct: CartLine = {
  key: 'demo-pizza-33',
  label: 'Pizza de démonstration',
  details: 'Exemple fictif · taille 33 cm',
  unitCents: 1000,
  quantity: 1,
  category: 'pizza',
  sizeCm: '33',
};

const money = (cents: number, locale: SiteLocale) => new Intl.NumberFormat(locale === 'en' ? 'en-BE' : 'fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export default function CartPage({ realOrdersEnabled = false, locale = 'fr' }: { realOrdersEnabled?: boolean; locale?: SiteLocale }) {
  const en = locale === 'en';
  const { items, setItems, ready } = useCart();
  const catalogCart = useCatalogCart();
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const total = useMemo(() => cartTotal(items), [items]);
  function addDemo() {
    try { setItems(current => addCartItem(current, demoProduct)); setError(''); }
    catch { setError(en ? 'Maximum quantity reached.' : 'Quantité maximale atteinte.'); }
  }
  function changeQuantity(key: string, quantity: number) {
    try { setItems(current => setCartQuantity(current, key, quantity)); setError(''); }
    catch { setError(en ? 'Invalid quantity.' : 'Quantité invalide.'); }
  }
  if (catalogCart.ready && catalogCart.items.length > 0) {
    return (
      <main className="roma-cart">
        <div className="roma-cart-container"><CatalogCartPanel items={catalogCart.items} setItems={catalogCart.setItems} realOrdersEnabled={realOrdersEnabled} locale={locale} /></div>
      </main>
    );
  }
  return (
    <main className="roma-cart">
      <div className="roma-cart-container">
        <div className="roma-cart-intro"><p className="eyebrow">{en ? 'YOUR ORDER' : 'VOTRE COMMANDE'}</p><h1>{en ? 'Your cart' : 'Votre panier'}</h1><p>{realOrdersEnabled ? en ? 'Check your menu items and continue to secure payment.' : 'Vérifiez les produits de la carte et continuez vers le paiement sécurisé.' : en ? 'A taste of the Roma experience. Online ordering is not open yet.' : 'Un avant-goût de l’expérience Roma. Les commandes en ligne ne sont pas encore ouvertes.'}</p></div>
        <div className="roma-cart-layout">
          <section className="roma-cart-main" aria-label={en ? 'Cart items' : 'Articles du panier'}>
            <div className="roma-demo-note"><strong>{en ? 'Demo mode' : 'Mode démonstration'}</strong><p>{en ? 'The items and prices below are examples. They are not from the restaurant menu.' : 'Les articles et prix ci-dessous sont fictifs. Ils ne proviennent pas de la carte du restaurant.'}</p><button type="button" onClick={addDemo} disabled={!ready}>{en ? '+ Add a sample pizza' : '+ Ajouter une pizza fictive'}</button></div>
            {!ready ? <p role="status">{en ? 'Loading cart…' : 'Chargement du panier…'}</p> : items.length === 0 ? <div className="roma-empty"><span aria-hidden="true">🍕</span><h2>{en ? 'Your cart is empty' : 'Votre panier est vide'}</h2><p>{en ? 'Add a sample item to try quantities and the order summary.' : 'Ajoutez un produit de démonstration pour tester les quantités et le récapitulatif.'}</p><Link href="/menu">{en ? 'Browse menu categories →' : 'Explorer les catégories →'}</Link></div> : (
              <ul className="roma-cart-items">{items.map(item => <li key={item.key} className="roma-cart-item"><div className="roma-item-icon" aria-hidden="true">🍕</div><div className="roma-item-details"><h2>{en ? 'Sample pizza' : item.label}</h2><p>{en ? 'Sample item · 33 cm' : item.details}</p><div className="roma-qty" aria-label={`${en ? 'Quantity for' : 'Quantité pour'} ${item.label}`}><button type="button" onClick={() => changeQuantity(item.key, item.quantity - 1)} aria-label={en ? 'Decrease quantity' : 'Diminuer la quantité'}>−</button><output aria-live="polite">{item.quantity}</output><button type="button" onClick={() => changeQuantity(item.key, item.quantity + 1)} aria-label={en ? 'Increase quantity' : 'Augmenter la quantité'}>+</button></div></div><div className="roma-item-end"><strong>{money(item.unitCents * item.quantity, locale)}</strong><button type="button" className="roma-remove" onClick={() => changeQuantity(item.key, 0)} aria-label={`${en ? 'Remove' : 'Supprimer'} ${item.label}`}>{en ? 'Remove' : 'Supprimer'}</button></div></li>)}</ul>
            )}
            {error && <p role="alert" className="roma-error">{error}</p>}
            <label className="roma-comment">{en ? 'A note for your order?' : 'Un commentaire pour votre commande ?'}<textarea value={comment} onChange={event => setComment(event.target.value.slice(0, 500))} maxLength={500} placeholder={en ? 'e.g. well done, no onions…' : 'Ex. : bien cuite, sans oignons…'} rows={4}/><small>{comment.length}/500 {en ? 'characters · Demo only' : 'caractères · Démonstration uniquement'}</small></label>
          </section>
          <aside className="roma-summary" aria-label={en ? 'Cart summary' : 'Récapitulatif du panier'}><h2>{en ? 'Summary' : 'Récapitulatif'}</h2><div><span>{en ? 'Subtotal' : 'Sous-total'}</span><strong>{money(total, locale)}</strong></div><div><span>{en ? 'Delivery' : 'Livraison'}</span><span>{en ? 'To be determined' : 'À déterminer'}</span></div><div className="roma-summary-total"><span>{en ? 'Demo total' : 'Total de démonstration'}</span><strong>{money(total, locale)}</strong></div><Link href="/commande" className="roma-checkout">{en ? 'Choose delivery or collection →' : 'Choisir livraison ou retrait →'}</Link><p>{en ? 'Your collection method and delivery minimum will be calculated from the items in your cart. No payment or order will be sent.' : 'Le mode de récupération et le minimum de livraison seront calculés à partir des articles du panier. Aucun paiement ni envoi de commande n’est possible.'}</p><Link href="/commande" className="roma-fulfillment-back">{en ? 'View delivery and collection rules →' : 'Voir les règles de livraison et retrait →'}</Link></aside>
        </div>
      </div>
    </main>
  );
}
