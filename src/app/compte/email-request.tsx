'use client';
import { useEffect, useState } from 'react';
import type { SiteLocale } from '../../lib/locale';
export default function EmailRequest({ verify = false, changeEmail = false, localMode = true, locale = 'fr' }: { verify?: boolean; changeEmail?: boolean; localMode?: boolean; locale?: SiteLocale }) {
  const en = locale === 'en';
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true); setMessage(''); setError('');
    try {
      const action = verify ? 'verify' : changeEmail ? 'change' : 'reset';
      const response = await fetch('/api/customer/email/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...(verify ? {} : { email: fields.get('email') }) }) });
      if (!response.ok) { setError(en ? (response.status === 429 ? 'Too many requests. Try again in 15 minutes.' : response.status === 409 ? 'This email address is already in use.' : localMode ? 'Email sending is unavailable. Make sure the local mail inbox is running, then try again.' : 'Email sending is unavailable. Check the email service setup, then try again.') : (response.status === 429 ? 'Trop de demandes. Réessayez dans 15 minutes.' : response.status === 409 ? 'Cette adresse e-mail est déjà utilisée.' : localMode ? 'Envoi indisponible. Vérifiez que la boîte mail locale est démarrée, puis réessayez.' : 'Envoi indisponible. Vérifiez la configuration du service e-mail, puis réessayez.')); return; }
      setMessage(en ? (verify ? localMode ? 'Request processed. Check the local mailbox to verify your address.' : 'A verification link has been sent to your address.' : changeEmail ? localMode ? 'A link was sent to the local mailbox. The change will apply after confirmation.' : 'A link was sent to this address. The change will apply after confirmation.' : localMode ? 'If an account can receive this email, a reset link will be available in the local mailbox.' : 'If an account can receive this email, a password reset link has been sent.') : (verify ? localMode ? 'Demande traitée. Consultez la boîte mail locale pour vérifier votre adresse.' : 'Un lien de vérification vient d’être envoyé à votre adresse.' : changeEmail ? localMode ? 'Un lien a été envoyé à la boîte mail locale. La modification sera appliquée après confirmation.' : 'Un lien a été envoyé à cette adresse. La modification sera appliquée après confirmation.' : localMode ? 'Si un compte peut recevoir cet e-mail, un lien de réinitialisation sera disponible dans la boîte mail locale.' : 'Si un compte peut recevoir cet e-mail, un lien de réinitialisation lui a été envoyé.'));
    } catch { setError(en ? 'Connection interrupted. Please try again.' : 'Connexion interrompue. Réessayez.'); }
    finally { setBusy(false); }
  }
  return <form method="post" onSubmit={submit}><fieldset disabled={busy || !ready}><legend>{verify ? (en ? 'Verify my email address' : 'Vérifier mon adresse e-mail') : changeEmail ? (en ? 'Change my email address' : 'Changer mon adresse e-mail') : (en ? 'Recover my account' : 'Récupérer mon accès')}</legend>
    {!verify && <label>{changeEmail ? (en ? 'New email address' : 'Nouvelle adresse e-mail') : (en ? 'Email address' : 'Adresse e-mail')}<input type="email" name="email" required maxLength={320} autoComplete="email" /></label>}
    <button type="submit">{busy ? (en ? 'Sending…' : 'Envoi…') : verify ? (en ? 'Resend verification link' : 'Renvoyer le lien de vérification') : changeEmail ? (en ? 'Send confirmation link' : 'Envoyer le lien de confirmation') : (en ? 'Request a reset link' : 'Demander un lien de réinitialisation')}</button>
  </fieldset>{message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}</form>;
}
