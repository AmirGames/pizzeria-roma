import Link from 'next/link';
import { isWithinRestaurantService } from '../lib/fulfillment.mjs';
import styles from './home.module.css';

const categories = [
  { name: 'Pizzas', slug: 'pizzas', icon: '🍕', tone: 'tomato' },
  { name: 'Pâtes', slug: 'pates', icon: '🍝', tone: 'olive' },
  { name: 'Entrées', slug: 'entrees', icon: '🥖', tone: 'bread' },
  { name: 'Salades', slug: 'salades', icon: '🥗', tone: 'leaf' },
  { name: 'Desserts', slug: 'desserts', icon: '🍰', tone: 'cream' },
  { name: 'Boissons', slug: 'boissons', icon: '🥤', tone: 'wine' },
];

export const metadata = {
  title: 'Pizzeria Roma | Pizza à Namur',
  description: 'Découvrez la carte de Pizzeria Roma à Namur et préparez votre commande.',
};

export default function HomePage() {
  const openNow = isWithinRestaurantService(new Date());
  return <main className={styles.home}>
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}><span /> PIZZERIA ROMA · NAMUR</p>
          <h1>Un goût d’Italie,<br /><em>tout près de chez vous.</em></h1>
          <p className={styles.intro}>Des pizzas généreuses et une carte aux saveurs italiennes, préparées avec passion à Namur.</p>
          <div className={styles.actions}><Link className={styles.primary} href="/menu">Découvrir la carte <span aria-hidden="true">↗</span></Link><Link className={styles.secondary} href="/commande">Livraison & retrait</Link></div>
          <p className={styles.status}><span className={openNow ? styles.openDot : styles.closedDot} />{openNow ? 'Ouvert selon les horaires publiés' : 'Consultez nos horaires'}</p>
        </div>
        <div className={styles.heroArt} role="img" aria-label="Illustration d’une pizza garnie"><div className={styles.artStamp}>FAIT AVEC<br /><b>PASSION</b></div><span className={styles.artNote}>PIZZA · ROMA · NAMUR</span></div>
        <div className={styles.heroFoot}><span>01 <i /> CUISINE ITALIENNE</span><span>02 <i /> LIVRAISON GRATUITE SELON LA ZONE</span><span>03 <i /> À EMPORTER</span></div>
      </div>
    </section>
    <section className={styles.categorySection} id="apropos">
      <div className={styles.sectionHead}><div><p className={styles.kicker}>À TABLE</p><h2>À chacun son envie.</h2></div><Link href="/menu">Toute la carte <span aria-hidden="true">↗</span></Link></div>
      <div className={styles.categories}>{categories.map(category => <Link key={category.name} href={`/menu?category=${category.slug}#carte`} className={`${styles.category} ${styles[category.tone]}`}><span className={styles.categoryIcon} aria-hidden="true">{category.icon}</span><span>{category.name}</span><b aria-hidden="true">↗</b></Link>)}</div>
    </section>
    <section className={styles.story}>
      <div className={styles.storyMark} aria-hidden="true">R</div><div><p className={styles.kicker}>PIZZERIA ROMA · NAMUR</p><h2>Le plaisir des bonnes choses,<br />à partager.</h2></div><Link href="/menu" className={styles.storyLink}>Voir la carte <span aria-hidden="true">→</span></Link>
    </section>
    <footer className={styles.footer}><span>© Pizzeria Roma · Namur</span><span>Site en évolution · Les commandes en ligne restent en mode test.</span><Link href="/commande">Horaires & livraison</Link></footer>
  </main>;
}
