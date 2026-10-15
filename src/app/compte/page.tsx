import Link from 'next/link';
import { getCurrentUser } from '../../lib/auth';
import { prisma } from '../../lib/db';
import { testOrdersEnabled } from '../../lib/test-mode';
import { TEST_STATUS_LABELS } from '../../lib/test-order-policy.mjs';
import AccountAccess from './account-access';
import SignOut from './sign-out';
import ProfileSettings from './profile-settings';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mon espace client | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function CustomerPage({ searchParams }: { searchParams: Promise<{ retour?: string }> }) {
  if (!testOrdersEnabled()) return <main className="customer-page"><h1>Espace client</h1><p>L’espace de test est désactivé.</p><Link href="/menu">Voir la carte</Link></main>;
  const user = await getCurrentUser();
  const params = await searchParams;
  if (!user) return <main className="customer-page"><Link href="/menu">← La carte</Link><h1>Mon espace client</h1><p>Mode test : aucune commande réelle ni aucun paiement.</p><AccountAccess returnTo={params.retour === 'commande' ? '/commande/test' : '/compte'} /></main>;
  if (user.role !== 'CUSTOMER') return <main className="customer-page"><h1>Session professionnelle</h1><p>Utilisez un compte client distinct pour tester le parcours d’achat.</p><SignOut /><Link href="/gerant/commandes-test">Commandes de test</Link></main>;
  const orders = await prisma.testOrder.findMany({ where: { userId: user.id }, orderBy: { placedAt: 'desc' }, take: 50 });
  return <main className="customer-page"><Link href="/menu">← La carte</Link><h1>Bonjour {user.name}</h1><p>{user.email}</p><p>Mode test : aucun achat réel. Les 50 derniers essais sont affichés.</p><div className="customer-actions"><Link href="/commande/test">Passer une commande de test</Link><SignOut /></div><ProfileSettings name={user.name ?? ''} phone={user.phone ?? ''} /><h2>Mes commandes de test</h2>
    {!orders.length ? <p>Vous n’avez pas encore de commande de test.</p> : <ul className="customer-orders">{orders.map(order => <li key={order.id}><Link href={`/compte/commandes/${order.id}`}>{order.publicReference}</Link><p>{TEST_STATUS_LABELS[order.status]} · {new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(order.totalCents / 100)} · {order.placedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })}</p></li>)}</ul>}
  </main>;
}
