import Link from 'next/link';
import { isWithinRestaurantService } from '../lib/fulfillment.mjs';
import styles from './home.module.css';

const categories = [
  { name: 'Pizzas', slug: 'pizzas', image: 'pizza' },
  { name: 'Pâtes', slug: 'pates', image: 'pasta' },
  { name: 'Entrées', slug: 'entrees', image: 'starters' },
  { name: 'Salades', slug: 'salades', image: 'salad' },
  { name: 'Desserts', slug: 'desserts', image: 'dessert' },
  { name: 'Boissons', slug: 'boissons', image: 'drinks' },
];

export const metadata = {
  title: 'Pizzeria Roma | Pizza à Namur',
  description: 'Découvrez la carte de Pizzeria Roma à Namur et préparez votre commande.',
};

export default function HomePage() {
  const openNow = isWithinRestaurantService(new Date());
  return <main className={styles.home}>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>PIZZERIA ROMA · NAMUR</p>
        <h1>De véritables<br />saveurs italiennes<br />à Namur</h1>
        <p className={styles.intro}>Pizzas artisanales, pâtes, salades et bien plus encore.<br />À emporter ou en livraison, toujours avec passion.</p>
        <div className={styles.actions}><Link className={styles.primary} href="/menu">Commander maintenant <span aria-hidden="true">→</span></Link><Link className={styles.secondary} href="/menu">Voir la carte</Link></div>
      </div>
      <div className={styles.heroFoot}>
        <div><span aria-hidden="true">◷</span><p><b>{openNow ? 'Ouvert aujourd’hui' : 'Nos horaires'}</b><br />11h30–14h00 | 18h00–22h00<br />(Samedi : 18h00–22h00)</p></div>
        <div><span aria-hidden="true">♧</span><p><b>Livraison gratuite</b><br />Selon votre zone<br />à partir de 1 plat</p></div>
        <div><span aria-hidden="true">♧</span><p><b>À emporter</b><br />Commande prête<br />en 30 à 40 minutes</p></div>
      </div>
    </section>
    <section className={styles.categorySection} id="apropos" aria-label="Catégories de la carte">
      <div className={styles.categories}>{categories.map((category, index) => <Link key={category.name} href={`/menu?category=${category.slug}#carte`} className={`${styles.category} ${styles[category.image]}`}><span>{category.name}</span></Link>)}</div>
    </section>
    <footer className={styles.footer} id="contact"><span>© Pizzeria Roma · Namur</span><Link href="/compte">Mon espace client</Link><span>Les commandes en ligne restent en mode test.</span><Link href="/commande">Livraison & retrait</Link></footer>
  </main>;
}
