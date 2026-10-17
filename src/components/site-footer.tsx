import Link from 'next/link';
import InstallPwa from './install-pwa';

export default function SiteFooter() {
  return <footer className="site-footer" id="contact">
    <div className="site-footer-inner">
      <div className="site-footer-brand">
        <Link href="/" className="site-footer-logo"><span>PIZZERIA</span><strong>ROMA</strong><small>NAMUR</small></Link>
        <p>Les saveurs italiennes à Namur.</p>
      </div>
      <div className="site-footer-block">
        <h2>Horaires</h2>
        <p>11h30–14h00 · 18h00–22h00<br />Samedi : 18h00–22h00</p>
      </div>
      <div className="site-footer-block">
        <h2>Nous trouver</h2>
        <address>Rue Général Michel 23<br />Namur, Belgique</address>
      </div>
      <nav className="site-footer-links" aria-label="Liens de pied de page">
        <h2>En un clic</h2>
        <Link href="/menu">Notre carte</Link>
        <Link href="/commande">Livraison & retrait</Link>
        <Link href="/panier">Mon panier</Link>
      </nav>
      <InstallPwa />
    </div>
    <div className="site-footer-bottom"><span>© {new Date().getFullYear()} Pizzeria Roma · Namur</span><span>Fait avec passion en Italie, servi à Namur</span></div>
  </footer>;
}
