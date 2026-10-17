import Link from 'next/link';
import { notFound } from 'next/navigation';
import { customerAccountsEnabled } from '../../../lib/customer-accounts';
import EmailLinkForm from '../email-link-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Réinitialiser mon mot de passe | Pizzeria Roma', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Page() {
  if (!customerAccountsEnabled()) notFound();
  return <main className="customer-page"><Link href="/compte">← Mon espace client</Link><h1>Réinitialiser mon mot de passe</h1><p>Utilisez le lien reçu par e-mail pour choisir un nouveau mot de passe.</p><EmailLinkForm reset /></main>;
}
