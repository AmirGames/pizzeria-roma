import Link from 'next/link';
import CatalogProducts from './catalog-products';

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
      <section className="menu-live-catalog" id="carte" aria-labelledby="live-catalog-title">
        <div className="section-heading"><p className="eyebrow">FAIT AVEC PASSION</p><h2 id="live-catalog-title">Choisissez votre envie</h2><p>Les recettes et tarifs proviennent de la carte publiée par le restaurant.</p></div>
        <CatalogProducts />
      </section>
      <footer className="menu-footer"><span>Pizzeria Roma · Namur</span><span>Site en évolution · Commandes en mode test</span><Link href="/commande">Livraison & retrait →</Link></footer>
    </main>
  );
}
