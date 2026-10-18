import Link from 'next/link';
import { getCurrentUser } from '../../lib/auth';
import { realOrdersEnabled, stripeReady } from '../../lib/real-orders';
import RealCheckout from './real-checkout';
import FulfillmentInfo from './fulfillment-info';
import { getStoreCredit } from '../../lib/store-credit';
import { listCustomerAddresses } from '../../lib/customer-addresses';
import { getSiteLocale } from '../../lib/locale';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  const en = (await getSiteLocale()) === 'en';
  return {
    title: `${en ? 'Place an order' : 'Commander'} | Pizzeria Roma`,
    description: en ? 'Choose delivery or collection and complete your Pizzeria Roma order.' : 'Choisissez la livraison ou le retrait et finalisez votre commande Pizzeria Roma.',
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage() {
  const locale = await getSiteLocale();
  const en = locale === 'en';
  if (!realOrdersEnabled()) return <FulfillmentInfo locale={locale} />;
  if (!stripeReady()) return <main className="customer-page"><h1>{en ? 'Online ordering is coming soon' : 'Les commandes en ligne ouvrent bientôt'}</h1><p>{en ? 'The restaurant’s Stripe payment is not configured yet. No payment will be requested.' : 'Le paiement Stripe du restaurant n’est pas encore configuré. Aucun paiement ne sera demandé.'}</p><Link href="/panier">{en ? 'Back to cart' : 'Retour au panier'}</Link></main>;
  const user = await getCurrentUser();
  const customer = user?.role === 'CUSTOMER' ? user : null;
  const [storeCredit, savedAddresses] = customer
    ? await Promise.all([getStoreCredit(customer.id), listCustomerAddresses(customer.id)])
    : [null, []];
  return <main className="customer-page test-checkout-page"><Link href="/panier">← {en ? 'Cart' : 'Panier'}</Link><h1>{en ? 'Complete your order' : 'Finaliser la commande'}</h1><p>{en ? 'Items and prices are recalculated from the menu before payment.' : 'Les articles et leur prix sont recalculés depuis le catalogue avant le paiement.'}</p>{customer&&<p>{en ? 'Signed in as' : 'Connecté en tant que'} {customer.email} · <Link href="/compte">{en ? 'My account' : 'Mon compte'}</Link></p>}{!customer&&<p><Link href="/compte?retour=commande">{en ? 'Sign in or create an account' : 'Se connecter ou créer un compte'}</Link> · {en ? 'you can also continue as a guest.' : 'vous pouvez aussi continuer en invité.'}</p>}<RealCheckout name={customer?.name??''} phone={customer?.phone??''} email={customer?.email??''} authenticated={!!customer} creditBalanceCents={storeCredit?.balanceCents??0} savedAddresses={savedAddresses.map(({ id, label, address, isDefault }) => ({ id, label, address, isDefault }))} locale={locale}/></main>;
}
