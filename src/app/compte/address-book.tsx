'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DELIVERY_ZONES } from '../../lib/fulfillment.mjs';
import { MAX_CUSTOMER_ADDRESSES, type SavedCustomerAddress } from '../../lib/customer-address.mjs';
import type { SiteLocale } from '../../lib/locale';
// @ts-ignore JavaScript module
import { englishMenuTerm } from '../../lib/menu-translation.mjs';
export default function AddressBook({ initialAddresses, realOrdersEnabled = false, locale = 'fr' }: { initialAddresses: SavedCustomerAddress[]; realOrdersEnabled?: boolean; locale?: SiteLocale }) {
  const en = locale === 'en';
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<SavedCustomerAddress | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  useEffect(() => setReady(true), []);
  async function mutate(method: 'POST' | 'PATCH' | 'DELETE', body: object, id?: string) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/customer/addresses${id ? `/${encodeURIComponent(id)}` : ''}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json() as { addresses?: SavedCustomerAddress[]; error?: string };
      if (!response.ok || !result.addresses) {
        setError(en ? (response.status === 401 ? 'Your session expired. Please sign in again.' : result.error === 'ADDRESS_CONFLICT' || result.error === 'ADDRESS_NOT_FOUND' ? 'This address changed in another tab. Refresh the list before trying again.' : result.error === 'ADDRESS_LIMIT' ? 'You can save up to ten addresses.' : 'Could not save this change. Check the fields and try again.') : (response.status === 401 ? 'La session a expiré. Reconnectez-vous.' : result.error === 'ADDRESS_CONFLICT' || result.error === 'ADDRESS_NOT_FOUND' ? 'Cette adresse a changé dans un autre onglet. Actualisez la liste avant de réessayer.' : result.error === 'ADDRESS_LIMIT' ? 'Vous pouvez enregistrer dix adresses au maximum.' : 'Impossible d’enregistrer ce changement. Vérifiez les champs et réessayez.'));
        return;
      }
      setAddresses(result.addresses); setEditing(null); setDeleting(null);
      setMessage(method === 'DELETE' ? (en ? 'Address deleted.' : 'Adresse supprimée.') : (en ? 'Address book saved.' : 'Carnet d’adresses enregistré.'));
      router.refresh();
    } catch { setError(en ? 'Connection interrupted. Refresh the list to check the result before trying again.' : 'Connexion interrompue. Actualisez la liste pour vérifier le résultat avant de réessayer.'); }
    finally { pending.current = false; setBusy(false); }
  }
  async function refresh() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/customer/addresses', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const result = await response.json() as { addresses: SavedCustomerAddress[] };
      setAddresses(result.addresses); setEditing(null); setDeleting(null); router.refresh();
    } catch { setError(en ? 'Could not refresh the list. Sign in again if needed.' : 'Impossible d’actualiser la liste. Reconnectez-vous si nécessaire.'); }
    finally { pending.current = false; setBusy(false); }
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void mutate(editing ? 'PATCH' : 'POST', { label: fields.get('label'), address: fields.get('address'), zoneId: fields.get('zoneId'), isDefault: editing?.isDefault === true || fields.get('isDefault') === 'on', ...(editing ? { revision: editing.revision } : {}) }, editing?.id);
  }
  return <section aria-labelledby="address-book-title" className="customer-settings"><h2 id="address-book-title">{en ? 'My addresses' : 'Mes adresses'}</h2>
    <p>{realOrdersEnabled
      ? en ? 'Save up to ten addresses for future deliveries. The restaurant will verify the address against its delivery areas at checkout.' : 'Enregistrez jusqu’à dix adresses pour vos prochaines livraisons. Le checkout vérifiera l’adresse dans les zones de livraison du restaurant.'
      : en ? 'Up to ten sample addresses. The selected area does not verify delivery coverage.' : 'Jusqu’à dix adresses fictives. La zone choisie ne vérifie pas la couverture de livraison.'}</p>
    <fieldset disabled={busy || !ready}><legend>{en ? 'Saved addresses' : 'Adresses enregistrées'}</legend>
      {!addresses.length ? <p>{en ? 'No saved addresses.' : 'Aucune adresse enregistrée.'}</p> : <ul>{addresses.map(address => <li key={address.id}>
        <strong>{address.label}</strong>{address.isDefault && <span> · {en ? 'Default' : 'Par défaut'}</span>}<p>{address.address} · {en ? englishMenuTerm(DELIVERY_ZONES.find(zone => zone.id === address.zoneId)?.label ?? address.zoneId) : DELIVERY_ZONES.find(zone => zone.id === address.zoneId)?.label ?? address.zoneId}</p>
        <div className="customer-actions"><button type="button" onClick={() => { setEditing(address); setDeleting(null); setMessage(''); setError(''); }} aria-label={`${en ? 'Edit' : 'Modifier'} ${address.label}`}>{en ? 'Edit' : 'Modifier'}</button>
          {!address.isDefault && <button type="button" onClick={() => void mutate('PATCH', { label: address.label, address: address.address, zoneId: address.zoneId, revision: address.revision, isDefault: true }, address.id)} aria-label={`${en ? 'Set' : 'Définir'} ${address.label} ${en ? 'as default' : 'par défaut'}`}>{en ? 'Set as default' : 'Définir par défaut'}</button>}
          <button type="button" onClick={() => setDeleting(address.id)} aria-label={`${en ? 'Delete' : 'Supprimer'} ${address.label}`}>{en ? 'Delete' : 'Supprimer'}</button>
        </div>{deleting === address.id && <div><p>{en ? `Delete address “${address.label}”? Previous test orders will be kept.` : `Supprimer l’adresse « ${address.label} » ? Les anciens essais sont conservés.`}</p><button type="button" onClick={() => void mutate('DELETE', { revision: address.revision }, address.id)}>{en ? 'Confirm deletion' : 'Confirmer la suppression'}</button><button type="button" onClick={() => setDeleting(null)}>{en ? 'Keep address' : 'Conserver l’adresse'}</button></div>}
      </li>)}</ul>}
      <button type="button" onClick={() => void refresh()}>{en ? 'Refresh addresses' : 'Actualiser les adresses'}</button>
    </fieldset>
    <form method="post" onSubmit={submit} key={`${editing?.id ?? 'new'}-${editing?.revision ?? 0}-${addresses.map(address => `${address.id}:${address.revision}`).join(',')}`}><fieldset disabled={busy || !ready || (!editing && addresses.length >= MAX_CUSTOMER_ADDRESSES)}><legend>{editing ? (en ? 'Edit an address' : 'Modifier une adresse') : (en ? 'Add an address' : 'Ajouter une adresse')}</legend>
      <label>{en ? 'Address label' : 'Nom de l’adresse'}<input name="label" required maxLength={60} defaultValue={editing?.label ?? ''} placeholder={en ? 'Home, work…' : 'Domicile, travail…'} /></label>
      <label>{realOrdersEnabled ? (en ? 'Delivery address' : 'Adresse de livraison') : (en ? 'Sample saved address' : 'Adresse enregistrée fictive')}<input name="address" required maxLength={300} autoComplete="off" defaultValue={editing?.address ?? ''} placeholder={en ? 'Street, number, postcode and city' : 'Rue, numéro, code postal et ville'} /></label>
      <label>{en ? 'Address area' : 'Zone de l’adresse'}<select name="zoneId" defaultValue={editing?.zoneId ?? DELIVERY_ZONES[0].id}>{DELIVERY_ZONES.map(zone => <option key={zone.id} value={zone.id}>{en ? englishMenuTerm(zone.label) : zone.label}</option>)}</select></label>
      <label className="customer-address-default"><input name="isDefault" type="checkbox" defaultChecked={editing?.isDefault ?? addresses.length === 0} disabled={editing?.isDefault === true || addresses.length === 0} />{en ? 'Use as default' : 'Utiliser par défaut'}</label>
      <button type="submit">{busy ? (en ? 'Saving…' : 'Enregistrement…') : editing ? (en ? 'Save address' : 'Enregistrer l’adresse') : (en ? 'Add address' : 'Ajouter l’adresse')}</button>
    </fieldset>{editing && <button type="button" disabled={busy} onClick={() => setEditing(null)}>{en ? 'Cancel editing' : 'Annuler la modification'}</button>}</form>
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}
