import 'server-only';
import { prisma } from './db';
import { emailLinkOrigin, localMailOrigin, prepareCustomerEmailToken } from './customer-email-links.mjs';
import { testOrdersEnabled } from './test-mode';
import { realOrdersEnabled } from './real-orders';
import { getSiteLocale } from './locale';
export function localCustomerMailConfigured() { return testOrdersEnabled() && !!process.env.LOCAL_MAIL_URL && !!process.env.APP_ORIGIN; }
export function customerMailConfigured() {
  if (testOrdersEnabled()) return localCustomerMailConfigured();
  return realOrdersEnabled() && !!process.env.RESEND_API_KEY?.trim() && !!process.env.CONTACT_FROM_EMAIL?.trim() && !!process.env.APP_ORIGIN;
}
export async function sendCustomerLink(userId: string, purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'CHANGE_EMAIL', emailOverride?: string) {
  const local = testOrdersEnabled();
  if (!customerMailConfigured()) throw new Error('MAIL_UNAVAILABLE');
  const mailOrigin = local ? localMailOrigin(process.env.LOCAL_MAIL_URL) : null;
  const appOrigin = emailLinkOrigin(process.env.APP_ORIGIN);
  const en = (await getSiteLocale()) === 'en';
  const link = await prisma.$transaction(tx => prepareCustomerEmailToken(tx, userId, purpose, new Date(), emailOverride));
  if (!link) return;
  const verify = purpose === 'VERIFY_EMAIL';
  const changeEmail = purpose === 'CHANGE_EMAIL';
  const url = `${appOrigin}/compte/${verify ? 'verifier' : changeEmail ? 'changer-email' : 'reinitialiser'}#${link.token}`;
  const subject = verify
    ? (en ? 'Verify your email — Pizzeria Roma' : 'Vérifier votre e-mail — Pizzeria Roma')
    : changeEmail
      ? (en ? 'Confirm your new email — Pizzeria Roma' : 'Confirmer votre nouvelle adresse — Pizzeria Roma')
      : (en ? 'Reset your password — Pizzeria Roma' : 'Réinitialiser votre mot de passe — Pizzeria Roma');
  const action = verify
    ? (en ? 'Confirm your email address' : 'Confirmez votre adresse e-mail')
    : changeEmail
      ? (en ? 'Confirm your new email address' : 'Confirmez votre nouvelle adresse e-mail')
      : (en ? 'Choose a new password' : 'Choisissez un nouveau mot de passe');
  const safety = en ? 'If you did not request this, you can ignore this message.' : 'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.';
  const expiry = verify ? (en ? '24 hours' : '24 heures') : '15 minutes';
  const localNote = local
    ? (en ? '\nLocal test message: no real order has been placed.' : '\nMessage de test capturé localement : aucune commande réelle.')
    : '';
  const text = `${action}:\n${url}\n\n${en ? 'One-time link, valid for' : 'Lien à usage unique, valable'} ${expiry}. ${safety}${localNote}`;
  try {
    const response = local
      ? await fetch(`${mailOrigin}/api/v1/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000), body: JSON.stringify({
        From: { Email: 'noreply@roma.local', Name: en ? 'Pizzeria Roma — local test' : 'Pizzeria Roma — test local' }, To: [{ Email: link.email }], Subject: `${subject} (test)`, Text: text,
      }) })
      : await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000), body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL!.trim(), to: [link.email], subject, text,
      }) });
    if (!response.ok) throw new Error('MAIL_UNAVAILABLE');
  } catch {
    await prisma.customerEmailToken.deleteMany({ where: { tokenHash: link.tokenHash } });
    throw new Error('MAIL_UNAVAILABLE');
  }
}
