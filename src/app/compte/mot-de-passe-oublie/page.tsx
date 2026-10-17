import Link from 'next/link';
import { notFound } from 'next/navigation';
import { customerAccountsEnabled } from '../../../lib/customer-accounts';
import { testOrdersEnabled } from '../../../lib/test-mode';
import EmailRequest from '../email-request';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mot de passe oublié | Pizzeria Roma', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Page() {
  if (!customerAccountsEnabled()) notFound();
  return <main className="customer-page"><Link href="/compte">← Mon espace client</Link><h1>Mot de passe oublié</h1><p>{testOrdersEnabled() ? 'Mode local : le message est capturé dans la boîte mail de test.' : 'Si cette adresse correspond à un compte, un lien de réinitialisation lui sera envoyé.'}</p><EmailRequest localMode={testOrdersEnabled()} /></main>;
}
