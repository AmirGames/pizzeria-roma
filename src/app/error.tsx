'use client';

import { useEffect, useState } from 'react';

export default function AppErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [en, setEn] = useState(false);
  useEffect(() => { setEn(document.cookie.split(';').some(cookie => cookie.trim() === 'roma_locale=en')); }, []);
  return <main className="customer-page site-error-page">
    <section className="site-error-panel" role="alert">
      <p className="eyebrow">{en ? 'PIZZERIA ROMA · CUSTOMER SERVICE' : 'PIZZERIA ROMA · SERVICE CLIENT'}</p>
      <h1>{en ? 'The service is temporarily unavailable' : 'Le service est momentanément indisponible'}</h1>
      <p>{en ? 'A service required by the site is not responding. Please try again shortly.' : 'Une connexion nécessaire au site ne répond pas. Réessayez dans un instant.'}</p>
      <button type="button" onClick={reset}>{en ? 'Try again' : 'Réessayer'}</button>
    </section>
  </main>;
}
