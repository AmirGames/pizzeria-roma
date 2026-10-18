'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CATALOG_CART_STORAGE_KEY, readCatalogCart } from '../lib/catalog-cart.mjs';
import type { SiteLocale } from '../lib/locale';
import { getMessages } from '../i18n/messages';
import LocaleSwitcher from './locale-switcher';
import styles from './site-header.module.css';

export default function SiteHeader({ showTestLinks = false, locale = 'fr' }: { showTestLinks?: boolean; locale?: SiteLocale }) {
  const t = getMessages(locale).header;
  const [count, setCount] = useState(0);
  const pathname = usePathname();
  const isStorefrontPage = pathname === '/' || pathname.startsWith('/menu') || pathname === '/commande' || pathname === '/contact' || pathname === '/a-propos';
  useEffect(() => {
    const refresh = () => setCount(readCatalogCart(window.localStorage.getItem(CATALOG_CART_STORAGE_KEY)).reduce((total, item) => total + item.quantity, 0));
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('catalog-cart-change', refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('catalog-cart-change', refresh); };
  }, []);
  return <header className={`${styles.header} ${isStorefrontPage ? styles.homeHeader : ''}`}>
    <Link href="/" className={styles.logo} aria-label={t.homeLabel}><span>PIZZERIA</span><strong>ROMA</strong><small>NAMUR</small></Link>
    <nav className={styles.nav} aria-label={t.navigationLabel}>
      <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>{t.home}</Link><Link href="/menu" aria-current={pathname.startsWith('/menu') ? 'page' : undefined}>{t.menu}</Link><Link href="/commande" aria-current={pathname.startsWith('/commande') ? 'page' : undefined}>{t.delivery}</Link><Link href="/a-propos" aria-current={pathname === '/a-propos' ? 'page' : undefined}>{t.story}</Link><Link href="/contact" aria-current={pathname === '/contact' ? 'page' : undefined}>{t.contact}</Link>
    </nav>
    <div className={styles.utilities}>
      <LocaleSwitcher locale={locale} />
      <Link href="/compte" className={styles.account} aria-label={t.account} title={t.account}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.7"/><path d="M5.5 20c.5-3.25 2.72-5 6.5-5s6 1.75 6.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></Link>
      {showTestLinks && <Link href="/commande/test" className={styles.test} aria-label={t.testOrder}>Test</Link>}
    </div>
    <Link className={styles.cart} href="/panier" aria-label={t.cart(count)}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.1 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1.3" fill="currentColor"/><circle cx="18" cy="20" r="1.3" fill="currentColor"/></svg><b>{count}</b></Link>
  </header>;
}
