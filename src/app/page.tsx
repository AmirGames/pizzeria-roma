import Link from 'next/link';
import { isWithinRestaurantService } from '../lib/fulfillment.mjs';
import styles from './home.module.css';
import SiteFooter from '../components/site-footer';

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
        <h1>De véritables<br />saveurs italiennes<br />à Namur</h1>
        <p className={styles.intro}>Pizzas artisanales, pâtes, salades et bien plus encore.<br />À emporter ou en livraison, toujours avec passion.</p>
        <div className={styles.actions}><Link className={styles.primary} href="/menu">Commander maintenant <span aria-hidden="true">→</span></Link><Link className={styles.secondary} href="/menu">Voir la carte</Link></div>
      </div>
      <div className={styles.heroFoot}>
        <div><span aria-hidden="true">◷</span><p><b>{openNow ? 'Ouvert aujourd’hui' : 'Nos horaires'}</b><br />11h30–14h00 | 18h00–22h00<br />(Samedi : 18h00–22h00)</p></div>
        <div><span aria-hidden="true"><svg viewBox="0 0 32 24" fill="none"><path d="M1.5 3.5h18v14h-18zM19.5 8h6l5 5v4.5h-11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="7" cy="19" r="2.5" fill="#111" stroke="currentColor" strokeWidth="1.6"/><circle cx="25" cy="19" r="2.5" fill="#111" stroke="currentColor" strokeWidth="1.6"/></svg></span><p><b>Livraison gratuite</b><br />Selon votre zone<br />à partir de 1 plat</p></div>
        <div><span aria-hidden="true"><svg viewBox="0 0 24 28" fill="none"><path d="M4 8h16l1.5 17h-19L4 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8 9V6a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></span><p><b>À emporter</b><br />Commande prête<br />en 30 à 40 minutes</p></div>
      </div>
    </section>
    <section className={styles.categorySection} id="apropos" aria-label="Catégories de la carte">
      <div className={styles.categories}>{categories.map(category => <Link key={category.name} href={`/menu?category=${category.slug}#carte`} className={`${styles.category} ${styles[category.image]}`}><span>{category.name}</span></Link>)}</div>
    </section>
    <SiteFooter />
  </main>;
}
