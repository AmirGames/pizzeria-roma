'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CATALOG_CART_STORAGE_KEY, readCatalogCart } from '../lib/catalog-cart.mjs';
import styles from './site-header.module.css';

export default function SiteHeader({ showTestLinks = false }: { showTestLinks?: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const refresh = () => setCount(readCatalogCart(window.localStorage.getItem(CATALOG_CART_STORAGE_KEY)).reduce((total, item) => total + item.quantity, 0));
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('catalog-cart-change', refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('catalog-cart-change', refresh); };
  }, []);
  return <header className={styles.header}>
    <Link href="/" className={styles.logo} aria-label="Pizzeria Roma, accueil"><span>PIZZERIA</span><strong>ROMA</strong><small>NAMUR</small></Link>
    <nav className={styles.nav} aria-label="Navigation principale">
      <Link href="/">Accueil</Link><Link href="/menu">Notre carte</Link><Link href="/commande">Livraison</Link><Link href="/#apropos">À propos</Link><Link href="/compte">Mon espace client</Link>{showTestLinks && <Link href="/commande/test">Commander en mode test</Link>}
    </nav>
    <Link className={styles.cart} href="/panier" aria-label={`Panier, ${count} article${count === 1 ? '' : 's'}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.1 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1.3" fill="currentColor"/><circle cx="18" cy="20" r="1.3" fill="currentColor"/></svg><b>{count}</b></Link>
  </header>;
}
