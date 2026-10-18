'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEST_STATUS_LABELS } from '../lib/test-order-policy.mjs';
import type { SiteLocale } from '../lib/locale';
export default function TestOrderActions({ id, revision, statuses, customer = false, locale = 'fr' }: { id: string; revision: number; statuses: string[]; customer?: boolean; locale?: SiteLocale }) {
  const en = locale === 'en';
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function update(status: string) {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/test-orders/${id}${customer ? '' : '/status'}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision, ...(customer ? {} : { status }) }) });
      if (!response.ok) { setError(en ? 'The status changed or access was denied. Refresh before trying again.' : 'Le statut a changé ou l’accès est refusé. Actualisez avant de réessayer.'); return; }
      router.refresh();
    } catch { setError(en ? 'Could not make this change. Please try again.' : 'Modification impossible. Réessayez.'); }
    finally { setBusy(false); }
  }
  return <div className="customer-actions">{statuses.map(status => <button type="button" key={status} disabled={busy} onClick={() => update(status)}>{customer ? (en ? 'Cancel this test order' : 'Annuler ce test') : TEST_STATUS_LABELS[status]}</button>)}<button type="button" onClick={() => router.refresh()}>{en ? 'Refresh status' : 'Actualiser le suivi'}</button>{error && <p role="alert">{error}</p>}</div>;
}
