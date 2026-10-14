'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { addCartItem, cartTotal, setCartQuantity } from '../../lib/cart.mjs';

type CartItem = { key: string; label: string; details: string; unitCents: number; quantity: number };

const demoProduct: CartItem = {
  key: 'demo-pizza-33',
  label: 'Pizza de démonstration',
  details: 'Exemple fictif · taille 33 cm',
  unitCents: 1000,
  quantity: 1,
};

const money = (cents: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const total = useMemo(() => cartTotal(items), [items]);
  function addDemo() {
    try { setItems(current => addCartItem(current, demoProduct)); setError(''); }
    catch { setError('Quantité maximale atteinte.'); }
  }
  function changeQuantity(key: string, quantity: number) {
    try { setItems(current => setCartQuantity(current, key, quantity)); setError(''); }
    catch { setError('Quantité invalide.'); }
  }
  return (
    <main className="roma-cart">
      <header className="roma-nav">
        <Link href="/" className="roma-logo">PIZZERIA <strong>ROMA</strong><small>NAMUR</small></Link>
        <nav aria-label="Navigation principale"><Link href="/">Accueil</Link><Link href="/menu">Notre carte</Link><Link href="/panier" aria-current="page">Panier</Link></nav>
        <span className="roma-cart-count" aria-label={`${items.reduce((sum, item) => sum + item.quantity, 0)} articles`}>🛒 {items.reduce((sum, item) => sum + item.quantity, 0)}</span>
      </header>
      <div className="roma-cart-container">
        <div className="roma-cart-intro"><p className="eyebrow">VOTRE COMMANDE</p><h1>Votre panier</h1><p>Un avant-goût de l'expérience Roma. La commande en ligne n'est pas encore ouverte.</p></div>
        <div className="roma-cart-layout">
          <section className="roma-cart-main" aria-label="Articles du panier">
            <div className="roma-demo-note"><strong>Mode démonstration</strong><p>Les articles et prix ci-dessous sont fictifs. Ils ne proviennent pas de la carte du restaurant.</p><button type="button" onClick={addDemo}>+ Ajouter une pizza fictive</button></div>
            {items.length === 0 ? <div className="roma-empty"><span aria-hidden="true">🍕</span><h2>Votre panier est vide</h2><p>Ajoutez un produit de démonstration pour tester les quantités et le récapitulatif.</p><Link href="/menu">Explorer les catégories →</Link></div> : (
              <ul className="roma-cart-items">{items.map(item => <li key={item.key} className="roma-cart-item"><div className="roma-item-icon" aria-hidden="true">🍕</div><div className="roma-item-details"><h2>{item.label}</h2><p>{item.details}</p><div className="roma-qty" aria-label={`Quantité pour ${item.label}`}><button type="button" onClick={() => changeQuantity(item.key, item.quantity - 1)} aria-label="Diminuer la quantité">−</button><output aria-live="polite">{item.quantity}</output><button type="button" onClick={() => changeQuantity(item.key, item.quantity + 1)} aria-label="Augmenter la quantité">+</button></div></div><div className="roma-item-end"><strong>{money(item.unitCents * item.quantity)}</strong><button type="button" className="roma-remove" onClick={() => changeQuantity(item.key, 0)} aria-label={`Supprimer ${item.label}`}>Supprimer</button></div></li>)}</ul>
            )}
            {error && <p role="alert" className="roma-error">{error}</p>}
            <label className="roma-comment">Un commentaire pour votre commande ?<textarea value={comment} onChange={event => setComment(event.target.value.slice(0, 500))} maxLength={500} placeholder="Ex. : bien cuite, sans oignons…" rows={4}/><small>{comment.length}/500 caractères · Démonstration uniquement</small></label>
          </section>
          <aside className="roma-summary" aria-label="Récapitulatif du panier"><h2>Récapitulatif</h2><div><span>Sous-total</span><strong>{money(total)}</strong></div><div><span>Livraison</span><span>À déterminer</span></div><div className="roma-summary-total"><span>Total de démonstration</span><strong>{money(total)}</strong></div><button type="button" disabled className="roma-checkout">Commande bientôt disponible →</button><p>Les prix affichés sont fictifs. Aucun paiement ni envoi de commande n'est possible.</p><Link href="/commande" className="roma-fulfillment-back">Découvrir livraison et retrait →</Link></aside>
        </div>
      </div>
    </main>
  );
}
