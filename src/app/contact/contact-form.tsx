'use client';

import { useState, type FormEvent } from 'react';
import styles from './contact.module.css';

export default function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'CONTACT_UNAVAILABLE');
      form.reset();
      setResult({ ok: true, message: 'Votre message a bien été envoyé. Nous vous répondrons dès que possible.' });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setResult({ ok: false, message: code === 'TOO_MANY_REQUESTS'
        ? 'Plusieurs messages ont été envoyés récemment. Réessayez dans quelques minutes.'
        : code === 'INVALID_MESSAGE'
          ? 'Vérifiez les champs du formulaire et réessayez.'
          : 'L’envoi est momentanément indisponible. Vous pouvez nous contacter par téléphone ou passer nous voir au restaurant.' });
    } finally {
      setBusy(false);
    }
  }

  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.formHeading}>
      <p className={styles.number}>04</p>
      <h2>Écrivez-nous</h2>
      <p>Une question sur la carte, une commande ou le restaurant ? Envoyez-nous un message.</p>
    </div>
    <div className={styles.fields}>
      <label>Votre nom<input name="name" type="text" autoComplete="name" maxLength={100} required /></label>
      <label>Votre adresse e-mail<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label className={styles.fullField}>Sujet<select name="subject" defaultValue="question"><option value="question">Question générale</option><option value="commande">À propos d’une commande</option><option value="carte">À propos de la carte ou des allergènes</option><option value="autre">Autre demande</option></select></label>
      <label className={styles.fullField}>Votre message<textarea name="message" rows={6} maxLength={4000} required /></label>
    </div>
    <label className={styles.trap} aria-hidden="true" tabIndex={-1}>Ne pas remplir<input name="website" autoComplete="off" tabIndex={-1} /></label>
    <button className={styles.submit} type="submit" disabled={busy}>{busy ? 'Envoi en cours…' : 'Envoyer le message'} <span aria-hidden="true">→</span></button>
    {result && <p className={result.ok ? styles.success : styles.error} role={result.ok ? 'status' : 'alert'}>{result.message}</p>}
  </form>;
}
