'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DELIVERY_ZONES } from '../../lib/fulfillment.mjs';
import { MAX_CUSTOMER_ADDRESSES, type SavedCustomerAddress } from '../../lib/customer-address.mjs';
export default function AddressBook({ initialAddresses }: { initialAddresses: SavedCustomerAddress[] }) {
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
        setError(response.status === 401 ? 'La session a expiré. Reconnectez-vous.' : result.error === 'ADDRESS_CONFLICT' || result.error === 'ADDRESS_NOT_FOUND' ? 'Cette adresse a changé dans un autre onglet. Actualisez la liste avant de réessayer.' : result.error === 'ADDRESS_LIMIT' ? 'Vous pouvez enregistrer dix adresses au maximum.' : 'Impossible d’enregistrer ce changement. Vérifiez les champs et réessayez.');
        return;
      }
      setAddresses(result.addresses); setEditing(null); setDeleting(null);
      setMessage(method === 'DELETE' ? 'Adresse supprimée.' : 'Carnet d’adresses enregistré.');
      router.refresh();
    } catch { setError('Connexion interrompue. Actualisez la liste pour vérifier le résultat avant de réessayer.'); }
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
    } catch { setError('Impossible d’actualiser la liste. Reconnectez-vous si nécessaire.'); }
    finally { pending.current = false; setBusy(false); }
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void mutate(editing ? 'PATCH' : 'POST', { label: fields.get('label'), address: fields.get('address'), zoneId: fields.get('zoneId'), isDefault: editing?.isDefault === true || fields.get('isDefault') === 'on', ...(editing ? { revision: editing.revision } : {}) }, editing?.id);
  }
  return <section aria-labelledby="address-book-title" className="customer-settings"><h2 id="address-book-title">Mes adresses</h2>
    <p>Jusqu’à dix adresses fictives. La zone choisie ne vérifie pas la couverture de livraison.</p>
    <fieldset disabled={busy || !ready}><legend>Adresses enregistrées</legend>
      {!addresses.length ? <p>Aucune adresse enregistrée.</p> : <ul>{addresses.map(address => <li key={address.id}>
        <strong>{address.label}</strong>{address.isDefault && <span> · Par défaut</span>}<p>{address.address} · {DELIVERY_ZONES.find(zone => zone.id === address.zoneId)?.label ?? address.zoneId}</p>
        <div className="customer-actions"><button type="button" onClick={() => { setEditing(address); setDeleting(null); setMessage(''); setError(''); }} aria-label={`Modifier ${address.label}`}>Modifier</button>
          {!address.isDefault && <button type="button" onClick={() => void mutate('PATCH', { label: address.label, address: address.address, zoneId: address.zoneId, revision: address.revision, isDefault: true }, address.id)} aria-label={`Définir ${address.label} par défaut`}>Définir par défaut</button>}
          <button type="button" onClick={() => setDeleting(address.id)} aria-label={`Supprimer ${address.label}`}>Supprimer</button>
        </div>{deleting === address.id && <div><p>Supprimer l’adresse « {address.label} » ? Les anciens essais sont conservés.</p><button type="button" onClick={() => void mutate('DELETE', { revision: address.revision }, address.id)}>Confirmer la suppression</button><button type="button" onClick={() => setDeleting(null)}>Conserver l’adresse</button></div>}
      </li>)}</ul>}
      <button type="button" onClick={() => void refresh()}>Actualiser les adresses</button>
    </fieldset>
    <form method="post" onSubmit={submit} key={`${editing?.id ?? 'new'}-${editing?.revision ?? 0}-${addresses.map(address => `${address.id}:${address.revision}`).join(',')}`}><fieldset disabled={busy || !ready || (!editing && addresses.length >= MAX_CUSTOMER_ADDRESSES)}><legend>{editing ? 'Modifier une adresse' : 'Ajouter une adresse'}</legend>
      <label>Nom de l’adresse<input name="label" required maxLength={60} defaultValue={editing?.label ?? ''} placeholder="Domicile, travail…" /></label>
      <label>Adresse enregistrée fictive<input name="address" required maxLength={300} autoComplete="off" defaultValue={editing?.address ?? ''} placeholder="Rue, numéro, code postal et ville" /></label>
      <label>Zone de l’adresse<select name="zoneId" defaultValue={editing?.zoneId ?? DELIVERY_ZONES[0].id}>{DELIVERY_ZONES.map(zone => <option key={zone.id} value={zone.id}>{zone.label}</option>)}</select></label>
      <label><input name="isDefault" type="checkbox" defaultChecked={editing?.isDefault ?? addresses.length === 0} disabled={editing?.isDefault === true || addresses.length === 0} />Utiliser par défaut</label>
      <button type="submit">{busy ? 'Enregistrement…' : editing ? 'Enregistrer l’adresse' : 'Ajouter l’adresse'}</button>
    </fieldset>{editing && <button type="button" disabled={busy} onClick={() => setEditing(null)}>Annuler la modification</button>}</form>
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}
