'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DELIVERY_ZONES } from '../../../lib/fulfillment.mjs';
import { useCatalogCart } from '../../../lib/use-catalog-cart';
import { consumeCatalogCartItems } from '../../../lib/catalog-cart.mjs';
import type { CatalogCartPreview } from '../../../lib/catalog-cart-preview.mjs';
import TestOrderSummary from '../../../components/test-order-summary';

export default function TestCheckout({ name, phone }: { name: string; phone: string }) {
  const cart = useCatalogCart();
  const router = useRouter();
  const [mode, setMode] = useState<'pickup' | 'delivery'>('pickup');
  const [zoneId, setZoneId] = useState(DELIVERY_ZONES[0].id);
  const [preview, setPreview] = useState<CatalogCartPreview | null>(null);
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
    fetch('/api/cart/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart.items, mode, ...(mode === 'delivery' ? { zoneId } : {}) }), signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json() as Promise<CatalogCartPreview>; })
      .then(result => { setPreview(result); setError(''); })
      .catch(error => { if (error.name !== 'AbortError') setError('Impossible de vérifier ce panier. Vérifiez les options depuis le panier puis réessayez.'); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [cart.items, cart.ready, mode, zoneId, retry]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !preview || checking) return;
    const fields = new FormData(event.currentTarget);
    const submitted = cart.items;
    const data = { items: submitted, mode, ...(mode === 'delivery' ? { zoneId, address: fields.get('address') } : {}), contactName: fields.get('contactName'), phone: fields.get('phone'), comment: fields.get('comment'), expectedTotalCents: preview.subtotalCents };
    const signature = JSON.stringify(data);
    if (requestKey.current?.signature !== signature) requestKey.current = { signature, key: crypto.randomUUID() };
    pending.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/test-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, requestKey: requestKey.current.key }) });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        setError(result.error === 'PRICE_CHANGED' ? 'Le prix a changé. Actualisez le récapitulatif et vérifiez-le avant de confirmer à nouveau.' : response.status === 401 ? 'La session a expiré. Reconnectez-vous depuis votre espace client.' : 'Enregistrement refusé. Vérifiez les coordonnées, les options et le minimum de plats.');
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
  return <form onSubmit={submit}><fieldset disabled={busy}><legend>Votre essai</legend>
    <label>Mode<select value={mode} onChange={event => setMode(event.target.value as 'pickup' | 'delivery')}><option value="pickup">Retrait sur place</option><option value="delivery">Livraison simulée</option></select></label>
    {mode === 'delivery' && <><label>Zone<select value={zoneId} onChange={event => setZoneId(event.target.value)}>{DELIVERY_ZONES.map(zone => <option key={zone.id} value={zone.id}>{zone.label}</option>)}</select></label><label>Adresse fictive<input name="address" required maxLength={300} autoComplete="off" /></label><p>L’adresse n’est pas vérifiée et aucun service de livraison n’est réservé.</p></>}
    <label>Nom<input name="contactName" required maxLength={128} defaultValue={name} autoComplete="name" /></label>
    <label>Téléphone fictif<input name="phone" type="tel" required minLength={7} maxLength={30} defaultValue={phone} autoComplete="off" placeholder="Ex. 081 00 00 00" /></label>
    <label>Commentaire<textarea name="comment" maxLength={500} rows={3} /></label>
    <h2>Récapitulatif</h2>{checking ? <p role="status">Vérification du prix…</p> : preview && <><TestOrderSummary items={preview.items} totalCents={preview.subtotalCents} />{!preview.fulfillment.eligible && <p role="alert">Minimum de livraison non atteint : {preview.fulfillment.dishCount} plat(s), minimum {preview.fulfillment.minimum}.</p>}</>}
    <button type="button" onClick={() => setRetry(current => current + 1)}>Actualiser le récapitulatif</button>
    <button type="submit" disabled={checking || !preview?.fulfillment.eligible}>{busy ? 'Enregistrement…' : 'Confirmer la commande de test'}</button>
  </fieldset>{error && <p role="alert">{error}</p>}</form>;
}
