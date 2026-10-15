import Link from 'next/link';
import { notFound } from 'next/navigation';
import { testOrdersEnabled } from '../../../lib/test-mode';
import EmailLinkForm from '../email-link-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vérifier mon e-mail | Pizzeria Roma', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Page() {
  if (!testOrdersEnabled()) notFound();
  return <main className="customer-page"><Link href="/compte">← Mon espace client</Link><h1>Vérifier mon e-mail</h1><p>Mode local : les messages sont capturés dans la boîte mail de test.</p><EmailLinkForm /></main>;
}
