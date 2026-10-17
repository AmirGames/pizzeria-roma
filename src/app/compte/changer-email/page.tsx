import Link from 'next/link';
import { notFound } from 'next/navigation';
import { customerAccountsEnabled } from '../../../lib/customer-accounts';
import EmailLinkForm from '../email-link-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Confirmer une nouvelle adresse | Pizzeria Roma', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };

export default function ChangeEmailPage() {
  if (!customerAccountsEnabled()) notFound();
  return <main className="customer-page"><Link href="/compte">← Mon espace client</Link><h1>Nouvelle adresse e-mail</h1><p>Confirmez le lien reçu à votre nouvelle adresse. Les sessions seront ensuite déconnectées.</p><EmailLinkForm changeEmail /></main>;
}
