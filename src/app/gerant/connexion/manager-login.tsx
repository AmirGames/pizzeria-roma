'use client';
import { useEffect, useState } from 'react';
export default function ManagerLogin() {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (window.location.hash) {
      setToken(window.location.hash.slice(1));
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/manager/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      if (!response.ok) { setError('Connexion impossible. Le lien est peut-être expiré ou déjà utilisé.'); setBusy(false); return; }
      setToken('');
      window.location.replace('/gerant/carte');
    } catch { setError('Connexion interrompue. Réessayez ou demandez un nouveau lien privé.'); setBusy(false); }
  }
  return <form onSubmit={login}><label>Code privé<input type="password" autoComplete="off" required value={token} onChange={event => setToken(event.target.value)} /></label><button disabled={busy} type="submit">{busy ? 'Connexion…' : 'Se connecter'}</button>{error && <p role="alert">{error}</p>}</form>;
}
