import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/auth';
import { realOrdersEnabled } from '../../lib/real-orders';
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
import { getCustomerLoyaltyStatus, getCustomerRealLoyaltyStatus } from '../../lib/customer-loyalty';
import { listCustomerRealOrders } from '../../lib/customer-real-orders';
import RealOrderHistory from './real-order-history';
import { getStoreCredit } from '../../lib/store-credit';
import StoreCreditCard from './store-credit-card';
import { customerMailConfigured } from '../../lib/local-customer-mail';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mon espace client | Pizzeria Roma', robots: { index: false, follow: false } };
function LoyaltyCard({ id, title, description, loyalty }: { id: string; title: string; description: string; loyalty: Awaited<ReturnType<typeof getCustomerLoyaltyStatus>> }) {
  return <section className="customer-loyalty" aria-labelledby={id}><h2 id={id}>{title}</h2><p>{description}</p><ol aria-label={`${loyalty.progress} plats validés sur 10`}>{Array.from({ length: 10 }, (_, index) => <li key={index} className={index < loyalty.progress ? 'stamped' : ''}>{index < loyalty.progress ? '✓' : index + 1}</li>)}</ol><p><strong>{loyalty.progress}/10 plats</strong>{loyalty.rewardsAvailable > 0 ? ` · ${loyalty.rewardsAvailable} plat(s) offert(s) disponible(s)` : loyalty.rewardsReserved > 0 ? ' · Une récompense est réservée sur une commande en cours.' : ''}</p></section>;
}
export default async function CustomerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!testOrdersEnabled() && !realOrdersEnabled()) return <main className="customer-page"><section className="customer-gate-card"><p className="eyebrow">PIZZERIA ROMA · NAMUR</p><h1>Espace client</h1><p>L’espace client est en préparation. Vous pourrez bientôt retrouver ici vos coordonnées et le suivi de vos commandes.</p><Link className="customer-gate-link" href="/menu">Découvrir notre carte <span aria-hidden="true">→</span></Link></section></main>;
  const user = await getCurrentUser();
  const params = await searchParams;
  if (!user) return <main className="customer-page customer-login-page"><Link href="/menu">← La carte</Link><h1>Mon espace client</h1>{params.compte === 'supprime' ? <p role="status">Votre compte a été supprimé. Certaines informations de commande peuvent être conservées sans coordonnées personnelles pour les obligations applicables.</p> : <p>{realOrdersEnabled() ? 'Connectez-vous pour retrouver vos commandes, ou revenez au checkout pour continuer en invité.' : 'Mode test : aucune commande réelle ni aucun paiement.'}</p>}<AccountAccess returnTo={params.retour === 'commande' ? (realOrdersEnabled() ? '/commande' : '/commande/test') : '/compte'} testMode={testOrdersEnabled() && !realOrdersEnabled()} canRecover={customerMailConfigured()} /></main>;
  if (user.role !== 'CUSTOMER') return <main className="customer-page"><h1>Session professionnelle</h1><p>Utilisez un compte client distinct pour tester le parcours d’achat.</p><SignOut /><Link href="/gerant/commandes-test">Commandes de test</Link></main>;
  if (params.retour === 'commande') redirect(realOrdersEnabled() ? '/commande' : '/commande/test');
  let filters = parseCustomerHistoryQuery();
  let filterError: string | undefined;
  try { filters = parseCustomerHistoryQuery(params); }
  catch { filterError = 'Filtres invalides : utilisez une référence de 64 caractères maximum (lettres, chiffres et tirets) et un statut proposé. L’historique complet est affiché.'; }
  const history = await listCustomerOrderHistory(user.id, filters);
  const realOrderHistory = realOrdersEnabled() ? await listCustomerRealOrders(user.id) : [];
  const storeCredit = realOrdersEnabled() ? await getStoreCredit(user.id) : null;
  const addresses = await listCustomerAddresses(user.id);
  const testLoyalty = testOrdersEnabled() ? await getCustomerLoyaltyStatus(user.id) : null;
  const realLoyalty = realOrdersEnabled() ? await getCustomerRealLoyaltyStatus(user.id) : null;
  return <main className="customer-page"><Link href="/menu">← La carte</Link><h1>Bonjour {user.name}</h1><p>{user.email}</p><p>{user.emailVerified ? 'Adresse e-mail vérifiée' : 'Adresse e-mail non vérifiée'}</p>{!user.emailVerified && customerMailConfigured() && <EmailRequest verify localMode={testOrdersEnabled()} />}{!user.emailVerified && !customerMailConfigured() && <p>Le service d’envoi d’e-mails n’est pas configuré pour le moment.</p>}{customerMailConfigured() && <EmailRequest changeEmail localMode={testOrdersEnabled()} />}<p>{realOrdersEnabled() ? 'Retrouvez ici votre compte et le suivi de vos achats.' : 'Mode test : aucun achat réel. Retrouvez vos essais dans l’historique ci-dessous.'}</p><div className="customer-actions">{realOrdersEnabled()&&<Link href="/commande">Commander</Link>}{testOrdersEnabled()&&<Link href="/commande/test">Passer une commande de test</Link>}<SignOut /></div>{realLoyalty&&<LoyaltyCard id="real-loyalty-card-title" title="Fidélité — commandes réelles" description="Un plat offert après 10 pizzas ou pâtes payées et terminées." loyalty={realLoyalty} />}{testLoyalty&&<LoyaltyCard id="test-loyalty-card-title" title="Fidélité — essais" description="Les essais terminés sont comptés séparément des commandes réelles." loyalty={testLoyalty} />}{storeCredit&&<StoreCreditCard credit={storeCredit} />}<ProfileSettings name={user.name ?? ''} phone={user.phone ?? ''} /><AddressBook initialAddresses={addresses} />{realOrdersEnabled()&&<RealOrderHistory orders={realOrderHistory} />}{testOrdersEnabled()&&<OrderHistory history={history} filters={filters} error={filterError} />}
  </main>;
}
