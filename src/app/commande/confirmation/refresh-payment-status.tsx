'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshPaymentStatus() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [stopped, setStopped] = useState(false);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => {
    let checks = 0;
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      checks += 1;
      if (checks >= 15) {
        window.clearInterval(interval);
        setStopped(true);
        return;
      }
      if (!pendingRef.current) {
        pendingRef.current = true;
        startTransition(() => router.refresh());
      }
    }, 3_000);
    return () => window.clearInterval(interval);
  }, [router]);

  return <section aria-live="polite">
    <p>{stopped ? 'La confirmation prend plus de temps que prévu.' : 'Vérification automatique de la confirmation du paiement…'}</p>
    {stopped && <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>Vérifier à nouveau</button>}
  </section>;
}
