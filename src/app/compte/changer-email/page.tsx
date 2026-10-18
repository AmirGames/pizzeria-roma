import Link from 'next/link';
import { notFound } from 'next/navigation';
import { customerAccountsEnabled } from '../../../lib/customer-accounts';
import EmailLinkForm from '../email-link-form';
import { getSiteLocale } from '../../../lib/locale';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> { const en = (await getSiteLocale()) === 'en'; return { title: `${en ? 'Confirm a new email address' : 'Confirmer une nouvelle adresse'} | Pizzeria Roma`, robots: { index: false, follow: false }, referrer: 'no-referrer' as const }; }

export default async function ChangeEmailPage() {
  if (!customerAccountsEnabled()) notFound();
  const locale = await getSiteLocale(); const en = locale === 'en';
  return <main className="customer-page"><Link href="/compte">← {en ? 'My account' : 'Mon espace client'}</Link><h1>{en ? 'New email address' : 'Nouvelle adresse e-mail'}</h1><p>{en ? 'Confirm the link sent to your new address. You will then be signed out of your sessions.' : 'Confirmez le lien reçu à votre nouvelle adresse. Les sessions seront ensuite déconnectées.'}</p><EmailLinkForm changeEmail locale={locale} /></main>;
}
