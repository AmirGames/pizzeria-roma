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
  if (!testOrdersEnabled() && !realOrdersEnabled()) return <main className="customer-page"><section className="customer-gate-card"><p className="eyebrow">PIZZERIA ROMA · NAMUR</p><h1>Espace client</h1><p>La création de comptes clients ouvrira avec les commandes en ligne. En attendant, découvrez la carte et contactez le restaurant pour toute question.</p><div className="customer-gate-actions"><Link className="customer-gate-link" href="/menu">Découvrir notre carte <span aria-hidden="true">→</span></Link><Link href="/contact">Contacter le restaurant</Link></div></section></main>;
  const user = await getCurrentUser();
  const params = await searchParams;
  if (!user) return <main className="customer-page customer-login-page"><Link className="customer-back-link" href="/menu">← Retour à la carte</Link><section className="customer-login-intro"><p className="eyebrow">PIZZERIA ROMA · NAMUR</p><h1>Mon espace client</h1>{params.compte === 'supprime' ? <p role="status">Votre compte a été supprimé. Certaines informations de commande peuvent être conservées sans coordonnées personnelles pour les obligations applicables.</p> : <p>{realOrdersEnabled() ? 'Connectez-vous pour suivre vos commandes, gérer vos adresses et retrouver vos avantages.' : 'Espace de démonstration : aucun achat réel ni paiement ne sera effectué.'}</p>}</section><AccountAccess returnTo={params.retour === 'commande' ? (realOrdersEnabled() ? '/commande' : '/commande/test') : '/compte'} testMode={testOrdersEnabled() && !realOrdersEnabled()} canRecover={customerMailConfigured()} />{params.retour === 'commande' && <Link className="customer-guest-link" href={realOrdersEnabled() ? '/commande' : '/commande/test'}>Continuer sans compte</Link>}</main>;
  if (user.role !== 'CUSTOMER') return <main className="customer-page customer-login-page"><section className="customer-session-card"><p className="eyebrow">PIZZERIA ROMA · ESPACE CLIENT</p><h1>Compte professionnel connecté</h1><p>Cette session sert à gérer le restaurant. Pour retrouver ou créer un compte client, déconnectez-vous : le formulaire client s’affichera ensuite.</p><div className="customer-session-actions"><SignOut /><Link href="/gerant">Ouvrir l’espace professionnel</Link></div></section></main>;
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
  const formatMoney = (cents: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  return <main className="customer-page customer-dashboard">
    <header className="customer-dashboard-header"><div><p className="eyebrow">PIZZERIA ROMA · ESPACE CLIENT</p><h1>Bonjour {user.name || 'et bienvenue'}</h1><p>{user.email}</p><span className={`customer-email-status ${user.emailVerified ? 'is-verified' : ''}`}>{user.emailVerified ? 'Adresse e-mail vérifiée' : 'Adresse e-mail non vérifiée'}</span></div><div className="customer-dashboard-actions">{realOrdersEnabled() && <Link className="customer-primary-action" href="/commande">Commander</Link>}{testOrdersEnabled() && <Link className="customer-primary-action" href="/commande/test">Passer une commande de test</Link>}<SignOut /></div></header>
    <nav className="customer-dashboard-nav" aria-label="Accès rapide au compte"><a href="#commandes">Mes commandes</a>{(realLoyalty || testLoyalty) && <a href="#fidelite">Ma fidélité</a>}{storeCredit && <a href="#avoir">Mon avoir</a>}<a href="#adresses">Mes adresses</a><a href="#parametres">Mes coordonnées</a></nav>
    {!user.emailVerified && customerMailConfigured() && <section className="customer-account-notice"><div><strong>Confirmez votre adresse e-mail</strong><p>La confirmation sécurise l’accès à votre compte et à vos commandes.</p></div><EmailRequest verify localMode={testOrdersEnabled()} /></section>}
    {!user.emailVerified && !customerMailConfigured() && <p className="customer-account-notice" role="status">Le service d’envoi d’e-mails n’est pas configuré. La vérification de l’adresse n’est pas disponible pour le moment.</p>}
    {customerMailConfigured() && <details className="customer-email-settings"><summary>Changer mon adresse e-mail</summary><EmailRequest changeEmail localMode={testOrdersEnabled()} /></details>}
    <section className="customer-overview" aria-label="Résumé du compte"><article><span>Commandes dans la liste</span><strong>{realOrderHistory.length + history.orders.length}</strong><small>Les essais sont affichés par pages</small></article><article><span>Récompenses disponibles</span><strong>{(realLoyalty?.rewardsAvailable ?? 0) + (testLoyalty?.rewardsAvailable ?? 0)}</strong><small>Après validation des commandes</small></article>{storeCredit && <article><span>Avoir disponible</span><strong>{formatMoney(storeCredit.balanceCents)}</strong><small>Utilisable au prochain checkout connecté</small></article>}</section>
    {(realLoyalty || testLoyalty) && <div id="fidelite" className="customer-loyalty-grid">{realLoyalty&&<LoyaltyCard id="real-loyalty-card-title" title="Fidélité — commandes réelles" description="Un plat offert après 10 pizzas ou pâtes payées et terminées." loyalty={realLoyalty} />}{testLoyalty&&<LoyaltyCard id="test-loyalty-card-title" title="Fidélité — essais" description="Les essais terminés sont comptés séparément des commandes réelles." loyalty={testLoyalty} />}</div>}
    {storeCredit&&<div id="avoir"><StoreCreditCard credit={storeCredit} /></div>}
    <section id="commandes" className="customer-dashboard-section"><div className="customer-section-heading"><div><p className="eyebrow">VOTRE ACTIVITÉ</p><h2>Mes commandes</h2></div>{realOrdersEnabled() && <Link href="/commande">Passer commande →</Link>}</div>{realOrdersEnabled()&&<RealOrderHistory orders={realOrderHistory} />}{testOrdersEnabled()&&<OrderHistory history={history} filters={filters} error={filterError} />}</section>
    <div id="adresses"><AddressBook initialAddresses={addresses} /></div>
    <div id="parametres"><ProfileSettings name={user.name ?? ''} phone={user.phone ?? ''} /></div>
  </main>;
}
