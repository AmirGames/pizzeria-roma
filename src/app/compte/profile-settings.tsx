'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function ProfileSettings({ name, phone }: { name: string; phone: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');
  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setProfileError(''); setProfileSuccess('');
    try {
      const response = await fetch('/api/customer/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.get('name'), phone: data.get('phone') }) });
      if (!response.ok) { setProfileError(response.status === 401 ? 'Votre session a expiré. Reconnectez-vous.' : 'Vérifiez le nom et le numéro de téléphone.'); return; }
      setProfileSuccess('Vos coordonnées ont été enregistrées.'); router.refresh();
    } catch { setProfileError('Enregistrement impossible. Réessayez.'); }
    finally { setBusy(false); }
  }
  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPasswordError(''); setPasswordSuccess('');
    if (data.get('newPassword') !== data.get('confirmation')) { setPasswordError('Les nouveaux mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/customer/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: data.get('currentPassword'), newPassword: data.get('newPassword'), confirmation: data.get('confirmation') }) });
      if (!response.ok) { setPasswordError(response.status === 429 ? 'Trop de tentatives. Réessayez dans 15 minutes.' : response.status === 409 ? 'Le mot de passe a déjà changé. Reconnectez-vous.' : response.status === 401 ? 'Votre session a expiré. Reconnectez-vous.' : 'Vérifiez le mot de passe actuel et choisissez un nouveau mot de passe différent (12 caractères minimum).'); return; }
      form.reset(); setPasswordSuccess('Mot de passe changé. Les autres sessions ont été déconnectées.'); router.refresh();
    } catch { setPasswordError('Connexion interrompue. Vérifiez si votre nouveau mot de passe fonctionne avant de réessayer.'); }
    finally { setBusy(false); }
  }
  async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get('confirmation') !== 'SUPPRIMER') { setDeleteError('Saisissez SUPPRIMER pour confirmer.'); return; }
    setBusy(true); setDeleteError('');
    try {
      const response = await fetch('/api/customer/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: data.get('password'), confirmation: data.get('confirmation') }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setDeleteError(result.error === 'INVALID_PASSWORD' ? 'Le mot de passe est incorrect.' : result.error === 'TOO_MANY_ATTEMPTS' ? 'Trop de tentatives. Réessayez dans 15 minutes.' : result.error === 'ACTIVE_ORDERS' ? 'Une commande est encore en cours ou son paiement est en attente. Contactez le restaurant pour la clôturer avant de supprimer le compte.' : result.error === 'STORE_CREDIT_REMAINS' ? 'Un avoir ou une réservation de crédit est encore lié à votre compte. Utilisez-le ou contactez le restaurant avant la suppression.' : 'La suppression n’a pas abouti. Réessayez ou contactez le restaurant.');
        return;
      }
      router.replace('/compte?compte=supprime');
      router.refresh();
    } catch { setDeleteError('Connexion interrompue. Vérifiez si le compte est toujours accessible avant de réessayer.'); }
    finally { setBusy(false); }
  }
  return <details className="customer-settings"><summary>Mes coordonnées et mon mot de passe</summary>
    <form method="post" onSubmit={saveProfile} onChange={() => setProfileSuccess('')}><fieldset disabled={busy}><legend>Mes coordonnées</legend>
      <label>Nom du profil<input name="name" required maxLength={128} defaultValue={name} autoComplete="name" /></label>
      <label>Téléphone du profil<input name="phone" type="tel" maxLength={30} defaultValue={phone} autoComplete="tel" /></label>
      <p>Le téléphone est facultatif dans le profil. Ces données préremplissent vos prochaines commandes.</p>
      <button type="submit">Enregistrer mes coordonnées</button>
    </fieldset>{profileError && <p role="alert">{profileError}</p>}{profileSuccess && <p role="status">{profileSuccess}</p>}</form>
    <form method="post" onSubmit={savePassword} onChange={() => setPasswordSuccess('')}><fieldset disabled={busy}><legend>Changer mon mot de passe</legend>
      <label>Mot de passe actuel<input type="password" name="currentPassword" required minLength={12} maxLength={128} autoComplete="current-password" /></label>
      <label>Nouveau mot de passe<input type="password" name="newPassword" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
      <label>Confirmer le nouveau mot de passe<input type="password" name="confirmation" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
      <p>Après confirmation, vous resterez connecté ici avec une nouvelle session ; vos autres sessions seront fermées.</p>
      <button type="submit">Changer mon mot de passe</button>
    </fieldset>{passwordError && <p role="alert">{passwordError}</p>}{passwordSuccess && <p role="status">{passwordSuccess}</p>}</form>
    <details className="customer-danger-zone"><summary>Supprimer mon compte</summary><p>Votre profil, vos adresses, vos identifiants et vos commandes de test seront supprimés. Les commandes réellement payées seront dissociées du compte et leurs coordonnées de contact seront effacées ; les données nécessaires à la preuve de la transaction peuvent être conservées selon les obligations applicables. Une commande en cours ou un avoir restant bloque la suppression.</p>
      <form method="post" onSubmit={deleteAccount} onChange={() => setDeleteError('')}><fieldset disabled={busy}><legend>Confirmer la suppression définitive</legend>
        <label>Mot de passe actuel<input type="password" name="password" required maxLength={128} autoComplete="current-password" /></label>
        <label>Saisissez SUPPRIMER<input name="confirmation" required maxLength={16} autoComplete="off" /></label>
        <button type="submit">Supprimer définitivement mon compte</button>
      </fieldset>{deleteError && <p role="alert">{deleteError}</p>}</form>
    </details>
  </details>;
}
