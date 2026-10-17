'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_INTERVAL_MS = 20_000;
const MAX_AUTOMATIC_REFRESHES = 15;

export default function RefreshOrderStatus() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [stopped, setStopped] = useState(false);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => {
    let refreshes = 0;
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (refreshes >= MAX_AUTOMATIC_REFRESHES) {
        window.clearInterval(interval);
        setStopped(true);
        return;
      }
      if (!pendingRef.current) {
        refreshes += 1;
        pendingRef.current = true;
        startTransition(() => router.refresh());
      }
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [router]);

  return <section aria-live="polite">
    <p>{stopped ? 'Le suivi automatique est en pause.' : 'Suivi automatique : actualisation toutes les 20 secondes tant que cette page est ouverte.'}</p>
    {stopped && <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>Actualiser le suivi</button>}
  </section>;
}
