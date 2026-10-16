import Link from 'next/link';
import { notFound } from 'next/navigation';
import { testOrdersEnabled } from '../../../lib/test-mode';
import EmailLinkForm from '../email-link-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Confirmer une nouvelle adresse | Pizzeria Roma', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };

export default function ChangeEmailPage() {
  if (!testOrdersEnabled()) notFound();
  return <main className="customer-page"><Link href="/compte">← Mon espace client</Link><h1>Nouvelle adresse e-mail</h1><p>Confirmez le lien reçu dans la boîte mail de test. Les sessions seront ensuite déconnectées.</p><EmailLinkForm changeEmail /></main>;
}
