'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CATALOG_CART_STORAGE_KEY, readCatalogCart } from '../lib/catalog-cart.mjs';
import styles from './site-header.module.css';

export default function SiteHeader({ showTestLinks = false }: { showTestLinks?: boolean }) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();
  useEffect(() => {
    const refresh = () => setCount(readCatalogCart(window.localStorage.getItem(CATALOG_CART_STORAGE_KEY)).reduce((total, item) => total + item.quantity, 0));
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('catalog-cart-change', refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('catalog-cart-change', refresh); };
  }, []);
  return <header className={`${styles.header} ${pathname === '/' ? styles.homeHeader : ''}`}>
    <Link href="/" className={styles.logo} aria-label="Pizzeria Roma, accueil"><span>PIZZERIA</span><strong>ROMA</strong><small>NAMUR</small></Link>
    <nav className={styles.nav} aria-label="Navigation principale">
      <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Accueil</Link><Link href="/menu" aria-current={pathname.startsWith('/menu') ? 'page' : undefined}>Notre carte</Link><Link href="/commande" aria-current={pathname.startsWith('/commande') ? 'page' : undefined}>Livraison</Link><Link href="/#apropos">À propos</Link><Link href="/#contact">Contact</Link>
    </nav>
    <div className={styles.utilities}><span>FR</span><span>EN</span><Link href="/compte" className={styles.account} aria-label="Mon espace client">♙</Link>{showTestLinks && <Link href="/commande/test" className={styles.test} aria-label="Commander en mode test">Test</Link>}</div>
    <Link className={styles.cart} href="/panier" aria-label={`Panier, ${count} article${count === 1 ? '' : 's'}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.1 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1.3" fill="currentColor"/><circle cx="18" cy="20" r="1.3" fill="currentColor"/></svg><b>{count}</b></Link>
  </header>;
}
