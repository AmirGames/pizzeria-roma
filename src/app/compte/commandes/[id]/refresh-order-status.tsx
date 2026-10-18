'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { SiteLocale } from '../../../../lib/locale';

const REFRESH_INTERVAL_MS = 20_000;
const MAX_AUTOMATIC_REFRESHES = 15;

export default function RefreshOrderStatus({ locale = 'fr' }: { locale?: SiteLocale }) {
  const en = locale === 'en';
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
    <p>{stopped ? (en ? 'Automatic updates are paused.' : 'Le suivi automatique est en pause.') : (en ? 'Automatic updates: every 20 seconds while this page is open.' : 'Suivi automatique : actualisation toutes les 20 secondes tant que cette page est ouverte.')}</p>
    {stopped && <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{en ? 'Refresh status' : 'Actualiser le suivi'}</button>}
  </section>;
}
