'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCatalogCart } from '../../../lib/use-catalog-cart';
import { consumeCatalogCartItems } from '../../../lib/catalog-cart.mjs';
import type { CatalogCartPreview } from '../../../lib/catalog-cart-preview.mjs';
import TestOrderSummary from '../../../components/test-order-summary';
import Link from 'next/link';
import type { SavedCustomerAddress } from '../../../lib/customer-address.mjs';
import type { SiteLocale } from '../../../lib/locale';
// @ts-ignore JavaScript module
import { englishMenuTerm } from '../../../lib/menu-translation.mjs';

function brusselsToday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
type Slot = { value: string; time: string; remainingPizzas: number };
const money = (cents: number, locale: SiteLocale) => new Intl.NumberFormat(locale === 'en' ? 'en-BE' : 'fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export default function TestCheckout({ name, phone, addresses, locale = 'fr' }: { name: string; phone: string; addresses: SavedCustomerAddress[]; locale?: SiteLocale }) {
  const en = locale === 'en';
  const cart = useCatalogCart();
  const router = useRouter();
  const [mode, setMode] = useState<'pickup' | 'delivery'>('pickup');
  const defaultAddress = addresses.find(address => address.isDefault);
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? '');
  const [addressText, setAddressText] = useState(defaultAddress?.address ?? '');
  const [resolvedAddress, setResolvedAddress] = useState<{ zoneId: string; zoneLabel: string } | null>(null);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [slotDate, setSlotDate] = useState(brusselsToday);
  const [bookableDates, setBookableDates] = useState<string[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotValue, setSlotValue] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');
  const [preview, setPreview] = useState<CatalogCartPreview | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const pending = useRef(false);
  const requestKey = useRef<{ signature: string; key: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setPreview(null); setChecking(true);
    if (!cart.ready || !cart.items.length) { setChecking(false); return () => controller.abort(); }
    if (mode === 'delivery' && !resolvedAddress) { setChecking(false); setError(''); return () => controller.abort(); }
    fetch('/api/cart/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart.items, mode, ...(mode === 'delivery' && resolvedAddress ? { zoneId: resolvedAddress.zoneId } : {}), ...(appliedPromoCode ? { promoCode: appliedPromoCode } : {}) }), signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json() as Promise<CatalogCartPreview>; })
      .then(result => { setPreview(result); setError(''); })
      .catch(error => { if (error.name !== 'AbortError') setError(en ? 'Could not verify this cart. Check the options in your cart and try again.' : 'Impossible de vérifier ce panier. Vérifiez les options depuis le panier puis réessayez.'); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [cart.items, cart.ready, mode, resolvedAddress?.zoneId, appliedPromoCode, retry, en]);

  useEffect(() => {
    if (!preview) return;
    const controller = new AbortController();
    setLoadingSlots(true); setSlotError(''); setSlots([]); setSlotValue('');
    const params = new URLSearchParams({ date: slotDate, mode, pizzaCount: String(preview.pizzaCount) });
    fetch(`/api/customer/delivery-slots?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error(en ? 'Could not load time slots.' : 'Impossible de charger les créneaux.'); return response.json() as Promise<{ dates?: string[]; slots?: Slot[] }>; })
      .then(result => { setBookableDates(Array.isArray(result.dates) ? result.dates : []); setSlots(Array.isArray(result.slots) ? result.slots : []); })
      .catch(error => { if (error.name !== 'AbortError') setSlotError(error.message || (en ? 'Could not load time slots.' : 'Impossible de charger les créneaux.')); })
      .finally(() => { if (!controller.signal.aborted) setLoadingSlots(false); });
    return () => controller.abort();
  }, [preview?.pizzaCount, slotDate, mode, retry, en]);

  async function resolveAddress() {
    setResolvingAddress(true); setResolvedAddress(null); setError('');
    try {
      const response = await fetch('/api/customer/delivery-address', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addressText }) });
      const result = await response.json() as { zoneId?: string; zoneLabel?: string; error?: string };
      if (!response.ok || !result.zoneId || !result.zoneLabel) throw new Error(en ? (result.error === 'ADDRESS_OUTSIDE_DELIVERY' ? 'This address appears to be outside the delivery area.' : result.error === 'ZONES_NOT_CONFIGURED' ? 'The restaurant still needs to configure delivery areas.' : 'Delivery address not found. Check the street and postcode.') : (result.error === 'ADDRESS_OUTSIDE_DELIVERY' ? 'Cette adresse semble hors des zones de livraison.' : result.error === 'ZONES_NOT_CONFIGURED' ? 'Les zones de livraison doivent encore être dessinées par le restaurant.' : 'Adresse introuvable pour la livraison. Vérifiez la rue et le code postal.'));
      setResolvedAddress({ zoneId: result.zoneId, zoneLabel: result.zoneLabel });
    } catch (error) { setError(error instanceof Error ? error.message : (en ? 'Could not check the address. Please try again.' : 'Impossible de vérifier l’adresse. Réessayez.')); }
    finally { setResolvingAddress(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !preview || checking) return;
    const fields = new FormData(event.currentTarget);
    const submitted = cart.items;
    const data = { items: submitted, mode, scheduledFor: slotValue, ...(mode === 'delivery' ? { zoneId: resolvedAddress?.zoneId, address: fields.get('address') } : {}), ...(appliedPromoCode ? { promoCode: appliedPromoCode } : {}), contactName: fields.get('contactName'), phone: fields.get('phone'), comment: fields.get('comment'), expectedTotalCents: preview.totalCents ?? preview.subtotalCents };
    const signature = JSON.stringify(data);
    if (requestKey.current?.signature !== signature) requestKey.current = { signature, key: crypto.randomUUID() };
    pending.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/test-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, requestKey: requestKey.current.key }) });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        setError(en ? (result.error === 'PRICE_CHANGED' ? 'The price changed. Refresh and review the summary before confirming again.' : result.error === 'PROMO_CODE_INVALID' ? 'This promo code is not valid for this cart.' : response.status === 401 ? 'Your session expired. Sign in again from your customer account.' : response.status === 422 ? 'The address may be outside the configured delivery area.' : 'Order could not be saved. Check your contact details, options and order minimum.') : (result.error === 'PRICE_CHANGED' ? 'Le prix a changé. Actualisez le récapitulatif et vérifiez-le avant de confirmer à nouveau.' : result.error === 'PROMO_CODE_INVALID' ? 'Ce code promo n’est pas valide pour ce panier.' : response.status === 401 ? 'La session a expiré. Reconnectez-vous depuis votre espace client.' : response.status === 422 ? 'L’adresse ne semble pas être dans les zones de livraison configurées.' : 'Enregistrement refusé. Vérifiez les coordonnées, les options et le minimum de plats.'));
        return;
      }
      const result = await response.json() as { id: string };
      cart.setItems(current => consumeCatalogCartItems(current, submitted));
      router.push(`/compte/commandes/${result.id}`);
    } catch { setError(en ? 'Connection interrupted. You can retry without creating the same test twice.' : 'Connexion interrompue. Vous pouvez réessayer sans créer deux fois le même test.'); }
    finally { pending.current = false; setBusy(false); }
  }

  if (!cart.ready) return <p role="status">{en ? 'Loading cart…' : 'Chargement du panier…'}</p>;
  if (!cart.items.length) return <p>{en ? 'Your cart is empty. Choose a menu item before creating a test order.' : 'Le panier est vide. Choisissez un article sur la carte avant de créer un test.'}</p>;
  return <form method="post" onSubmit={submit}><fieldset disabled={busy}><legend>{en ? 'Test order' : 'Votre essai'}</legend>
    <label htmlFor="test-order-mode">{en ? 'Order method' : 'Mode'}</label><select id="test-order-mode" value={mode} onChange={event => setMode(event.target.value as 'pickup' | 'delivery')}><option value="pickup">{en ? 'Collection' : 'Retrait sur place'}</option><option value="delivery">{en ? 'Simulated delivery' : 'Livraison simulée'}</option></select>
    <label htmlFor="test-order-date">{en ? 'Preferred day' : 'Jour souhaité'}</label><select id="test-order-date" value={slotDate} onChange={event => setSlotDate(event.target.value)}>{(bookableDates.length ? bookableDates : [slotDate]).map(date => <option key={date} value={date}>{new Date(`${date}T12:00:00Z`).toLocaleDateString(en ? 'en-BE' : 'fr-BE', { timeZone: 'Europe/Brussels', weekday: 'long', day: 'numeric', month: 'long' })}</option>)}</select>
    <label htmlFor="test-order-slot">{en ? '15-minute time slot' : 'Créneau de 15 minutes'}</label><select id="test-order-slot" value={slotValue} onChange={event => setSlotValue(event.target.value)} disabled={loadingSlots || !slots.length}><option value="">{loadingSlots ? (en ? 'Finding time slots…' : 'Recherche des créneaux…') : slots.length ? (en ? 'Choose a time slot' : 'Choisir un créneau') : (en ? 'No slots available that day' : 'Aucun créneau disponible ce jour')}</option>{slots.map(slot => <option key={slot.value} value={slot.value}>{slot.time}{preview?.pizzaCount ? ` · ${slot.remainingPizzas} ${en ? 'pizza slot(s) left' : 'place(s) pizza restante(s)'}` : ''}</option>)}</select>
    {slotError && <p role="alert">{slotError}</p>}
    {mode === 'delivery' && <>
      <label htmlFor="test-order-saved-address">{en ? 'Delivery address' : 'Adresse de livraison'}</label><select id="test-order-saved-address" value={selectedAddressId} onChange={event => {
        const address = addresses.find(address => address.id === event.target.value);
        setSelectedAddressId(address?.id ?? ''); setAddressText(address?.address ?? ''); setResolvedAddress(null);
      }}><option value="">{en ? 'Enter another address' : 'Saisir une autre adresse'}</option>{addresses.map(address => <option key={address.id} value={address.id}>{address.label}{address.isDefault ? (en ? ' (default)' : ' (par défaut)') : ''}</option>)}</select>
      <Link href="/compte#address-book-title">{en ? 'Manage my addresses' : 'Gérer mes adresses'}</Link>
      <label>{en ? 'Sample address' : 'Adresse fictive'}<input name="address" required maxLength={300} autoComplete="street-address" value={addressText} onChange={event => { setAddressText(event.target.value); setSelectedAddressId(''); setResolvedAddress(null); }} /></label>
      <button type="button" onClick={resolveAddress} disabled={resolvingAddress || addressText.trim().length < 5}>{resolvingAddress ? (en ? 'Checking address…' : 'Recherche de l’adresse…') : (en ? 'Check address' : 'Vérifier l’adresse')}</button>
      {resolvedAddress && <p role="status">{en ? 'Area detected' : 'Zone détectée'} : {en ? englishMenuTerm(resolvedAddress.zoneLabel) : resolvedAddress.zoneLabel}</p>}
      <p>{en ? 'The full address will be saved with this test order for the driver. Changes here apply only to this test.' : 'L’adresse complète saisie sera conservée sur l’essai pour le livreur. Une modification ici vaut uniquement pour cet essai.'}</p>
    </>}
    <label>{en ? 'Name' : 'Nom'}<input name="contactName" required maxLength={128} defaultValue={name} autoComplete="name" /></label>
    <label>{en ? 'Sample phone number' : 'Téléphone fictif'}<input name="phone" type="tel" required minLength={7} maxLength={30} defaultValue={phone} autoComplete="off" placeholder={en ? 'e.g. 081 00 00 00' : 'Ex. 081 00 00 00'} /></label>
    <label>{en ? 'Comment' : 'Commentaire'}<textarea name="comment" maxLength={500} rows={3} /></label>
    <label htmlFor="test-promo-code">{en ? 'Promo code' : 'Code promo'}<input id="test-promo-code" maxLength={32} value={promoInput} onChange={event => setPromoInput(event.target.value.toUpperCase())} placeholder={en ? 'Enter a code' : 'Saisir un code'} /></label>
    <button type="button" onClick={() => { setError(''); setAppliedPromoCode(promoInput.trim()); }}>{en ? 'Apply code' : 'Appliquer le code'}</button>{appliedPromoCode && <button type="button" onClick={() => { setPromoInput(''); setAppliedPromoCode(''); setError(''); }}>{en ? 'Remove code' : 'Retirer le code'}</button>}
    <h2>{en ? 'Order summary' : 'Récapitulatif'}</h2>{checking ? <p role="status">{en ? 'Checking price…' : 'Vérification du prix…'}</p> : preview && <><TestOrderSummary items={preview.items} subtotalCents={preview.subtotalCents} loyaltyDiscountCents={preview.loyaltyDiscountCents} discountCents={preview.discountCents} promotionName={preview.promotion?.name} promotionCode={preview.promotion?.code} totalCents={preview.totalCents ?? preview.subtotalCents} locale={locale} />
      {preview.codeError && <p role="alert">{en ? (preview.codeError === 'CODE_INVALIDE' ? 'Promo code not found.' : preview.codeError === 'CODE_EPUISE' ? 'This code has reached its usage limit.' : preview.codeError === 'CODE_PAS_ENCORE_VALIDE' ? 'This code is not valid yet.' : preview.codeError === 'CODE_EXPIRE' ? 'This promo code has expired.' : preview.codeError === 'CODE_HORS_HORAIRE' ? 'This code is not valid at this time or on this day.' : preview.codeError === 'MONTANT_MINIMUM_NON_ATTEINT' ? 'The minimum cart amount for this code has not been reached.' : 'This promo code is inactive.') : (preview.codeError === 'CODE_INVALIDE' ? 'Code promo introuvable.' : preview.codeError === 'CODE_EPUISE' ? 'Ce code a atteint sa limite d’utilisations.' : preview.codeError === 'CODE_PAS_ENCORE_VALIDE' ? 'Ce code n’est pas encore valable.' : preview.codeError === 'CODE_EXPIRE' ? 'Ce code promo a expiré.' : preview.codeError === 'CODE_HORS_HORAIRE' ? 'Ce code n’est pas valable à cette heure ou ce jour.' : preview.codeError === 'MONTANT_MINIMUM_NON_ATTEINT' ? 'Le panier minimum pour ce code n’est pas atteint.' : 'Ce code promo n’est pas actif.')}</p>}
      {preview.codeNotSelected && <p role="status">{en ? 'A better automatic promotion was applied instead of this code.' : 'Une promotion automatique plus avantageuse a été appliquée à la place du code saisi.'}</p>}
      {!preview.fulfillment.eligible && <p role="alert">{en ? 'Delivery minimum not reached' : 'Minimum de livraison non atteint'} : {preview.fulfillment.dishCount} {en ? 'dish(es), minimum' : 'plat(s), minimum'} {preview.fulfillment.minimum}.</p>}</>}
    <button type="button" onClick={() => setRetry(current => current + 1)}>{en ? 'Refresh summary' : 'Actualiser le récapitulatif'}</button>
    <button type="submit" disabled={checking || loadingSlots || !slotValue || !preview?.fulfillment.eligible || !!preview?.codeError || (mode === 'delivery' && !resolvedAddress)}>{busy ? (en ? 'Saving…' : 'Enregistrement…') : (en ? 'Confirm test order' : 'Confirmer la commande de test')}</button>
  </fieldset>{error && <p role="alert">{error}</p>}</form>;
}
