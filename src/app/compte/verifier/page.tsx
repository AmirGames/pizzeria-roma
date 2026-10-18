import Link from 'next/link';
import { notFound } from 'next/navigation';
import { customerAccountsEnabled } from '../../../lib/customer-accounts';
import EmailLinkForm from '../email-link-form';
import { getSiteLocale } from '../../../lib/locale';
import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> { const en = (await getSiteLocale()) === 'en'; return { title: `${en ? 'Verify my email' : 'Vérifier mon e-mail'} | Pizzeria Roma`, robots: { index: false, follow: false }, referrer: 'no-referrer' as const }; }
export default async function Page() {
  if (!customerAccountsEnabled()) notFound();
  const locale = await getSiteLocale(); const en = locale === 'en';
  return <main className="customer-page"><Link href="/compte">← {en ? 'My account' : 'Mon espace client'}</Link><h1>{en ? 'Verify my email' : 'Vérifier mon e-mail'}</h1><p>{en ? 'Open the link in your email to confirm your account address.' : 'Ouvrez le lien reçu par e-mail pour confirmer l’adresse de votre compte.'}</p><EmailLinkForm locale={locale} /></main>;
}
