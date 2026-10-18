'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { SiteLocale } from '../../lib/locale';
export default function AccountAccess({ returnTo, testMode = false, canRecover = false, locale = 'fr' }: { returnTo: string; testMode?: boolean; canRecover?: boolean; locale?: SiteLocale }) {
  const en = locale === 'en';
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
      if (!response.ok) { setError(response.status === 429 ? (en ? 'Too many attempts. Try again in 15 minutes.' : 'Trop de tentatives. Réessayez dans 15 minutes.') : (en ? 'Sign in or registration failed. Check your details, or sign in if you already have an account.' : 'Connexion ou inscription impossible. Vérifiez vos informations, ou utilisez la connexion si vous avez déjà un compte.')); return; }
      window.location.assign(returnTo);
    } catch { setError(en ? 'Service unavailable. Please try again later.' : 'Service indisponible. Réessayez plus tard.'); }
    finally { setBusy(false); }
  }
  return <section className="customer-account-access" aria-label={en ? 'Customer sign in' : 'Accès client'}><div className="customer-actions"><button type="button" aria-pressed={action === 'login'} onClick={() => { setAction('login'); setError(''); }}>{en ? 'Sign in' : 'Se connecter'}</button><button type="button" aria-pressed={action === 'register'} onClick={() => { setAction('register'); setError(''); }}>{en ? 'Create an account' : 'Créer un compte'}</button></div>
    <form method="post" onSubmit={submit}><fieldset disabled={busy}><legend>{action === 'register' ? (en ? 'Registration' : 'Inscription') : (en ? 'Sign in' : 'Connexion')}</legend>
      {action === 'register' && <label>{en ? 'Your name' : 'Votre nom'}<input name="name" required maxLength={128} autoComplete="name" /></label>}
      <label>{en ? 'Email address' : 'Adresse e-mail'}<input name="email" type="email" required maxLength={320} autoComplete="email" /></label>
      <label>{en ? 'Password' : 'Mot de passe'}<input name="password" type="password" required minLength={12} maxLength={128} autoComplete={action === 'register' ? 'new-password' : 'current-password'} /></label>
      <p>{en ? 'At least 12 characters. Email verification and password recovery depend on the email service setup.' : '12 caractères minimum. La vérification de l’adresse e-mail et la récupération du mot de passe dépendent de la configuration du service d’envoi.'}</p>
      <button type="submit">{busy ? (en ? 'Please wait…' : 'Patientez…') : action === 'register' ? testMode ? (en ? 'Create test account' : 'Créer mon compte de test') : (en ? 'Create my account' : 'Créer mon compte') : (en ? 'Open my account' : 'Ouvrir mon espace')}</button>
    </fieldset>{canRecover && <Link href="/compte/mot-de-passe-oublie">{en ? 'Forgot password?' : 'Mot de passe oublié ?'}</Link>}{error && <p role="alert">{error}</p>}</form>
  </section>;
}
