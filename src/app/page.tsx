import Link from 'next/link';
import { isWithinRestaurantService } from '../lib/fulfillment.mjs';
import { realOrdersEnabled, stripeReady } from '../lib/real-orders';
import { publicPageMetadata } from '../lib/site-seo';
import styles from './home.module.css';

const categories = [
  { name: 'Pizzas', slug: 'pizzas', image: 'pizza' },
  { name: 'Pâtes', slug: 'pates', image: 'pasta' },
  { name: 'Entrées', slug: 'entrees', image: 'starters' },
  { name: 'Salades', slug: 'salades', image: 'salad' },
  { name: 'Desserts', slug: 'desserts', image: 'dessert' },
  { name: 'Boissons', slug: 'boissons', image: 'drinks' },
];

export const metadata = publicPageMetadata('Pizza et pâtes italiennes à Namur', 'Découvrez les pizzas, pâtes et spécialités de Pizzeria Roma à Namur. À emporter ou en livraison.', '/');

export default function HomePage() {
  const openNow = isWithinRestaurantService(new Date());
  const onlineOrdersAvailable = realOrdersEnabled() && stripeReady();
  return <main className={styles.home}>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <h1>De véritables<br />saveurs italiennes<br />à Namur</h1>
        <p className={styles.intro}>Pizzas artisanales, pâtes, salades et bien plus encore.<br />À emporter ou en livraison, toujours avec passion.</p>
        <p className={styles.notice}>{onlineOrdersAvailable ? 'Commandes en ligne ouvertes · paiement sécurisé.' : 'Site de présentation : aucune commande ni paiement en ligne n’est possible pour le moment.'}</p>
        <div className={styles.actions}><Link className={styles.primary} href="/menu">{onlineOrdersAvailable ? 'Commander maintenant' : 'Découvrir la carte'} <span aria-hidden="true">→</span></Link><Link className={styles.secondary} href="/menu">Voir la carte</Link></div>
      </div>
      <div className={styles.heroFoot}>
        <div><span aria-hidden="true">◷</span><p><b>{openNow ? 'Ouvert aujourd’hui' : 'Nos horaires'}</b><br />11h30–14h00 | 18h00–22h00<br />(Samedi : 18h00–22h00)</p></div>
        <div><span aria-hidden="true"><svg viewBox="0 0 32 24" fill="none"><path d="M1.5 3.5h18v14h-18zM19.5 8h6l5 5v4.5h-11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="7" cy="19" r="2.5" fill="#111" stroke="currentColor" strokeWidth="1.6"/><circle cx="25" cy="19" r="2.5" fill="#111" stroke="currentColor" strokeWidth="1.6"/></svg></span><p><b>Livraison gratuite</b><br />Selon votre zone<br />à partir de 1 plat</p></div>
        <div><span aria-hidden="true"><svg viewBox="0 0 24 28" fill="none"><path d="M4 8h16l1.5 17h-19L4 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8 9V6a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></span><p><b>À emporter</b><br />Commande prête<br />en 30 à 40 minutes</p></div>
      </div>
    </section>
    <section className={styles.categorySection} aria-label="Catégories de la carte">
      <div className={styles.categories}>{categories.map(category => <Link key={category.name} href={`/menu?category=${category.slug}#carte`} className={`${styles.category} ${styles[category.image]}`}><span>{category.name}</span></Link>)}</div>
    </section>
    <section className={styles.about} id="apropos" aria-labelledby="about-title">
      <div className={styles.aboutCopy}>
        <p className={styles.aboutKicker}>PIZZERIA ROMA · NAMUR</p>
        <h2 id="about-title">Une histoire de famille, de passion et de tradition</h2>
        <p>Présente dans le Namurois depuis 2003, la <strong>Pizzeria Roma</strong> cultive une ambiance familiale et le goût des traditions culinaires italiennes.</p>
        <p>Livraison, plats à emporter et recettes préparées avec soin : découvrez l’histoire qui nous lie à nos clients depuis plus de vingt ans.</p>
        <Link className={styles.aboutLink} href="/a-propos">Découvrir notre histoire <span aria-hidden="true">→</span></Link>
      </div>
      <div className={styles.aboutImage} role="img" aria-label="La Pizzeria Roma, ses pizzas et ses traditions italiennes" />
    </section>
  </main>;
}
