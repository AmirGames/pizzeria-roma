import Link from 'next/link';
import { getCurrentUser } from '../../lib/auth';
import { testOrdersEnabled } from '../../lib/test-mode';
import AccountAccess from './account-access';
import SignOut from './sign-out';
import EmailRequest from './email-request';
import ProfileSettings from './profile-settings';
import AddressBook from './address-book';
import { listCustomerAddresses } from '../../lib/customer-addresses';
import { parseCustomerHistoryQuery } from '../../lib/customer-history.mjs';
import { listCustomerOrderHistory } from '../../lib/customer-order-history';
import OrderHistory from './order-history';
import { getCustomerLoyaltyStatus } from '../../lib/customer-loyalty';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mon espace client | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function CustomerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!testOrdersEnabled()) return <main className="customer-page"><h1>Espace client</h1><p>L’espace de test est désactivé.</p><Link href="/menu">Voir la carte</Link></main>;
  const user = await getCurrentUser();
  const params = await searchParams;
  if (!user) return <main className="customer-page"><Link href="/menu">← La carte</Link><h1>Mon espace client</h1><p>Mode test : aucune commande réelle ni aucun paiement.</p><AccountAccess returnTo={params.retour === 'commande' ? '/commande/test' : '/compte'} /></main>;
  if (user.role !== 'CUSTOMER') return <main className="customer-page"><h1>Session professionnelle</h1><p>Utilisez un compte client distinct pour tester le parcours d’achat.</p><SignOut /><Link href="/gerant/commandes-test">Commandes de test</Link></main>;
  let filters = parseCustomerHistoryQuery();
  let filterError: string | undefined;
  try { filters = parseCustomerHistoryQuery(params); }
  catch { filterError = 'Filtres invalides : utilisez une référence de 64 caractères maximum (lettres, chiffres et tirets) et un statut proposé. L’historique complet est affiché.'; }
  const history = await listCustomerOrderHistory(user.id, filters);
  const addresses = await listCustomerAddresses(user.id);
  const loyalty = await getCustomerLoyaltyStatus(user.id);
  return <main className="customer-page"><Link href="/menu">← La carte</Link><h1>Bonjour {user.name}</h1><p>{user.email}</p><p>{user.emailVerified ? 'Adresse e-mail vérifiée' : 'Adresse e-mail non vérifiée'}</p>{!user.emailVerified && <EmailRequest verify />}<p>Mode test : aucun achat réel. Retrouvez vos essais dans l’historique ci-dessous.</p><div className="customer-actions"><Link href="/commande/test">Passer une commande de test</Link><SignOut /></div><section className="customer-loyalty" aria-labelledby="loyalty-card-title"><h2 id="loyalty-card-title">Carte de fidélité</h2><p>1 plat offert après 10 pizzas ou pâtes terminées.</p><ol aria-label={`${loyalty.progress} plats validés sur 10`}>{Array.from({ length: 10 }, (_, index) => <li key={index} className={index < loyalty.progress ? 'stamped' : ''}>{index < loyalty.progress ? '✓' : index + 1}</li>)}</ol><p><strong>{loyalty.progress}/10 plats</strong>{loyalty.rewardsAvailable > 0 ? ` · ${loyalty.rewardsAvailable} plat(s) offert(s) disponible(s)` : loyalty.rewardsReserved > 0 ? ' · Une récompense est réservée sur une commande en cours.' : ''}</p></section><ProfileSettings name={user.name ?? ''} phone={user.phone ?? ''} /><AddressBook initialAddresses={addresses} /><OrderHistory history={history} filters={filters} error={filterError} />
  </main>;
}
