'use client';
import { useState } from 'react';
export default function SignOut() {
  const [error, setError] = useState('');
  async function signOut() {
    try {
      const response = await fetch('/api/customer/session', { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error();
      window.location.assign('/compte');
    } catch { setError('Déconnexion impossible. Réessayez.'); }
  }
  return <><button type="button" onClick={signOut}>Se déconnecter</button>{error && <p role="alert">{error}</p>}</>;
}
