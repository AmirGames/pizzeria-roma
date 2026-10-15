import Link from 'next/link';
import { prisma } from '../../../lib/db';
import { requirePermission } from '../../../lib/auth';
import CatalogEditor from './catalog-editor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Gestion de la carte | Pizzeria Roma', robots: { index: false, follow: false } };

export default async function ManagerCatalogPage() {
  try { await requirePermission('catalog:write'); }
  catch (error) {
    if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error;
    return <main className="manager-page"><h1>Espace gérant</h1><p>Une session gérant est nécessaire pour gérer la carte. Utilisez votre lien privé de connexion.</p><Link href="/gerant/connexion">Se connecter</Link></main>;
  }
  try {
    const pizzaCategories = await prisma.menuCategory.findMany({ where: { fulfillmentCategory: 'PIZZA' }, select: { id: true, nameFr: true }, orderBy: { position: 'asc' } });
    const products = await prisma.product.findMany({ orderBy: [{ categoryId: 'asc' }, { nameFr: 'asc' }], include: { category: true, sizes: { orderBy: { priceCents: 'asc' } }, extras: { orderBy: { nameFr: 'asc' } } } });
    return <main className="manager-page"><Link href="/menu">← Voir la carte</Link><Link href="/gerant">Tableau de bord gérant</Link><Link href="/gerant/commandes-test">Commandes de test</Link><h1>Gérer la carte</h1><p>Modifiez les prix, les disponibilités et les options. Les changements enregistrés sont publiés sur la carte.</p><CatalogEditor initialProducts={products} pizzaCategories={pizzaCategories} /></main>;
  } catch { return <main className="manager-page"><Link href="/gerant">Tableau de bord gérant</Link><Link href="/gerant/commandes-test">Commandes de test</Link><h1>Gérer la carte</h1><p role="alert">La carte est indisponible pour le moment. Réessayez plus tard.</p></main>; }
}
