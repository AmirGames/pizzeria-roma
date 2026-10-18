'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function AccountAccess({ returnTo, testMode = false, canRecover = false }: { returnTo: string; testMode?: boolean; canRecover?: boolean }) {
  const [action, setAction] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/customer/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, email: data.get('email'), password: data.get('password'), ...(action === 'register' ? { name: data.get('name') } : {}) }) });
      if (!response.ok) { setError(response.status === 429 ? 'Trop de tentatives. Réessayez dans 15 minutes.' : 'Connexion ou inscription impossible. Vérifiez vos informations, ou utilisez la connexion si vous avez déjà un compte.'); return; }
      window.location.assign(returnTo);
    } catch { setError('Service indisponible. Réessayez plus tard.'); }
    finally { setBusy(false); }
  }
  return <section className="customer-account-access" aria-label="Accès client"><div className="customer-actions"><button type="button" aria-pressed={action === 'login'} onClick={() => { setAction('login'); setError(''); }}>Se connecter</button><button type="button" aria-pressed={action === 'register'} onClick={() => { setAction('register'); setError(''); }}>Créer un compte</button></div>
    <form method="post" onSubmit={submit}><fieldset disabled={busy}><legend>{action === 'register' ? 'Inscription' : 'Connexion'}</legend>
      {action === 'register' && <label>Votre nom<input name="name" required maxLength={128} autoComplete="name" /></label>}
      <label>Adresse e-mail<input name="email" type="email" required maxLength={320} autoComplete="email" /></label>
      <label>Mot de passe<input name="password" type="password" required minLength={12} maxLength={128} autoComplete={action === 'register' ? 'new-password' : 'current-password'} /></label>
      <p>12 caractères minimum. La vérification de l’adresse e-mail et la récupération du mot de passe dépendent de la configuration du service d’envoi.</p>
      <button type="submit">{busy ? 'Patientez…' : action === 'register' ? testMode ? 'Créer mon compte de test' : 'Créer mon compte' : 'Ouvrir mon espace'}</button>
    </fieldset>{canRecover && <Link href="/compte/mot-de-passe-oublie">Mot de passe oublié ?</Link>}{error && <p role="alert">{error}</p>}</form>
  </section>;
}
