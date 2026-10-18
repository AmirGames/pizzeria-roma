import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePermission } from '../../../lib/auth';
import { getHomePageContent } from '../../../lib/homepage-content';
import HomepageEditor from './homepage-editor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Modifier la page d’accueil | Pizzeria Roma', robots: { index: false, follow: false } };

export default async function ManagerHomepagePage() {
  try { await requirePermission('homepage:write'); }
  catch (error) { if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error; redirect('/gerant/connexion'); }
  const content = await getHomePageContent();
  return <main className="manager-page"><p className="manager-eyebrow">ESPACE GÉRANT · CONTENU DU SITE</p><h1>Modifier la page d’accueil</h1>
    <p className="manager-lede">Changez les textes et l’image depuis cet écran. Les changements sont publiés en cliquant sur « Enregistrer et publier ».</p>
    <nav className="manager-shortcuts" aria-label="Raccourcis gérant"><Link href="/gerant">Tableau de bord</Link><Link href="/gerant/carte">Gérer la carte</Link><Link href="/">Voir le site</Link></nav>
    <HomepageEditor initialContent={content} />
  </main>;
}
