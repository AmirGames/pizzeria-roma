import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/db';
import { requirePermission } from '../../../lib/auth';
import { realOrdersEnabled, stripeReady } from '../../../lib/real-orders';
import { testOrdersEnabled } from '../../../lib/test-mode';
import DeliverySettings from './delivery-settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Livraison et créneaux | Pizzeria Roma', robots: { index: false, follow: false } };

export default async function ManagerDeliveryPage() {
  try { await requirePermission('delivery:write'); }
  catch (error) { if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error; redirect('/gerant/connexion'); }
  const [config, zones] = await Promise.all([
    prisma.deliveryConfiguration.findUnique({ where: { id: 'global' } }),
    prisma.deliveryZoneBoundary.findMany(),
  ]);
  if (!config) throw new Error('DELIVERY_CONFIGURATION_MISSING');
  return <main className="manager-page"><p className="manager-eyebrow">RÉGLAGES · LOGISTIQUE</p><h1>Livraison et créneaux</h1>
    <p className="manager-lede">Configurez les horaires et les zones disponibles pour la boutique.</p><div className="manager-notice">{realOrdersEnabled() ? <><strong>{stripeReady() ? 'Commandes réelles configurées' : 'Paiement à configurer'}</strong><span>{stripeReady() ? 'Les horaires, zones et capacités définis ici sont utilisés pour les vraies commandes.' : 'Les réglages sont enregistrés, mais le checkout reste fermé tant que Stripe n’est pas configuré.'}</span></> : testOrdersEnabled() ? <><strong>Mode test</strong><span>Ces réglages servent aux simulations ; les clients ne peuvent pas encore passer de commande réelle.</span></> : <><strong>Commandes désactivées</strong><span>Les réglages sont enregistrés. Activez les commandes et configurez le paiement pour ouvrir le checkout.</span></>}</div>
    <DeliverySettings initialConfig={config} initialZones={zones as unknown as Array<{ zoneId: string; geometry: { type: 'Polygon'; coordinates: [number, number][][] }; revision: number }>} />
  </main>;
}
