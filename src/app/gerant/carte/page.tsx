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
    return <main className="manager-page"><p className="manager-eyebrow">PIZZERIA ROMA · ESPACE PROFESSIONNEL</p><h1>Espace gérant</h1><p>Une session gérant est nécessaire pour gérer la carte. Utilisez votre lien privé de connexion.</p><Link className="manager-button-link" href="/gerant/connexion">Se connecter</Link></main>;
  }
  try {
    const categories = await prisma.menuCategory.findMany({ orderBy: [{ position: 'asc' }, { nameFr: 'asc' }] });
    const ingredients = await prisma.ingredient.findMany({ orderBy: { nameFr: 'asc' } });
    const products = await prisma.product.findMany({ orderBy: [{ categoryId: 'asc' }, { nameFr: 'asc' }], include: { category: true, sizes: { orderBy: { priceCents: 'asc' } }, extras: { orderBy: { nameFr: 'asc' } } } });
    return <main className="manager-page"><p className="manager-eyebrow">MENU · PRODUITS ET PRIX</p><h1>Gérer la carte</h1><p className="manager-lede">Gérez les catégories, le catalogue central d’ingrédients et les plats.</p><CatalogEditor initialProducts={products} initialCategories={categories} initialIngredients={ingredients} /></main>;
  } catch { return <main className="manager-page"><p className="manager-eyebrow">MENU · PRODUITS ET PRIX</p><h1>Gérer la carte</h1><p role="alert">La carte est indisponible pour le moment. Réessayez plus tard.</p></main>; }
}
