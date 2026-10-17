'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/gerant', label: 'Tableau de bord' },
  { href: '/gerant/carte', label: 'La carte' },
  { href: '/gerant/promotions', label: 'Promotions' },
  { href: '/gerant/livraison', label: 'Livraison' },
  { href: '/gerant/commandes', label: 'Commandes réelles' },
  { href: '/gerant/commandes-test', label: 'Essais' },
];

export default function ManagerNavigation({ showRealOrders, showTestOrders }: { showRealOrders: boolean; showTestOrders: boolean }) {
  const pathname = usePathname();
  const visibleLinks = links.filter(link => link.href !== '/gerant/commandes' || showRealOrders).filter(link => link.href !== '/gerant/commandes-test' || showTestOrders);
  return <header className="manager-header">
    <Link className="manager-brand" href="/gerant"><span>PIZZERIA</span><strong>ROMA</strong><small>ESPACE GÉRANT</small></Link>
    <nav className="manager-nav" aria-label="Navigation gérant">
      {visibleLinks.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</Link>)}
    </nav>
    <Link className="manager-store-link" href="/menu">Voir la boutique ↗</Link>
  </header>;
}
