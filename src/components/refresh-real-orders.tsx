'use client';

import { useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_INTERVAL_MS = 20_000;

export default function RefreshRealOrders() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  function refresh() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    startTransition(() => router.refresh());
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, REFRESH_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return <div className="manager-toolbar">
    <div><span className="manager-meta-label">Actualisation automatique</span><p role="status">Toutes les 20 secondes lorsque cette page est visible.</p></div>
    <button type="button" disabled={pending} onClick={refresh}>{pending ? 'Actualisation…' : 'Actualiser maintenant'}</button>
  </div>;
}
