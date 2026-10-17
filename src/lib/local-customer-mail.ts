import 'server-only';
import { prisma } from './db';
import { emailLinkOrigin, localMailOrigin, prepareCustomerEmailToken } from './customer-email-links.mjs';
import { testOrdersEnabled } from './test-mode';
import { realOrdersEnabled } from './real-orders';
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
  const link = await prisma.$transaction(tx => prepareCustomerEmailToken(tx, userId, purpose, new Date(), emailOverride));
  if (!link) return;
  const verify = purpose === 'VERIFY_EMAIL';
  const changeEmail = purpose === 'CHANGE_EMAIL';
  const url = `${appOrigin}/compte/${verify ? 'verifier' : changeEmail ? 'changer-email' : 'reinitialiser'}#${link.token}`;
  const subject = verify ? 'Vérifier votre e-mail — Pizzeria Roma' : changeEmail ? 'Confirmer votre nouvelle adresse — Pizzeria Roma' : 'Réinitialiser votre mot de passe — Pizzeria Roma';
  const text = `${verify ? 'Confirmez votre adresse e-mail' : changeEmail ? 'Confirmez votre nouvelle adresse e-mail' : 'Choisissez un nouveau mot de passe'} :\n${url}\n\nLien à usage unique, valable ${verify ? '24 heures' : '15 minutes'}. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.${local ? '\nMessage de test capturé localement : aucune commande réelle.' : ''}`;
  try {
    const response = local
      ? await fetch(`${mailOrigin}/api/v1/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000), body: JSON.stringify({
        From: { Email: 'noreply@roma.local', Name: 'Pizzeria Roma — test local' }, To: [{ Email: link.email }], Subject: `${subject} (test)`, Text: text,
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
