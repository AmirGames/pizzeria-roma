'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SiteLocale } from '../../lib/locale';
export default function EmailLinkForm({ reset = false, changeEmail = false, locale = 'fr' }: { reset?: boolean; changeEmail?: boolean; locale?: SiteLocale }) {
  const en = locale === 'en';
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
    if (reset && fields.get('newPassword') !== fields.get('confirmation')) { setError(en ? 'The passwords do not match.' : 'Les mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    try {
      const response = await fetch(`/api/customer/email/${reset ? 'reset' : changeEmail ? 'change' : 'verify'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...(reset ? { newPassword: fields.get('newPassword'), confirmation: fields.get('confirmation') } : {}) }) });
      if (!response.ok) { setError(en ? (response.status === 429 ? 'Too many attempts. Try again later.' : response.status === 503 ? 'Service unavailable. Please try again.' : 'This link is invalid, expired or already used. Request a new link.') : (response.status === 429 ? 'Trop de tentatives. Réessayez plus tard.' : response.status === 503 ? 'Service indisponible. Réessayez.' : 'Lien invalide, expiré ou déjà utilisé. Demandez un nouveau lien.')); return; }
      setToken(''); setDone(true);
    } catch { setError(en ? 'Connection interrupted. Try again or request a new link.' : 'Connexion interrompue. Réessayez ou demandez un nouveau lien.'); }
    finally { setBusy(false); }
  }
  if (done) return <><p role="status">{en ? (reset ? 'Your password has been reset. Previous sessions are signed out. Sign in with your new password.' : changeEmail ? 'Your new email address is confirmed. Sign in again with this address.' : 'Your email address is verified.') : (reset ? 'Votre mot de passe a été réinitialisé. Les anciennes sessions sont déconnectées. Connectez-vous avec votre nouveau mot de passe.' : changeEmail ? 'Votre nouvelle adresse e-mail est confirmée. Reconnectez-vous avec cette adresse.' : 'Votre adresse e-mail est vérifiée.')}</p><Link href="/compte">{en ? 'Back to my account' : 'Retour à mon espace client'}</Link></>;
  return <form method="post" onSubmit={submit}><fieldset disabled={busy}>
    <legend>{reset ? (en ? 'Choose a new password' : 'Choisir un nouveau mot de passe') : changeEmail ? (en ? 'Confirm the new address' : 'Confirmer la nouvelle adresse') : (en ? 'Confirm my address' : 'Confirmer mon adresse')}</legend>
    <label>{en ? 'Private code' : 'Code privé'}<input type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} required /></label>
    {reset && <><label>{en ? 'New password' : 'Nouveau mot de passe'}<input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label><label>{en ? 'Confirm new password' : 'Confirmer le nouveau mot de passe'}<input name="confirmation" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label></>}
    <button type="submit">{busy ? (en ? 'Checking…' : 'Vérification…') : reset ? (en ? 'Reset my password' : 'Réinitialiser mon mot de passe') : changeEmail ? (en ? 'Confirm my email address' : 'Confirmer mon adresse e-mail') : (en ? 'Confirm my email' : 'Confirmer mon e-mail')}</button>
  </fieldset>{error && <p role="alert">{error}</p>}<Link href={reset ? '/compte/mot-de-passe-oublie' : '/compte'}>{en ? 'Request a new link' : 'Demander un nouveau lien'}</Link></form>;
}
