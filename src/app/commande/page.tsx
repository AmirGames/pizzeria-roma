'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DELIVERY_ZONES, evaluateCartFulfillment, isWithinRestaurantService } from '../../lib/fulfillment.mjs';
import { useCart } from '../../lib/use-cart';
import { useCatalogCart } from '../../lib/use-catalog-cart';

type Mode = 'delivery' | 'pickup';
type CatalogPreview = { fulfillment: { eligible: boolean; minimum: number; dishCount: number; deliveryFeeCents: number }; promotion?: { name: string } | null; discountCents?: number; loyaltyDiscountCents?: number };

export default function FulfillmentPage() {
  const { items, ready } = useCart();
  const catalogCart = useCatalogCart();
  const [mode, setMode] = useState<Mode>('delivery');
  const [zone, setZone] = useState('namur-centre');
  const [address, setAddress] = useState('');
  const [catalogPreview, setCatalogPreview] = useState<CatalogPreview | null>(null);
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const [serviceOpen, setServiceOpen] = useState<boolean | null>(null);
  const isCatalogCart = catalogCart.items.length > 0;
  const demoPolicy = evaluateCartFulfillment({ mode, zoneId: zone, items });
  const policy = isCatalogCart && catalogPreview ? catalogPreview.fulfillment : demoPolicy;

  useEffect(() => {
    const updateServiceStatus = () => setServiceOpen(isWithinRestaurantService(new Date()));
    updateServiceStatus();
    const timer = window.setInterval(updateServiceStatus, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!catalogCart.ready || !isCatalogCart) {
      setCatalogPreview(null);
      setPreviewStatus('idle');
      return;
    }
    const controller = new AbortController();
    setPreviewStatus('loading');
    fetch('/api/cart/preview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: catalogCart.items, mode, ...(mode === 'delivery' ? { zoneId: zone } : {}) }),
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error('PREVIEW_UNAVAILABLE');
      return response.json() as Promise<CatalogPreview>;
    }).then(result => { setCatalogPreview(result); setPreviewStatus('ready'); })
      .catch(error => { if (error.name !== 'AbortError') setPreviewStatus('unavailable'); });
    return () => controller.abort();
  }, [catalogCart.items, catalogCart.ready, isCatalogCart, mode, zone]);
  return (
    <main className="roma-fulfillment">
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
            {(!ready || !catalogCart.ready) ? <p role="status">Chargement du panier…</p> : isCatalogCart ? null : items.length === 0 ? <div role="status" className="roma-policy-warning"><p>Le panier est vide. Ajoutez un article de démonstration ou choisissez un produit de la carte pour voir le calcul des règles.</p><Link href="/panier">Retourner au panier →</Link></div> : null}
            {mode === 'delivery' ? (
              <div className="roma-delivery-fields">
                <label>Votre zone de livraison<select value={zone} onChange={event => setZone(event.target.value)}>{DELIVERY_ZONES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                <label>Adresse de livraison<input value={address} onChange={event => setAddress(event.target.value.slice(0, 200))} maxLength={200} autoComplete="street-address" placeholder="Rue et numéro, Namur"/></label>
                {isCatalogCart && previewStatus === 'loading' ? <p role="status">Calcul serveur de la sélection…</p> : null}
                {isCatalogCart && previewStatus === 'unavailable' ? <p role="alert" className="roma-error">Impossible de vérifier la carte et les règles pour le moment.</p> : null}
                {isCatalogCart && previewStatus !== 'ready' ? null : <div role="status" className={policy.eligible ? 'roma-policy-ok' : 'roma-policy-warning'}>{policy.eligible ? '✓ Minimum indicatif atteint' : 'Minimum indicatif non atteint'} : {policy.dishCount} plat{policy.dishCount !== 1 ? 's' : ''} équivalent{policy.dishCount !== 1 ? 's' : ''} dans le panier · minimum {policy.minimum} plat{policy.minimum > 1 ? 's' : ''} (pizzas ou pâtes) · Livraison gratuite.</div>}
                <p className="roma-policy-caveat">{isCatalogCart ? 'Le serveur relit les articles, prix et règles depuis le catalogue. L’adresse reste une saisie de démonstration et n’est pas vérifiée.' : 'Le calcul du panier fictif est local. La zone sélectionnée ne valide pas l’adresse et aucun prix n’est vérifié côté serveur.'}</p>
              </div>
            ) : <div className="roma-pickup-note"><strong>Retrait sur place</strong><p>Rue Général Michel 23, Namur</p><p>Temps de préparation estimé : 30 à 40 minutes, à confirmer par le restaurant.</p><p>Le retrait n'a pas de minimum de plats.</p></div>}
          </section>
          <aside className="roma-fulfillment-card">
            <h2>Horaires prévus</h2>
            {catalogPreview?.discountCents ? <p className="roma-policy-ok">Promotion active : {catalogPreview.promotion?.name} · remise de {(catalogPreview.discountCents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })} appliquée au récapitulatif de commande test.</p> : null}
            {catalogPreview?.loyaltyDiscountCents ? <p className="roma-policy-ok">Carte de fidélité : un plat est offert, soit {(catalogPreview.loyaltyDiscountCents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })} de remise au récapitulatif.</p> : null}
            <p role="status" className={serviceOpen ? 'roma-policy-ok' : 'roma-policy-warning'}>{serviceOpen === null ? 'Vérification des horaires…' : serviceOpen ? 'Ouvert selon les horaires publiés' : 'Fermé selon les horaires publiés'}</p>
            <p className="roma-policy-caveat">Calcul informatif selon Europe/Brussels et les jours fériés légaux belges : 18h–22h, sauf dimanche fermé. Les jours de remplacement ou exceptions propres au restaurant ne sont pas intégrés. Aucun créneau n’est réservé.</p>
            <div className="roma-hours-row"><span>Lundi – vendredi</span><strong>11h30–14h00<br/>18h00–22h00</strong></div>
            <div className="roma-hours-row"><span>Samedi</span><strong>18h00–22h00</strong></div>
            <div className="roma-hours-row"><span>Dimanche</span><strong>Fermé</strong></div>
            <div className="roma-slot-note"><h3>Créneaux horaires</h3><p>Les créneaux de livraison et de retrait seront activés lorsque la gestion des commandes et des disponibilités sera opérationnelle.</p></div>
            <Link href="/commande/test" className="roma-checkout">Essayer une commande de test →</Link>
            <Link href="/panier" className="roma-fulfillment-back">← Retour au panier</Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
