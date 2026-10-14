'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DELIVERY_ZONES, evaluateDelivery } from '../../lib/fulfillment.mjs';

type Mode = 'delivery' | 'pickup';

export default function FulfillmentPage() {
  const [mode, setMode] = useState<Mode>('delivery');
  const [zone, setZone] = useState('namur-centre');
  const [address, setAddress] = useState('');
  const [mainDishes, setMainDishes] = useState(1);
  const policy = evaluateDelivery({ mode, zoneId: zone, mainDishCount: mainDishes });
  return (
    <main className="roma-fulfillment">
      <header className="roma-nav">
        <Link href="/" className="roma-logo">PIZZERIA <strong>ROMA</strong><small>NAMUR</small></Link>
        <nav aria-label="Navigation principale"><Link href="/">Accueil</Link><Link href="/menu">Notre carte</Link><Link href="/panier">Panier</Link></nav>
        <span className="roma-cart-count">Livraison & retrait</span>
      </header>
      <div className="roma-fulfillment-container">
        <p className="eyebrow">PIZZERIA ROMA · NAMUR</p>
        <h1>Livraison ou à emporter</h1>
        <p className="roma-fulfillment-lead">Choisissez comment vous souhaitez récupérer votre commande. Cet écran présente les règles prévues : les commandes ne sont pas encore ouvertes.</p>
        <div className="roma-fulfillment-layout">
          <section className="roma-fulfillment-card" aria-label="Mode de commande">
            <h2>Mode de commande</h2>
            <div className="roma-mode-options">
              <button type="button" aria-pressed={mode === 'delivery'} className={mode === 'delivery' ? 'selected' : ''} onClick={() => setMode('delivery')}><span aria-hidden="true">🚚</span><strong>Livraison</strong><small>Gratuite selon votre zone</small></button>
              <button type="button" aria-pressed={mode === 'pickup'} className={mode === 'pickup' ? 'selected' : ''} onClick={() => setMode('pickup')}><span aria-hidden="true">🛍️</span><strong>À emporter</strong><small>Préparation estimée : 30 à 40 min</small></button>
            </div>
            {mode === 'delivery' ? (
              <div className="roma-delivery-fields">
                <label>Votre zone de livraison<select value={zone} onChange={event => setZone(event.target.value)}>{DELIVERY_ZONES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                <label>Adresse de livraison<input value={address} onChange={event => setAddress(event.target.value)} maxLength={200} autoComplete="street-address" placeholder="Rue et numéro, Namur"/></label>
                <label>Nombre de pizzas et plats de pâtes (simulation)<input type="number" min={0} max={99} value={mainDishes} onChange={event => { const value = Number(event.target.value); setMainDishes(Number.isSafeInteger(value) && value >= 0 && value <= 99 ? value : 0); }}/></label>
                <div role="status" className={policy.eligible ? 'roma-policy-ok' : 'roma-policy-warning'}>{policy.eligible ? '✓ Minimum indicatif atteint' : 'Minimum indicatif non atteint'} : {policy.minimum} plat{policy.minimum > 1 ? 's' : ''} (pizzas ou pâtes) · Livraison gratuite.</div>
                <p className="roma-policy-caveat">La zone sélectionnée n'est pas une validation de l'adresse. La couverture réelle devra être vérifiée côté serveur.</p>
              </div>
            ) : <div className="roma-pickup-note"><strong>Retrait sur place</strong><p>Rue Général Michel 23, Namur</p><p>Temps de préparation estimé : 30 à 40 minutes, à confirmer par le restaurant.</p></div>}
          </section>
          <aside className="roma-fulfillment-card">
            <h2>Horaires prévus</h2>
            <div className="roma-hours-row"><span>Lundi – vendredi</span><strong>11h30–14h00<br/>18h00–22h00</strong></div>
            <div className="roma-hours-row"><span>Samedi</span><strong>18h00–22h00</strong></div>
            <div className="roma-hours-row"><span>Dimanche</span><strong>Fermé</strong></div>
            <div className="roma-slot-note"><h3>Créneaux horaires</h3><p>Les créneaux de livraison et de retrait seront activés lorsque la gestion des commandes et des disponibilités sera opérationnelle.</p></div>
            <button type="button" className="roma-checkout" disabled>Continuer — bientôt disponible</button>
            <Link href="/panier" className="roma-fulfillment-back">← Retour au panier</Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
