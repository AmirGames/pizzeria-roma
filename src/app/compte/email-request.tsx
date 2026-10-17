'use client';
import { useEffect, useState } from 'react';
export default function EmailRequest({ verify = false, changeEmail = false, localMode = true }: { verify?: boolean; changeEmail?: boolean; localMode?: boolean }) {
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
      if (!response.ok) { setError(response.status === 429 ? 'Trop de demandes. Réessayez dans 15 minutes.' : response.status === 409 ? 'Cette adresse e-mail est déjà utilisée.' : localMode ? 'Envoi indisponible. Vérifiez que la boîte mail locale est démarrée, puis réessayez.' : 'Envoi indisponible. Vérifiez la configuration du service e-mail, puis réessayez.'); return; }
      setMessage(verify ? localMode ? 'Demande traitée. Consultez la boîte mail locale pour vérifier votre adresse.' : 'Un lien de vérification vient d’être envoyé à votre adresse.' : changeEmail ? localMode ? 'Un lien a été envoyé à la boîte mail locale. La modification sera appliquée après confirmation.' : 'Un lien a été envoyé à cette adresse. La modification sera appliquée après confirmation.' : localMode ? 'Si un compte peut recevoir cet e-mail, un lien de réinitialisation sera disponible dans la boîte mail locale.' : 'Si un compte peut recevoir cet e-mail, un lien de réinitialisation lui a été envoyé.');
    } catch { setError('Connexion interrompue. Réessayez.'); }
    finally { setBusy(false); }
  }
  return <form method="post" onSubmit={submit}><fieldset disabled={busy || !ready}><legend>{verify ? 'Vérifier mon adresse e-mail' : changeEmail ? 'Changer mon adresse e-mail' : 'Récupérer mon accès'}</legend>
    {!verify && <label>{changeEmail ? 'Nouvelle adresse e-mail' : 'Adresse e-mail'}<input type="email" name="email" required maxLength={320} autoComplete="email" /></label>}
    <button type="submit">{busy ? 'Envoi…' : verify ? 'Renvoyer le lien de vérification' : changeEmail ? 'Envoyer le lien de confirmation' : 'Demander un lien de réinitialisation'}</button>
  </fieldset>{message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}</form>;
}
