import 'server-only';
import { prisma } from './db';
import { emailLinkOrigin, localMailOrigin, prepareCustomerEmailToken } from './customer-email-links.mjs';
import { testOrdersEnabled } from './test-mode';
export function localCustomerMailConfigured() { return testOrdersEnabled() && !!process.env.LOCAL_MAIL_URL && !!process.env.APP_ORIGIN; }
export async function sendCustomerLink(userId: string, purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD') {
  if (!localCustomerMailConfigured()) throw new Error('MAIL_UNAVAILABLE');
  const mailOrigin = localMailOrigin(process.env.LOCAL_MAIL_URL);
  const appOrigin = emailLinkOrigin(process.env.APP_ORIGIN);
  const link = await prisma.$transaction(tx => prepareCustomerEmailToken(tx, userId, purpose));
  if (!link) return;
  const verify = purpose === 'VERIFY_EMAIL';
  const url = `${appOrigin}/compte/${verify ? 'verifier' : 'reinitialiser'}#${link.token}`;
  try {
    const response = await fetch(`${mailOrigin}/api/v1/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000), body: JSON.stringify({
      From: { Email: 'noreply@roma.local', Name: 'Pizzeria Roma — test local' }, To: [{ Email: link.email }],
      Subject: verify ? 'Vérifier votre e-mail — Pizzeria Roma (test)' : 'Réinitialiser votre mot de passe — Pizzeria Roma (test)',
      Text: `${verify ? 'Confirmez votre adresse e-mail' : 'Choisissez un nouveau mot de passe'} :\n${url}\n\nLien à usage unique, valable ${verify ? '24 heures' : '15 minutes'}. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.\nMessage de test capturé localement : aucune commande réelle.`,
    }) });
    if (!response.ok) throw new Error('MAIL_UNAVAILABLE');
  } catch {
    await prisma.customerEmailToken.deleteMany({ where: { tokenHash: link.tokenHash } });
    throw new Error('MAIL_UNAVAILABLE');
  }
}
