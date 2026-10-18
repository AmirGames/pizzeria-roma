'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DELIVERY_ZONES, evaluateCartFulfillment, isWithinRestaurantService } from '../../lib/fulfillment.mjs';
import { useCart } from '../../lib/use-cart';
import { useCatalogCart } from '../../lib/use-catalog-cart';
import type { SiteLocale } from '../../lib/locale';
// @ts-ignore JavaScript module
import { englishMenuTerm } from '../../lib/menu-translation.mjs';

type Mode = 'delivery' | 'pickup';
type CatalogPreview = { fulfillment: { eligible: boolean; minimum: number; dishCount: number; deliveryFeeCents: number }; promotion?: { name: string } | null; discountCents?: number; loyaltyDiscountCents?: number };

export default function FulfillmentPage({ locale = 'fr' }: { locale?: SiteLocale }) {
  const en = locale === 'en';
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
        <section className="fulfillment-hero">
          <p className="eyebrow">PIZZERIA ROMA · NAMUR</p>
          <h1>{en ? 'Delivery or collection' : 'Livraison ou à emporter'}</h1>
          <p className="roma-fulfillment-lead">{en ? 'Choose how you would like to receive your order. These are the planned rules; online ordering is not open yet.' : 'Choisissez comment vous souhaitez récupérer votre commande. Cet écran présente les règles prévues : les commandes ne sont pas encore ouvertes.'}</p>
        </section>
        <div className="roma-fulfillment-layout">
          <section className="roma-fulfillment-card" aria-label={en ? 'Order method' : 'Mode de commande'}>
            <h2>{en ? 'Order method' : 'Mode de commande'}</h2>
            <div className="roma-mode-options">
              <button type="button" aria-pressed={mode === 'delivery'} className={mode === 'delivery' ? 'selected' : ''} onClick={() => setMode('delivery')}><span aria-hidden="true">🚚</span><strong>{en ? 'Delivery' : 'Livraison'}</strong><small>{en ? 'Free in eligible areas' : 'Gratuite selon votre zone'}</small></button>
              <button type="button" aria-pressed={mode === 'pickup'} className={mode === 'pickup' ? 'selected' : ''} onClick={() => setMode('pickup')}><span aria-hidden="true">🛍️</span><strong>{en ? 'Collection' : 'À emporter'}</strong><small>{en ? 'Estimated preparation: 30–40 min' : 'Préparation estimée : 30 à 40 min'}</small></button>
            </div>
            {(!ready || !catalogCart.ready) ? <p role="status">{en ? 'Loading cart…' : 'Chargement du panier…'}</p> : isCatalogCart ? null : items.length === 0 ? <div role="status" className="roma-policy-warning"><p>{en ? 'Your cart is empty. Add a sample item or choose a menu item to see how the rules are calculated.' : 'Le panier est vide. Ajoutez un article de démonstration ou choisissez un produit de la carte pour voir le calcul des règles.'}</p><Link href="/panier">{en ? 'Back to cart →' : 'Retourner au panier →'}</Link></div> : null}
            {mode === 'delivery' ? (
              <div className="roma-delivery-fields">
                <label>{en ? 'Delivery area' : 'Votre zone de livraison'}<select value={zone} onChange={event => setZone(event.target.value)}>{DELIVERY_ZONES.map(item => <option key={item.id} value={item.id}>{en ? englishMenuTerm(item.label) : item.label}</option>)}</select></label>
                <label>{en ? 'Delivery address' : 'Adresse de livraison'}<input value={address} onChange={event => setAddress(event.target.value.slice(0, 200))} maxLength={200} autoComplete="street-address" placeholder={en ? 'Street and number, Namur' : 'Rue et numéro, Namur'}/></label>
                {isCatalogCart && previewStatus === 'loading' ? <p role="status">{en ? 'Checking your selection…' : 'Calcul serveur de la sélection…'}</p> : null}
                {isCatalogCart && previewStatus === 'unavailable' ? <p role="alert" className="roma-error">{en ? 'We cannot check the menu and rules right now.' : 'Impossible de vérifier la carte et les règles pour le moment.'}</p> : null}
                {isCatalogCart && previewStatus !== 'ready' ? null : <div role="status" className={policy.eligible ? 'roma-policy-ok' : 'roma-policy-warning'}>{en ? `${policy.eligible ? '✓ Indicative minimum reached' : 'Indicative minimum not reached'}: ${policy.dishCount} equivalent dish(es) in cart · minimum ${policy.minimum} pizza or pasta dish(es) · free delivery.` : `${policy.eligible ? '✓ Minimum indicatif atteint' : 'Minimum indicatif non atteint'} : ${policy.dishCount} plat${policy.dishCount !== 1 ? 's' : ''} équivalent${policy.dishCount !== 1 ? 's' : ''} dans le panier · minimum ${policy.minimum} plat${policy.minimum > 1 ? 's' : ''} (pizzas ou pâtes) · Livraison gratuite.`}</div>}
                <p className="roma-policy-caveat">{isCatalogCart ? (en ? 'The server checks items, prices and rules against the menu. The address is still a demo field and is not verified.' : 'Le serveur relit les articles, prix et règles depuis le catalogue. L’adresse reste une saisie de démonstration et n’est pas vérifiée.') : (en ? 'The sample cart is calculated locally. The selected area does not verify your address, and prices are not checked by the server.' : 'Le calcul du panier fictif est local. La zone sélectionnée ne valide pas l’adresse et aucun prix n’est vérifié côté serveur.')}</p>
              </div>
            ) : <div className="roma-pickup-note"><strong>{en ? 'Collection in person' : 'Retrait sur place'}</strong><p>Rue Général Michel 23, Namur</p><p>{en ? 'Estimated preparation time: 30–40 minutes, to be confirmed by the restaurant.' : 'Temps de préparation estimé : 30 à 40 minutes, à confirmer par le restaurant.'}</p><p>{en ? 'There is no minimum number of dishes for collection.' : 'Le retrait n’a pas de minimum de plats.'}</p></div>}
          </section>
          <aside className="roma-fulfillment-card">
            <h2>{en ? 'Planned opening hours' : 'Horaires prévus'}</h2>
            {catalogPreview?.discountCents ? <p className="roma-policy-ok">{en ? `Active promotion: ${catalogPreview.promotion?.name} · ${(catalogPreview.discountCents / 100).toLocaleString('en-BE', { style: 'currency', currency: 'EUR' })} discount applied to the test order summary.` : `Promotion active : ${catalogPreview.promotion?.name} · remise de ${(catalogPreview.discountCents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })} appliquée au récapitulatif de commande test.`}</p> : null}
            {catalogPreview?.loyaltyDiscountCents ? <p className="roma-policy-ok">{en ? `Loyalty card: one dish is free, a ${(catalogPreview.loyaltyDiscountCents / 100).toLocaleString('en-BE', { style: 'currency', currency: 'EUR' })} discount in the summary.` : `Carte de fidélité : un plat est offert, soit ${(catalogPreview.loyaltyDiscountCents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })} de remise au récapitulatif.`}</p> : null}
            <p role="status" className={serviceOpen ? 'roma-policy-ok' : 'roma-policy-warning'}>{serviceOpen === null ? (en ? 'Checking opening hours…' : 'Vérification des horaires…') : serviceOpen ? (en ? 'Open according to published hours' : 'Ouvert selon les horaires publiés') : (en ? 'Closed according to published hours' : 'Fermé selon les horaires publiés')}</p>
            <p className="roma-policy-caveat">{en ? 'Informational calculation for Europe/Brussels and Belgian public holidays: 6–10 pm, closed on Sunday. Substitute days and restaurant-specific exceptions are not included. No time slot is reserved.' : 'Calcul informatif selon Europe/Brussels et les jours fériés légaux belges : 18h–22h, sauf dimanche fermé. Les jours de remplacement ou exceptions propres au restaurant ne sont pas intégrés. Aucun créneau n’est réservé.'}</p>
            <div className="roma-hours-row"><span>{en ? 'Monday – Friday' : 'Lundi – vendredi'}</span><strong>11:30 am–2:00 pm<br/>6:00–10:00 pm</strong></div>
            <div className="roma-hours-row"><span>{en ? 'Saturday' : 'Samedi'}</span><strong>6:00–10:00 pm</strong></div>
            <div className="roma-hours-row"><span>{en ? 'Sunday' : 'Dimanche'}</span><strong>{en ? 'Closed' : 'Fermé'}</strong></div>
            <div className="roma-slot-note"><h3>{en ? 'Time slots' : 'Créneaux horaires'}</h3><p>{en ? 'Delivery and collection slots will be enabled when order and availability management is operational.' : 'Les créneaux de livraison et de retrait seront activés lorsque la gestion des commandes et des disponibilités sera opérationnelle.'}</p></div>
            <Link href="/commande/test" className="roma-checkout">{en ? 'Try a test order →' : 'Essayer une commande de test →'}</Link>
            <Link href="/panier" className="roma-fulfillment-back">← {en ? 'Back to cart' : 'Retour au panier'}</Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
