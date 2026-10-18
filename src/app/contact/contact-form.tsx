'use client';

import { useState, type FormEvent } from 'react';
import styles from './contact.module.css';
import type { SiteLocale } from '../../lib/locale';

export default function ContactForm({ locale = 'fr' }: { locale?: SiteLocale }) {
  const en = locale === 'en';
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
      setResult({ ok: true, message: en ? 'Your message has been sent. We will get back to you as soon as possible.' : 'Votre message a bien été envoyé. Nous vous répondrons dès que possible.' });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setResult({ ok: false, message: code === 'TOO_MANY_REQUESTS'
        ? en ? 'Several messages were sent recently. Please try again in a few minutes.' : 'Plusieurs messages ont été envoyés récemment. Réessayez dans quelques minutes.'
        : code === 'INVALID_MESSAGE'
          ? en ? 'Please check the form fields and try again.' : 'Vérifiez les champs du formulaire et réessayez.'
          : en ? 'Sending is temporarily unavailable. Please call us or visit the restaurant.' : 'L’envoi est momentanément indisponible. Vous pouvez nous contacter par téléphone ou passer nous voir au restaurant.' });
    } finally {
      setBusy(false);
    }
  }

  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.formHeading}>
      <p className={styles.number}>04</p>
      <h2>{en ? 'Write to us' : 'Écrivez-nous'}</h2>
      <p>{en ? 'Have a question about the menu, an order or the restaurant? Send us a message.' : 'Une question sur la carte, une commande ou le restaurant ? Envoyez-nous un message.'}</p>
    </div>
    <div className={styles.fields}>
      <label>{en ? 'Your name' : 'Votre nom'}<input name="name" type="text" autoComplete="name" maxLength={100} required /></label>
      <label>{en ? 'Your email address' : 'Votre adresse e-mail'}<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label className={styles.fullField}>{en ? 'Subject' : 'Sujet'}<select name="subject" defaultValue="question"><option value="question">{en ? 'General question' : 'Question générale'}</option><option value="commande">{en ? 'About an order' : 'À propos d’une commande'}</option><option value="carte">{en ? 'About the menu or allergens' : 'À propos de la carte ou des allergènes'}</option><option value="autre">{en ? 'Other request' : 'Autre demande'}</option></select></label>
      <label className={styles.fullField}>{en ? 'Your message' : 'Votre message'}<textarea name="message" rows={6} maxLength={4000} required /></label>
    </div>
    <label className={styles.trap} aria-hidden="true" tabIndex={-1}>{en ? 'Do not fill in' : 'Ne pas remplir'}<input name="website" autoComplete="off" tabIndex={-1} /></label>
    <button className={styles.submit} type="submit" disabled={busy}>{busy ? en ? 'Sending…' : 'Envoi en cours…' : en ? 'Send message' : 'Envoyer le message'} <span aria-hidden="true">→</span></button>
    {result && <p className={result.ok ? styles.success : styles.error} role={result.ok ? 'status' : 'alert'}>{result.message}</p>}
  </form>;
}
