'use client';

export default function AppErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="customer-page site-error-page">
    <section className="site-error-panel" role="alert">
      <p className="eyebrow">PIZZERIA ROMA · SERVICE CLIENT</p>
      <h1>Le service est momentanément indisponible</h1>
      <p>Une connexion nécessaire au site ne répond pas. Réessayez dans un instant.</p>
      <button type="button" onClick={reset}>Réessayer</button>
    </section>
  </main>;
}
