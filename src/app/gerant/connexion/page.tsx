import Link from 'next/link';
import ManagerLogin from './manager-login';
export const metadata = { title: 'Connexion gérant | Pizzeria Roma', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function ManagerLoginPage() {
  return <main className="manager-page"><p className="manager-eyebrow">PIZZERIA ROMA · ESPACE PROFESSIONNEL</p><h1>Connexion gérant</h1><p className="manager-lede">Utilisez votre lien privé de connexion. Il est valable 15 minutes et ne peut servir qu’une fois.</p><ManagerLogin /><Link href="/menu">Retour à la boutique</Link></main>;
}
