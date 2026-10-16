'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCatalogCart } from '../../../lib/use-catalog-cart';
import { consumeCatalogCartItems } from '../../../lib/catalog-cart.mjs';
import type { CatalogCartPreview } from '../../../lib/catalog-cart-preview.mjs';
import TestOrderSummary from '../../../components/test-order-summary';
import Link from 'next/link';
import type { SavedCustomerAddress } from '../../../lib/customer-address.mjs';

function brusselsToday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
type Slot = { value: string; time: string; remainingPizzas: number };
const money = (cents: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export default function TestCheckout({ name, phone, addresses }: { name: string; phone: string; addresses: SavedCustomerAddress[] }) {
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
      .catch(error => { if (error.name !== 'AbortError') setError('Impossible de vérifier ce panier. Vérifiez les options depuis le panier puis réessayez.'); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [cart.items, cart.ready, mode, resolvedAddress?.zoneId, appliedPromoCode, retry]);

  useEffect(() => {
    if (!preview) return;
    const controller = new AbortController();
    setLoadingSlots(true); setSlotError(''); setSlots([]); setSlotValue('');
    const params = new URLSearchParams({ date: slotDate, mode, pizzaCount: String(preview.pizzaCount) });
    fetch(`/api/customer/delivery-slots?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error('Impossible de charger les créneaux.'); return response.json() as Promise<{ dates?: string[]; slots?: Slot[] }>; })
      .then(result => { setBookableDates(Array.isArray(result.dates) ? result.dates : []); setSlots(Array.isArray(result.slots) ? result.slots : []); })
      .catch(error => { if (error.name !== 'AbortError') setSlotError(error.message || 'Impossible de charger les créneaux.'); })
      .finally(() => { if (!controller.signal.aborted) setLoadingSlots(false); });
    return () => controller.abort();
  }, [preview?.pizzaCount, slotDate, mode, retry]);

  async function resolveAddress() {
    setResolvingAddress(true); setResolvedAddress(null); setError('');
    try {
      const response = await fetch('/api/customer/delivery-address', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addressText }) });
      const result = await response.json() as { zoneId?: string; zoneLabel?: string; error?: string };
      if (!response.ok || !result.zoneId || !result.zoneLabel) throw new Error(result.error === 'ADDRESS_OUTSIDE_DELIVERY' ? 'Cette adresse semble hors des zones de livraison.' : result.error === 'ZONES_NOT_CONFIGURED' ? 'Les zones de livraison doivent encore être dessinées par le restaurant.' : 'Adresse introuvable pour la livraison. Vérifiez la rue et le code postal.');
      setResolvedAddress({ zoneId: result.zoneId, zoneLabel: result.zoneLabel });
    } catch (error) { setError(error instanceof Error ? error.message : 'Impossible de vérifier l’adresse. Réessayez.'); }
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
        setError(result.error === 'PRICE_CHANGED' ? 'Le prix a changé. Actualisez le récapitulatif et vérifiez-le avant de confirmer à nouveau.' : result.error === 'PROMO_CODE_INVALID' ? 'Ce code promo n’est pas valide pour ce panier.' : response.status === 401 ? 'La session a expiré. Reconnectez-vous depuis votre espace client.' : response.status === 422 ? 'L’adresse ne semble pas être dans les zones de livraison configurées.' : 'Enregistrement refusé. Vérifiez les coordonnées, les options et le minimum de plats.');
        return;
      }
      const result = await response.json() as { id: string };
      cart.setItems(current => consumeCatalogCartItems(current, submitted));
      router.push(`/compte/commandes/${result.id}`);
    } catch { setError('Connexion interrompue. Vous pouvez réessayer sans créer deux fois le même test.'); }
    finally { pending.current = false; setBusy(false); }
  }

  if (!cart.ready) return <p role="status">Chargement du panier…</p>;
  if (!cart.items.length) return <p>Le panier est vide. Choisissez un article sur la carte avant de créer un test.</p>;
  return <form method="post" onSubmit={submit}><fieldset disabled={busy}><legend>Votre essai</legend>
    <label htmlFor="test-order-mode">Mode</label><select id="test-order-mode" value={mode} onChange={event => setMode(event.target.value as 'pickup' | 'delivery')}><option value="pickup">Retrait sur place</option><option value="delivery">Livraison simulée</option></select>
    <label htmlFor="test-order-date">Jour souhaité</label><select id="test-order-date" value={slotDate} onChange={event => setSlotDate(event.target.value)}>{(bookableDates.length ? bookableDates : [slotDate]).map(date => <option key={date} value={date}>{new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-BE', { timeZone: 'Europe/Brussels', weekday: 'long', day: 'numeric', month: 'long' })}</option>)}</select>
    <label htmlFor="test-order-slot">Créneau de 15 minutes</label><select id="test-order-slot" value={slotValue} onChange={event => setSlotValue(event.target.value)} disabled={loadingSlots || !slots.length}><option value="">{loadingSlots ? 'Recherche des créneaux…' : slots.length ? 'Choisir un créneau' : 'Aucun créneau disponible ce jour'}</option>{slots.map(slot => <option key={slot.value} value={slot.value}>{slot.time}{preview?.pizzaCount ? ` · ${slot.remainingPizzas} place(s) pizza restante(s)` : ''}</option>)}</select>
    {slotError && <p role="alert">{slotError}</p>}
    {mode === 'delivery' && <>
      <label htmlFor="test-order-saved-address">Adresse de livraison</label><select id="test-order-saved-address" value={selectedAddressId} onChange={event => {
        const address = addresses.find(address => address.id === event.target.value);
        setSelectedAddressId(address?.id ?? ''); setAddressText(address?.address ?? ''); setResolvedAddress(null);
      }}><option value="">Saisir une autre adresse</option>{addresses.map(address => <option key={address.id} value={address.id}>{address.label}{address.isDefault ? ' (par défaut)' : ''}</option>)}</select>
      <Link href="/compte#address-book-title">Gérer mes adresses</Link>
      <label>Adresse fictive<input name="address" required maxLength={300} autoComplete="street-address" value={addressText} onChange={event => { setAddressText(event.target.value); setSelectedAddressId(''); setResolvedAddress(null); }} /></label>
      <button type="button" onClick={resolveAddress} disabled={resolvingAddress || addressText.trim().length < 5}>{resolvingAddress ? 'Recherche de l’adresse…' : 'Vérifier l’adresse'}</button>
      {resolvedAddress && <p role="status">Zone détectée : {resolvedAddress.zoneLabel}</p>}
      <p>L’adresse complète saisie sera conservée sur l’essai pour le livreur. Une modification ici vaut uniquement pour cet essai.</p>
    </>}
    <label>Nom<input name="contactName" required maxLength={128} defaultValue={name} autoComplete="name" /></label>
    <label>Téléphone fictif<input name="phone" type="tel" required minLength={7} maxLength={30} defaultValue={phone} autoComplete="off" placeholder="Ex. 081 00 00 00" /></label>
    <label>Commentaire<textarea name="comment" maxLength={500} rows={3} /></label>
    <label htmlFor="test-promo-code">Code promo<input id="test-promo-code" maxLength={32} value={promoInput} onChange={event => setPromoInput(event.target.value.toUpperCase())} placeholder="Saisir un code" /></label>
    <button type="button" onClick={() => { setError(''); setAppliedPromoCode(promoInput.trim()); }}>Appliquer le code</button>{appliedPromoCode && <button type="button" onClick={() => { setPromoInput(''); setAppliedPromoCode(''); setError(''); }}>Retirer le code</button>}
    <h2>Récapitulatif</h2>{checking ? <p role="status">Vérification du prix…</p> : preview && <><TestOrderSummary items={preview.items} subtotalCents={preview.subtotalCents} loyaltyDiscountCents={preview.loyaltyDiscountCents} discountCents={preview.discountCents} promotionName={preview.promotion?.name} promotionCode={preview.promotion?.code} totalCents={preview.totalCents ?? preview.subtotalCents} />
      {preview.codeError && <p role="alert">{preview.codeError === 'CODE_INVALIDE' ? 'Code promo introuvable.' : preview.codeError === 'CODE_EPUISE' ? 'Ce code a atteint sa limite d’utilisations.' : preview.codeError === 'CODE_PAS_ENCORE_VALIDE' ? 'Ce code n’est pas encore valable.' : preview.codeError === 'CODE_EXPIRE' ? 'Ce code promo a expiré.' : preview.codeError === 'CODE_HORS_HORAIRE' ? 'Ce code n’est pas valable à cette heure ou ce jour.' : preview.codeError === 'MONTANT_MINIMUM_NON_ATTEINT' ? 'Le panier minimum pour ce code n’est pas atteint.' : 'Ce code promo n’est pas actif.'}</p>}
      {preview.codeNotSelected && <p role="status">Une promotion automatique plus avantageuse a été appliquée à la place du code saisi.</p>}
      {!preview.fulfillment.eligible && <p role="alert">Minimum de livraison non atteint : {preview.fulfillment.dishCount} plat(s), minimum {preview.fulfillment.minimum}.</p>}</>}
    <button type="button" onClick={() => setRetry(current => current + 1)}>Actualiser le récapitulatif</button>
    <button type="submit" disabled={checking || loadingSlots || !slotValue || !preview?.fulfillment.eligible || !!preview?.codeError || (mode === 'delivery' && !resolvedAddress)}>{busy ? 'Enregistrement…' : 'Confirmer la commande de test'}</button>
  </fieldset>{error && <p role="alert">{error}</p>}</form>;
}
