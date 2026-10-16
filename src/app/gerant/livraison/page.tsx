import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/db';
import { requirePermission } from '../../../lib/auth';
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
<<<<<<< Updated upstream
  return <main className="manager-page"><p className="manager-eyebrow">RÉGLAGES · LOGISTIQUE</p><h1>Livraison et créneaux</h1>
    <p className="manager-lede">Configurez les horaires et les zones disponibles pour la boutique.</p><div className="manager-notice"><strong>Mode test</strong><span>La prise de commande reste en mode test. Aucun paiement n’est activé.</span></div>
=======
  return <main className="manager-page"><nav aria-label="Navigation gérant"><Link href="/gerant">Tableau de bord</Link><Link href="/gerant/carte">Gérer la carte</Link><Link href="/gerant/commandes-test">Commandes de test</Link></nav><h1>Livraison et créneaux</h1>
    <p>La prise de commande reste en mode test. Aucune commande réelle ni aucun paiement n’est activé.</p>
>>>>>>> Stashed changes
    <DeliverySettings initialConfig={config} initialZones={zones as unknown as Array<{ zoneId: string; geometry: { type: 'Polygon'; coordinates: [number, number][][] }; revision: number }>} />
  </main>;
}
