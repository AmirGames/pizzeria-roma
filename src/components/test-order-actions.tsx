'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEST_STATUS_LABELS } from '../lib/test-order-policy.mjs';
export default function TestOrderActions({ id, revision, statuses, customer = false }: { id: string; revision: number; statuses: string[]; customer?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function update(status: string) {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/test-orders/${id}${customer ? '' : '/status'}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision, ...(customer ? {} : { status }) }) });
      if (!response.ok) { setError('Le statut a changé ou l’accès est refusé. Actualisez avant de réessayer.'); return; }
      router.refresh();
    } catch { setError('Modification impossible. Réessayez.'); }
    finally { setBusy(false); }
  }
  return <div className="customer-actions">{statuses.map(status => <button type="button" key={status} disabled={busy} onClick={() => update(status)}>{customer ? 'Annuler ce test' : TEST_STATUS_LABELS[status]}</button>)}<button type="button" onClick={() => router.refresh()}>Actualiser le suivi</button>{error && <p role="alert">{error}</p>}</div>;
}
