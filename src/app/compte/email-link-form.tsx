'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
export default function EmailLinkForm({ reset = false }: { reset?: boolean }) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (window.location.hash) { setToken(window.location.hash.slice(1)); window.history.replaceState(null, '', window.location.pathname); } }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setError('');
    if (reset && fields.get('newPassword') !== fields.get('confirmation')) { setError('Les mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    try {
      const response = await fetch(`/api/customer/email/${reset ? 'reset' : 'verify'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...(reset ? { newPassword: fields.get('newPassword'), confirmation: fields.get('confirmation') } : {}) }) });
      if (!response.ok) { setError(response.status === 429 ? 'Trop de tentatives. Réessayez plus tard.' : response.status === 503 ? 'Service indisponible. Réessayez.' : 'Lien invalide, expiré ou déjà utilisé. Demandez un nouveau lien.'); return; }
      setToken(''); setDone(true);
    } catch { setError('Connexion interrompue. Réessayez ou demandez un nouveau lien.'); }
    finally { setBusy(false); }
  }
  if (done) return <><p role="status">{reset ? 'Votre mot de passe a été réinitialisé. Les anciennes sessions sont déconnectées. Connectez-vous avec votre nouveau mot de passe.' : 'Votre adresse e-mail est vérifiée.'}</p><Link href="/compte">Retour à mon espace client</Link></>;
  return <form onSubmit={submit}><fieldset disabled={busy}>
    <legend>{reset ? 'Choisir un nouveau mot de passe' : 'Confirmer mon adresse'}</legend>
    <label>Code privé<input type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} required /></label>
    {reset && <><label>Nouveau mot de passe<input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label><label>Confirmer le nouveau mot de passe<input name="confirmation" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label></>}
    <button type="submit">{busy ? 'Vérification…' : reset ? 'Réinitialiser mon mot de passe' : 'Confirmer mon e-mail'}</button>
  </fieldset>{error && <p role="alert">{error}</p>}<Link href={reset ? '/compte/mot-de-passe-oublie' : '/compte'}>Demander un nouveau lien</Link></form>;
}
