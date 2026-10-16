'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/gerant', label: 'Tableau de bord' },
  { href: '/gerant/carte', label: 'La carte' },
  { href: '/gerant/promotions', label: 'Promotions' },
  { href: '/gerant/livraison', label: 'Livraison' },
  { href: '/gerant/commandes-test', label: 'Commandes' },
];

export default function ManagerNavigation() {
  const pathname = usePathname();
  return <header className="manager-header">
    <Link className="manager-brand" href="/gerant"><span>PIZZERIA</span><strong>ROMA</strong><small>ESPACE GÉRANT</small></Link>
    <nav className="manager-nav" aria-label="Navigation gérant">
      {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</Link>)}
    </nav>
    <Link className="manager-store-link" href="/menu">Voir la boutique ↗</Link>
  </header>;
}
