import Link from 'next/link';
import { getCurrentUser } from '../../lib/auth';
import { realOrdersEnabled, stripeReady } from '../../lib/real-orders';
import RealCheckout from './real-checkout';
import FulfillmentInfo from './fulfillment-info';
import { getStoreCredit } from '../../lib/store-credit';
import { listCustomerAddresses } from '../../lib/customer-addresses';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Commander | Pizzeria Roma', robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  if (!realOrdersEnabled()) return <FulfillmentInfo />;
  if (!stripeReady()) return <main className="customer-page"><h1>Les commandes en ligne ouvrent bientôt</h1><p>Le paiement Stripe du restaurant n’est pas encore configuré. Aucun paiement ne sera demandé.</p><Link href="/panier">Retour au panier</Link></main>;
  const user = await getCurrentUser();
  const customer = user?.role === 'CUSTOMER' ? user : null;
  const [storeCredit, savedAddresses] = customer
    ? await Promise.all([getStoreCredit(customer.id), listCustomerAddresses(customer.id)])
    : [null, []];
  return <main className="customer-page test-checkout-page"><Link href="/panier">← Panier</Link><h1>Finaliser la commande</h1><p>Les articles et leur prix sont recalculés depuis le catalogue avant le paiement.</p>{customer&&<p>Connecté en tant que {customer.email} · <Link href="/compte">Mon compte</Link></p>}{!customer&&<p><Link href="/compte?retour=commande">Se connecter ou créer un compte</Link> · vous pouvez aussi continuer en invité.</p>}<RealCheckout name={customer?.name??''} phone={customer?.phone??''} email={customer?.email??''} authenticated={!!customer} creditBalanceCents={storeCredit?.balanceCents??0} savedAddresses={savedAddresses.map(({ id, label, address, isDefault }) => ({ id, label, address, isDefault }))}/></main>;
}
