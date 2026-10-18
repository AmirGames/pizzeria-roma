'use client';
import { useState } from 'react';
import type { SiteLocale } from '../../lib/locale';
export default function SignOut({ locale = 'fr' }: { locale?: SiteLocale }) {
  const en = locale === 'en';
  const [error, setError] = useState('');
  async function signOut() {
    try {
      const response = await fetch('/api/customer/session', { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error();
      window.location.assign('/compte');
    } catch { setError(en ? 'Could not sign out. Please try again.' : 'Déconnexion impossible. Réessayez.'); }
  }
  return <><button type="button" onClick={signOut}>{en ? 'Sign out' : 'Se déconnecter'}</button>{error && <p role="alert">{error}</p>}</>;
}
