import Link from 'next/link';
import InstallPwa from './install-pwa';
import type { SiteLocale } from '../lib/locale';
import { getMessages } from '../i18n/messages';

export default function SiteFooter({ locale = 'fr' }: { locale?: SiteLocale }) {
  const t = getMessages(locale).footer;
  return <footer className="site-footer" id="contact">
    <div className="site-footer-inner">
      <div className="site-footer-brand">
        <Link href="/" className="site-footer-logo"><span>PIZZERIA</span><strong>ROMA</strong><small>NAMUR</small></Link>
        <p>{t.tagline}</p>
      </div>
      <div className="site-footer-block">
        <h2>{t.hours}</h2>
        <p>{t.hoursLine}<br />{t.saturday}</p>
      </div>
      <div className="site-footer-block">
        <h2>{t.findUs}</h2>
        <address>Rue Général Michel 23<br />Namur, Belgique</address>
      </div>
      <nav className="site-footer-links" aria-label={t.navigationLabel}>
        <h2>{t.quickLinks}</h2>
        <Link href="/menu">{t.menu}</Link>
        <Link href="/a-propos">{t.about}</Link>
        <Link href="/contact">{t.addressHours}</Link>
        <Link href="/commande">{t.deliveryCollection}</Link>
        <Link href="/panier">{t.cart}</Link>
      </nav>
      <InstallPwa locale={locale} />
    </div>
    <div className="site-footer-bottom"><span>© {new Date().getFullYear()} Pizzeria Roma · Namur</span><span>{t.closing}</span></div>
  </footer>;
}
