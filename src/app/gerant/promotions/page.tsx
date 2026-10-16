import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/db';
import { requirePermission } from '../../../lib/auth';
import PromotionEditor from './promotion-editor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Promotions | Pizzeria Roma', robots: { index: false, follow: false } };

export default async function ManagerPromotionsPage() {
  try { await requirePermission('catalog:write'); }
  catch (error) { if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error; redirect('/gerant/connexion'); }
  const promotions = await prisma.promotion.findMany({ orderBy: [{ kind: 'asc' }, { updatedAt: 'desc' }] });
  return <main className="manager-page"><p className="manager-eyebrow">OFFRES · ACQUISITION</p><h1>Promotions et codes promo</h1>
    <p className="manager-lede">Créez une réduction automatique ou un code à saisir au moment de la commande. Choisissez les dates, jours et heures de validité en heure de Bruxelles. Une seule promotion automatique peut être active à la fois ; une seule remise, la plus avantageuse, s’applique au panier.</p>
    <div className="manager-notice"><strong>Mode test</strong><span>Les remises sont appliquées aux commandes de test. Aucun paiement réel n’est activé.</span></div>
    <PromotionEditor initialPromotions={promotions} />
  </main>;
}
