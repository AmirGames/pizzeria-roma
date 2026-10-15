import CatalogProducts from './catalog-products';
import SiteFooter from '../../components/site-footer';

export const metadata = {
  title: 'Notre carte | Pizzeria Roma',
  description: 'Découvrez la carte publiée de Pizzeria Roma à Namur.',
};

export default function MenuPage() {
  return (
    <main className="menu-page">
      <section className="menu-hero">
        <div><p className="eyebrow">PIZZERIA ROMA · NAMUR</p>
        <h1>Notre carte</h1>
        <p>Découvrez nos pizzas, pâtes, salades et spécialités italiennes.</p></div>
      </section>
      <section className="menu-live-catalog" id="carte" aria-label="Carte des plats"><CatalogProducts /></section>
      <SiteFooter />
    </main>
  );
}
