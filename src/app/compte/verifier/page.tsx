import Link from 'next/link';
import { notFound } from 'next/navigation';
import { customerAccountsEnabled } from '../../../lib/customer-accounts';
import EmailLinkForm from '../email-link-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vérifier mon e-mail | Pizzeria Roma', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Page() {
  if (!customerAccountsEnabled()) notFound();
  return <main className="customer-page"><Link href="/compte">← Mon espace client</Link><h1>Vérifier mon e-mail</h1><p>Ouvrez le lien reçu par e-mail pour confirmer l’adresse de votre compte.</p><EmailLinkForm /></main>;
}
