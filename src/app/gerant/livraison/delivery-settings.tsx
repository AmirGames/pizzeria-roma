'use client';

import { useEffect, useMemo, useState } from 'react';
import { DELIVERY_ZONES } from '../../../lib/fulfillment.mjs';
import ZoneMap from './zone-map';

type Position = [number, number];
type Polygon = { type: 'Polygon'; coordinates: Position[][] };
type StoredZone = { zoneId: string; geometry: Polygon; revision: number };
type Config = { leadTimeMinutes: number; slotPizzaCapacity: number; revision: number };

export default function DeliverySettings({ initialConfig, initialZones }: { initialConfig: Config; initialZones: StoredZone[] }) {
  const [config, setConfig] = useState(initialConfig);
  const [leadTime, setLeadTime] = useState(initialConfig.leadTimeMinutes);
  const [capacity, setCapacity] = useState(initialConfig.slotPizzaCapacity);
  const [zones, setZones] = useState(initialZones);
  const [zoneId, setZoneId] = useState(DELIVERY_ZONES[0].id);
  const [draft, setDraft] = useState<Position[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const selected = useMemo(() => zones.find(zone => zone.zoneId === zoneId) ?? null, [zones, zoneId]);

  useEffect(() => { setDraft([]); setDrawing(false); }, [zoneId]);

  async function saveConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/manager/delivery', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadTimeMinutes: leadTime, slotPizzaCapacity: capacity, revision: config.revision }) });
      if (response.status === 409) throw new Error('Un autre changement a été enregistré. Actualisez la page et réessayez.');
      if (!response.ok) throw new Error('Impossible d’enregistrer les réglages.');
      const result = await response.json() as { config: Config };
      setConfig(result.config); setMessage('Réglages enregistrés.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erreur de connexion.'); }
    finally { setBusy(false); }
  }

  async function saveZone() {
    if (draft.length < 3) { setMessage('Ajoutez au moins trois points sur la carte.'); return; }
    const coordinates = [...draft, draft[0]];
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/manager/delivery/zones', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zoneId, geometry: { type: 'Polygon', coordinates: [coordinates] }, revision: selected?.revision ?? 0 }) });
      if (response.status === 409) throw new Error('Cette zone a changé depuis son chargement. Actualisez la page.');
      if (!response.ok) throw new Error('Impossible d’enregistrer cette zone.');
      const result = await response.json() as { zone: StoredZone };
      setZones(current => [...current.filter(item => item.zoneId !== zoneId), result.zone]); setDraft([]); setDrawing(false); setMessage('Zone enregistrée.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erreur de connexion.'); }
    finally { setBusy(false); }
  }

  return <div className="delivery-settings">
    <section aria-labelledby="delivery-rules-title"><h2 id="delivery-rules-title">Délais et capacité</h2>
      <form onSubmit={saveConfig} className="delivery-settings-form">
        <label>Délai minimum avant le créneau (minutes)<input type="number" min={15} max={240} step={15} value={leadTime} onChange={event => setLeadTime(Number(event.target.value))} required /></label>
        <label>Capacité pizzas par créneau de 15 minutes<input type="number" min={1} max={70} step={1} value={capacity} onChange={event => setCapacity(Number(event.target.value))} required /></label>
        <p>Valeurs initiales : 30 minutes de délai minimum pour le retrait et la livraison, et 7 pizzas par créneau. Les précommandes seront proposées jusqu’à 7 jours à l’avance pendant les horaires d’ouverture.</p>
        <button type="submit" disabled={busy}>Enregistrer les réglages</button>
      </form>
    </section>
    <section aria-labelledby="delivery-zones-title"><h2 id="delivery-zones-title">Zones de livraison</h2>
      <p>Sélectionnez une zone, cliquez sur la carte pour poser ses limites, puis enregistrez. Les zones ne sont pas actives tant qu’elles ne sont pas dessinées.</p>
      <label>Zone à dessiner<select value={zoneId} onChange={event => setZoneId(event.target.value)}>{DELIVERY_ZONES.map(zone => <option key={zone.id} value={zone.id}>{zone.label}{zones.some(item => item.zoneId === zone.id) ? ' — configurée' : ' — à dessiner'}</option>)}</select></label>
      <ZoneMap geometry={selected?.geometry ?? null} draft={draft} drawing={drawing} onDraftPoint={point => setDraft(current => [...current, point])} />
      <div className="customer-actions">
        <button type="button" onClick={() => { setDraft([]); setDrawing(true); setMessage('Cliquez sur la carte pour dessiner le contour.'); }}>Dessiner / redessiner</button>
        <button type="button" onClick={() => setDraft(current => current.slice(0, -1))} disabled={!draft.length}>Annuler le dernier point</button>
        <button type="button" onClick={saveZone} disabled={busy || draft.length < 3}>Enregistrer cette zone</button>
      </div>
      <ul>{DELIVERY_ZONES.map(zone => <li key={zone.id}>{zone.label} : {zones.some(item => item.zoneId === zone.id) ? 'configurée' : 'non configurée'}</li>)}</ul>
    </section>
    {message && <p role="status" aria-live="polite">{message}</p>}
  </div>;
}
