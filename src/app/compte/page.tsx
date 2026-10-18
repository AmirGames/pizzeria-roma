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
import { getSiteLocale } from '../../lib/locale';
import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> { const en = (await getSiteLocale()) === 'en'; return { title: `${en ? 'My customer account' : 'Mon espace client'} | Pizzeria Roma`, robots: { index: false, follow: false } }; }
function LoyaltyCard({ id, title, description, loyalty, locale }: { id: string; title: string; description: string; loyalty: Awaited<ReturnType<typeof getCustomerLoyaltyStatus>>; locale: 'fr' | 'en' }) {
  const en = locale === 'en';
  return <section className="customer-loyalty" aria-labelledby={id}><h2 id={id}>{title}</h2><p>{description}</p><ol aria-label={en ? `${loyalty.progress} dishes stamped out of 10` : `${loyalty.progress} plats validés sur 10`}>{Array.from({ length: 10 }, (_, index) => <li key={index} className={index < loyalty.progress ? 'stamped' : ''}>{index < loyalty.progress ? '✓' : index + 1}</li>)}</ol><p><strong>{loyalty.progress}/10 {en ? 'dishes' : 'plats'}</strong>{loyalty.rewardsAvailable > 0 ? ` · ${loyalty.rewardsAvailable} ${en ? 'free item(s) available' : 'plat(s) offert(s) disponible(s)'}` : loyalty.rewardsReserved > 0 ? (en ? ' · A reward is reserved on an active order.' : ' · Une récompense est réservée sur une commande en cours.') : ''}</p></section>;
}
export default async function CustomerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getSiteLocale();
  const en = locale === 'en';
  if (!testOrdersEnabled() && !realOrdersEnabled()) return <main className="customer-page"><section className="customer-gate-card"><p className="eyebrow">PIZZERIA ROMA · NAMUR</p><h1>{en ? 'Customer account' : 'Espace client'}</h1><p>{en ? 'Customer accounts will open when online ordering is available. In the meantime, browse the menu or contact the restaurant.' : 'La création de comptes clients ouvrira avec les commandes en ligne. En attendant, découvrez la carte et contactez le restaurant pour toute question.'}</p><div className="customer-gate-actions"><Link className="customer-gate-link" href="/menu">{en ? 'Explore our menu' : 'Découvrir notre carte'} <span aria-hidden="true">→</span></Link><Link href="/contact">{en ? 'Contact the restaurant' : 'Contacter le restaurant'}</Link></div></section></main>;
  const user = await getCurrentUser();
  const params = await searchParams;
  if (!user) return <main className="customer-page customer-login-page"><Link className="customer-back-link" href="/menu">← {en ? 'Back to menu' : 'Retour à la carte'}</Link><section className="customer-login-intro"><p className="eyebrow">PIZZERIA ROMA · NAMUR</p><h1>{en ? 'My customer account' : 'Mon espace client'}</h1>{params.compte === 'supprime' ? <p role="status">{en ? 'Your account has been deleted. Some order information may be retained without personal details where required.' : 'Votre compte a été supprimé. Certaines informations de commande peuvent être conservées sans coordonnées personnelles pour les obligations applicables.'}</p> : <p>{realOrdersEnabled() ? (en ? 'Sign in to follow your orders, manage addresses and view your rewards.' : 'Connectez-vous pour suivre vos commandes, gérer vos adresses et retrouver vos avantages.') : (en ? 'Demo mode: no real purchase or payment will be made.' : 'Espace de démonstration : aucun achat réel ni paiement ne sera effectué.')}</p>}</section><AccountAccess returnTo={params.retour === 'commande' ? (realOrdersEnabled() ? '/commande' : '/commande/test') : '/compte'} testMode={testOrdersEnabled() && !realOrdersEnabled()} canRecover={customerMailConfigured()} locale={locale} />{params.retour === 'commande' && <Link className="customer-guest-link" href={realOrdersEnabled() ? '/commande' : '/commande/test'}>{en ? 'Continue without an account' : 'Continuer sans compte'}</Link>}</main>;
  if (user.role !== 'CUSTOMER') return <main className="customer-page customer-login-page"><section className="customer-session-card"><p className="eyebrow">PIZZERIA ROMA · {en ? 'CUSTOMER ACCOUNT' : 'ESPACE CLIENT'}</p><h1>{en ? 'Manager account signed in' : 'Compte professionnel connecté'}</h1><p>{en ? 'This session manages the restaurant. To access a customer account, sign out and the customer form will appear.' : 'Cette session sert à gérer le restaurant. Pour retrouver ou créer un compte client, déconnectez-vous : le formulaire client s’affichera ensuite.'}</p><div className="customer-session-actions"><SignOut locale={locale} /><Link href="/gerant">{en ? 'Open manager area' : 'Ouvrir l’espace professionnel'}</Link></div></section></main>;
  if (params.retour === 'commande') redirect(realOrdersEnabled() ? '/commande' : '/commande/test');
  let filters = parseCustomerHistoryQuery();
  let filterError: string | undefined;
  try { filters = parseCustomerHistoryQuery(params); }
  catch { filterError = en ? 'Invalid filters: use a reference of up to 64 letters, numbers or hyphens and a listed status. The full history is shown.' : 'Filtres invalides : utilisez une référence de 64 caractères maximum (lettres, chiffres et tirets) et un statut proposé. L’historique complet est affiché.'; }
  const history = await listCustomerOrderHistory(user.id, filters);
  const realOrderHistory = realOrdersEnabled() ? await listCustomerRealOrders(user.id) : [];
  const storeCredit = realOrdersEnabled() ? await getStoreCredit(user.id) : null;
  const addresses = await listCustomerAddresses(user.id);
  const testLoyalty = testOrdersEnabled() ? await getCustomerLoyaltyStatus(user.id) : null;
  const realLoyalty = realOrdersEnabled() ? await getCustomerRealLoyaltyStatus(user.id) : null;
  const formatMoney = (cents: number) => new Intl.NumberFormat(en ? 'en-BE' : 'fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  return <main className="customer-page customer-dashboard">
    <header className="customer-dashboard-header"><div><p className="eyebrow">PIZZERIA ROMA · {en ? 'CUSTOMER ACCOUNT' : 'ESPACE CLIENT'}</p><h1>{en ? `Hello ${user.name || 'and welcome'}` : `Bonjour ${user.name || 'et bienvenue'}`}</h1><p>{user.email}</p><span className={`customer-email-status ${user.emailVerified ? 'is-verified' : ''}`}>{user.emailVerified ? (en ? 'Email address verified' : 'Adresse e-mail vérifiée') : (en ? 'Email address not verified' : 'Adresse e-mail non vérifiée')}</span></div><div className="customer-dashboard-actions">{realOrdersEnabled() && <Link className="customer-primary-action" href="/commande">{en ? 'Order now' : 'Commander'}</Link>}{testOrdersEnabled() && <Link className="customer-primary-action" href="/commande/test">{en ? 'Place a test order' : 'Passer une commande de test'}</Link>}<SignOut locale={locale} /></div></header>
    <nav className="customer-dashboard-nav" aria-label={en ? 'Account quick links' : 'Accès rapide au compte'}><a href="#commandes">{en ? 'My orders' : 'Mes commandes'}</a>{(realLoyalty || testLoyalty) && <a href="#fidelite">{en ? 'My rewards' : 'Ma fidélité'}</a>}{storeCredit && <a href="#avoir">{en ? 'Store credit' : 'Mon avoir'}</a>}<a href="#adresses">{en ? 'My addresses' : 'Mes adresses'}</a><a href="#parametres">{en ? 'My details' : 'Mes coordonnées'}</a></nav>
    {!user.emailVerified && customerMailConfigured() && <section className="customer-account-notice"><div><strong>{en ? 'Verify your email address' : 'Confirmez votre adresse e-mail'}</strong><p>{en ? 'Verification protects access to your account and orders.' : 'La confirmation sécurise l’accès à votre compte et à vos commandes.'}</p></div><EmailRequest verify localMode={testOrdersEnabled()} locale={locale} /></section>}
    {!user.emailVerified && !customerMailConfigured() && <p className="customer-account-notice" role="status">{en ? 'Email sending is not configured. Email verification is currently unavailable.' : 'Le service d’envoi d’e-mails n’est pas configuré. La vérification de l’adresse n’est pas disponible pour le moment.'}</p>}
    {customerMailConfigured() && <details className="customer-email-settings"><summary>{en ? 'Change my email address' : 'Changer mon adresse e-mail'}</summary><EmailRequest changeEmail localMode={testOrdersEnabled()} locale={locale} /></details>}
    <section className="customer-overview" aria-label={en ? 'Account overview' : 'Résumé du compte'}><article><span>{en ? 'Orders listed' : 'Commandes dans la liste'}</span><strong>{realOrderHistory.length + history.orders.length}</strong><small>{en ? 'Test orders are shown in pages' : 'Les essais sont affichés par pages'}</small></article><article><span>{en ? 'Rewards available' : 'Récompenses disponibles'}</span><strong>{(realLoyalty?.rewardsAvailable ?? 0) + (testLoyalty?.rewardsAvailable ?? 0)}</strong><small>{en ? 'After completed orders' : 'Après validation des commandes'}</small></article>{storeCredit && <article><span>{en ? 'Store credit available' : 'Avoir disponible'}</span><strong>{formatMoney(storeCredit.balanceCents)}</strong><small>{en ? 'Use at checkout when signed in' : 'Utilisable au prochain checkout connecté'}</small></article>}</section>
    {(realLoyalty || testLoyalty) && <div id="fidelite" className="customer-loyalty-grid">{realLoyalty&&<LoyaltyCard id="real-loyalty-card-title" title={en ? 'Rewards — real orders' : 'Fidélité — commandes réelles'} description={en ? 'One free item after 10 paid and completed pizzas or pasta dishes.' : 'Un plat offert après 10 pizzas ou pâtes payées et terminées.'} loyalty={realLoyalty} locale={locale} />}{testLoyalty&&<LoyaltyCard id="test-loyalty-card-title" title={en ? 'Rewards — test orders' : 'Fidélité — essais'} description={en ? 'Completed test orders are counted separately from real orders.' : 'Les essais terminés sont comptés séparément des commandes réelles.'} loyalty={testLoyalty} locale={locale} />}</div>}
    {storeCredit&&<div id="avoir"><StoreCreditCard credit={storeCredit} locale={locale} /></div>}
    <section id="commandes" className="customer-dashboard-section"><div className="customer-section-heading"><div><p className="eyebrow">{en ? 'YOUR ACTIVITY' : 'VOTRE ACTIVITÉ'}</p><h2>{en ? 'My orders' : 'Mes commandes'}</h2></div>{realOrdersEnabled() && <Link href="/commande">{en ? 'Place an order →' : 'Passer commande →'}</Link>}</div>{realOrdersEnabled()&&<RealOrderHistory orders={realOrderHistory} locale={locale} />}{testOrdersEnabled()&&<OrderHistory history={history} filters={filters} error={filterError} locale={locale} />}</section>
    <div id="adresses"><AddressBook initialAddresses={addresses} realOrdersEnabled={realOrdersEnabled()} locale={locale} /></div>
    <div id="parametres"><ProfileSettings name={user.name ?? ''} phone={user.phone ?? ''} locale={locale} /></div>
  </main>;
}
