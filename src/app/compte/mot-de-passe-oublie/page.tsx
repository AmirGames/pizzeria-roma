import Link from 'next/link';
import { notFound } from 'next/navigation';
import { testOrdersEnabled } from '../../../lib/test-mode';
import EmailRequest from '../email-request';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mot de passe oublié | Pizzeria Roma', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Page() {
  if (!testOrdersEnabled()) notFound();
  return <main className="customer-page"><Link href="/compte">← Mon espace client</Link><h1>Mot de passe oublié</h1><p>Mode local : les messages sont capturés dans la boîte mail de test.</p><EmailRequest /></main>;
}
