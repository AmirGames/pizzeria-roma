'use client';

import { useState } from 'react';
import type { Promotion, PromotionDiscountType, PromotionKind } from '@prisma/client';

type Draft = { name: string; kind: PromotionKind; code: string; discountType: PromotionDiscountType; value: string; minimum: string; validFrom: string; validUntil: string; weekdays: number[]; startTime: string; endTime: string; usageLimit: string; active: boolean };
const WEEKDAYS = [{ value: 1, label: 'Lun' }, { value: 2, label: 'Mar' }, { value: 3, label: 'Mer' }, { value: 4, label: 'Jeu' }, { value: 5, label: 'Ven' }, { value: 6, label: 'Sam' }, { value: 7, label: 'Dim' }];
const emptyDraft = (): Draft => ({ name: '', kind: 'AUTOMATIC', code: '', discountType: 'PERCENT', value: '10', minimum: '0', validFrom: '', validUntil: '', weekdays: [1, 2, 3, 4, 5, 6, 7], startTime: '', endTime: '', usageLimit: '', active: false });
const dateInput = (value: Date | null) => value ? new Date(value).toISOString().slice(0, 10) : '';
const euroString = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

function draftFor(promo: Promotion): Draft {
  return { name: promo.name, kind: promo.kind, code: promo.code ?? '', discountType: promo.discountType, value: promo.discountType === 'FIXED' ? euroString(promo.value) : String(promo.value), minimum: euroString(promo.minimumSubtotalCents), validFrom: dateInput(promo.validFrom), validUntil: dateInput(promo.validUntil), weekdays: promo.weekdays, startTime: promo.startTime ?? '', endTime: promo.endTime ?? '', usageLimit: promo.usageLimit == null ? '' : String(promo.usageLimit), active: promo.active };
}

function cents(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error('Saisissez un montant en euros avec deux décimales maximum.');
  const amount = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(amount)) throw new Error('Montant invalide.');
  return amount;
}

function toPayload(draft: Draft, revision?: number) {
  const value = draft.discountType === 'FIXED' ? cents(draft.value) : Number(draft.value);
  if (!Number.isSafeInteger(value) || value < 1 || (draft.discountType === 'PERCENT' && value > 100)) throw new Error('La valeur de la remise est invalide.');
  return { name: draft.name.trim(), kind: draft.kind, code: draft.kind === 'CODE' ? draft.code.trim().toUpperCase() : null, discountType: draft.discountType, value,
    minimumSubtotalCents: cents(draft.minimum), validFrom: draft.validFrom || null, validUntil: draft.validUntil || null, weekdays: draft.weekdays, startTime: draft.startTime, endTime: draft.endTime,
    usageLimit: draft.usageLimit ? Number(draft.usageLimit) : null, active: draft.active, ...(revision === undefined ? {} : { revision }) };
}

function PromotionForm({ initial, revision, submitLabel, onSave }: { initial: Draft; revision?: number; submitLabel: string; onSave: (payload: ReturnType<typeof toPayload>) => Promise<void> }) {
  const [draft, setDraft] = useState(initial);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (values: Partial<Draft>) => setDraft(current => ({ ...current, ...values }));
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage('');
    try { await onSave(toPayload(draft, revision)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Enregistrement impossible.'); }
    finally { setSaving(false); }
  }
  return <form className="manager-promotion-form" onSubmit={submit}><fieldset disabled={saving}>
    <label>Nom interne<input required maxLength={100} value={draft.name} onChange={event => update({ name: event.target.value })} placeholder="Ex. Offre de lancement" /></label>
    <div className="manager-promo-grid">
      <label>Type d’offre<select value={draft.kind} onChange={event => update({ kind: event.target.value as PromotionKind })}><option value="AUTOMATIC">Promotion automatique</option><option value="CODE">Code promo</option></select></label>
      {draft.kind === 'CODE' && <label>Code à saisir<input required maxLength={32} pattern="[A-Za-z0-9-]{3,32}" value={draft.code} onChange={event => update({ code: event.target.value.toUpperCase() })} placeholder="ROMA10" /></label>}
      <label>Remise<select value={draft.discountType} onChange={event => update({ discountType: event.target.value as PromotionDiscountType, value: event.target.value === 'FIXED' ? '5,00' : '10' })}><option value="PERCENT">Pourcentage</option><option value="FIXED">Montant fixe (€)</option></select></label>
      <label>{draft.discountType === 'PERCENT' ? 'Pourcentage (%)' : 'Montant (€)'}<input required inputMode="decimal" value={draft.value} onChange={event => update({ value: event.target.value })} /></label>
      <label>Panier minimum (€)<input required inputMode="decimal" value={draft.minimum} onChange={event => update({ minimum: event.target.value })} /></label>
      <label>Valide à partir du<input type="date" value={draft.validFrom} onChange={event => update({ validFrom: event.target.value })} /></label>
      <label>Valide jusqu’au<input type="date" value={draft.validUntil} onChange={event => update({ validUntil: event.target.value })} /></label>
      <label>Heure de début<input type="time" value={draft.startTime} onChange={event => update({ startTime: event.target.value })} /></label>
      <label>Heure de fin (exclue)<input type="time" value={draft.endTime} onChange={event => update({ endTime: event.target.value })} /></label>
      <label>Nombre maximum d’utilisations<input type="number" min="1" max="1000000" value={draft.usageLimit} onChange={event => update({ usageLimit: event.target.value })} placeholder="Sans limite" /></label>
    </div>
    <fieldset className="manager-weekdays"><legend>Jours applicables</legend><div>{WEEKDAYS.map(day => <label className="manager-check" key={day.value}><input type="checkbox" checked={draft.weekdays.includes(day.value)} onChange={event => update({ weekdays: event.target.checked ? [...draft.weekdays, day.value].sort() : draft.weekdays.filter(value => value !== day.value) })} /> {day.label}</label>)}</div></fieldset>
    <label className="manager-check"><input type="checkbox" checked={draft.active} onChange={event => update({ active: event.target.checked })} /> Activer cette offre</label>
    {message && <p role="alert">{message}</p>}
    <button type="submit">{saving ? 'Enregistrement…' : submitLabel}</button>
  </fieldset></form>;
}

export default function PromotionEditor({ initialPromotions }: { initialPromotions: Promotion[] }) {
  const [promotions, setPromotions] = useState(initialPromotions);
  async function create(payload: ReturnType<typeof toPayload>) {
    const response = await fetch('/api/manager/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json() as { promotion?: Promotion; error?: string };
    if (!response.ok || !result.promotion) throw new Error(result.error === 'PROMOTION_CODE_EXISTS' ? 'Ce code promo existe déjà.' : 'Création refusée. Vérifiez les champs.');
    setPromotions(current => [result.promotion!, ...current.map(item => result.promotion!.kind === 'AUTOMATIC' && result.promotion!.active && item.kind === 'AUTOMATIC' && item.active ? { ...item, active: false, revision: item.revision + 1 } : item)]);
  }
  async function update(id: string, payload: ReturnType<typeof toPayload>) {
    const response = await fetch(`/api/manager/promotions/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json() as { promotion?: Promotion; error?: string };
    if (!response.ok || !result.promotion) throw new Error(response.status === 409 ? result.error === 'PROMOTION_CODE_EXISTS' ? 'Ce code promo existe déjà.' : 'Cette offre a été modifiée ailleurs. Rechargez la page.' : 'Enregistrement refusé. Vérifiez les champs.');
    setPromotions(current => current.map(item => item.id === id ? result.promotion! : result.promotion!.kind === 'AUTOMATIC' && result.promotion!.active && item.kind === 'AUTOMATIC' && item.active ? { ...item, active: false, revision: item.revision + 1 } : item));
  }
  return <div className="manager-promotions">
    <section aria-labelledby="promotion-create-title"><h2 id="promotion-create-title">Créer une offre</h2><PromotionForm initial={emptyDraft()} submitLabel="Créer l’offre" onSave={create} /></section>
    <section aria-labelledby="promotion-list-title"><h2 id="promotion-list-title">Offres existantes</h2>
      {!promotions.length && <p>Aucune promotion créée.</p>}
      {promotions.map(promo => <article className="manager-promotion-card" key={promo.id}>
        <header><div><h3>{promo.name}</h3><p>{promo.kind === 'AUTOMATIC' ? 'Automatique' : `Code · ${promo.code}`} · Utilisée {promo.usageCount}{promo.usageLimit == null ? ' fois' : ` / ${promo.usageLimit} fois`}</p></div><span className={promo.active ? 'manager-promo-active' : 'manager-promo-paused'}>{promo.active ? 'Active' : 'En pause'}</span></header>
        <PromotionForm key={`${promo.id}-${promo.revision}`} initial={draftFor(promo)} revision={promo.revision} submitLabel="Enregistrer" onSave={payload => update(promo.id, payload)} />
      </article>)}
    </section>
  </div>;
}
