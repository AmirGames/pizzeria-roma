import Link from 'next/link';
import { notFound } from 'next/navigation';
import { customerAccountsEnabled } from '../../../lib/customer-accounts';
import { testOrdersEnabled } from '../../../lib/test-mode';
import EmailRequest from '../email-request';
import { getSiteLocale } from '../../../lib/locale';
import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> { const en = (await getSiteLocale()) === 'en'; return { title: `${en ? 'Forgot password' : 'Mot de passe oublié'} | Pizzeria Roma`, robots: { index: false, follow: false }, referrer: 'no-referrer' as const }; }
export default async function Page() {
  if (!customerAccountsEnabled()) notFound();
  const locale = await getSiteLocale(); const en = locale === 'en';
  return <main className="customer-page"><Link href="/compte">← {en ? 'My account' : 'Mon espace client'}</Link><h1>{en ? 'Forgot password' : 'Mot de passe oublié'}</h1><p>{testOrdersEnabled() ? (en ? 'Local mode: the message is captured in the test mailbox.' : 'Mode local : le message est capturé dans la boîte mail de test.') : (en ? 'If this email matches an account, a password reset link will be sent.' : 'Si cette adresse correspond à un compte, un lien de réinitialisation lui sera envoyé.')}</p><EmailRequest localMode={testOrdersEnabled()} locale={locale} /></main>;
}
