import Link from 'next/link';
import { isWithinRestaurantService } from '../lib/fulfillment.mjs';
import { realOrdersEnabled, stripeReady } from '../lib/real-orders';
import { publicPageMetadata } from '../lib/site-seo';
import { getHomePageContent } from '../lib/homepage-content';
import { getSiteLocale } from '../lib/locale';
import styles from './home.module.css';

const categories = [
  { name: 'Pizzas', slug: 'pizzas', image: 'pizza' },
  { name: 'Pâtes', slug: 'pates', image: 'pasta' },
  { name: 'Entrées', slug: 'entrees', image: 'starters' },
  { name: 'Salades', slug: 'salades', image: 'salad' },
  { name: 'Desserts', slug: 'desserts', image: 'dessert' },
  { name: 'Boissons', slug: 'boissons', image: 'drinks' },
];

export async function generateMetadata() {
  const locale = await getSiteLocale();
  const content = await getHomePageContent();
  return locale === 'en'
    ? publicPageMetadata('Authentic Italian pizza in Namur', 'Discover the pizzas, pasta and Italian specialities of Pizzeria Roma in Namur. Takeaway and delivery.', '/', 'en')
    : publicPageMetadata(content.metaTitle, content.metaDescription, '/', 'fr');
}

export default async function HomePage() {
  const content = await getHomePageContent();
  const locale = await getSiteLocale();
  const en = locale === 'en';
  const openNow = isWithinRestaurantService(new Date());
  const onlineOrdersAvailable = realOrdersEnabled() && stripeReady();
  return <main className={styles.home}>
    <section className={styles.hero} style={{ backgroundImage: `url("${content.heroImage}")` }}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>{content.eyebrow}</p>
        <h1>{(en ? 'Authentic Italian\nflavours in Namur' : content.title).split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</h1>
        <p className={styles.intro}>{(en ? 'Artisan pizzas, pasta, salads and much more.\nTakeaway or delivery, always made with passion.' : content.intro).split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</p>
        <p className={styles.notice}>{onlineOrdersAvailable ? en ? 'Online ordering is open · secure payment.' : 'Commandes en ligne ouvertes · paiement sécurisé.' : en ? 'Online ordering and payment are not available yet.' : 'Site de présentation : aucune commande ni paiement en ligne n’est possible pour le moment.'}</p>
        <div className={styles.actions}><Link className={styles.primary} href="/menu">{en ? 'Explore the menu' : content.primaryLabel} <span aria-hidden="true">→</span></Link><Link className={styles.secondary} href="/menu">{en ? 'View menu' : content.secondaryLabel}</Link></div>
      </div>
      <div className={styles.heroFoot}>
        <div><span aria-hidden="true">◷</span><p><b>{en ? (openNow ? 'Open today' : 'Opening hours') : (openNow ? 'Ouvert aujourd’hui' : 'Nos horaires')}</b><br />{en ? '11:30 am–2:00 pm | 6:00–10:00 pm' : '11h30–14h00 | 18h00–22h00'}<br />{en ? '(Saturday: 6:00–10:00 pm)' : '(Samedi : 18h00–22h00)'}</p></div>
        <div><span aria-hidden="true"><svg viewBox="0 0 32 24" fill="none"><path d="M1.5 3.5h18v14h-18zM19.5 8h6l5 5v4.5h-11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="7" cy="19" r="2.5" fill="#111" stroke="currentColor" strokeWidth="1.6"/><circle cx="25" cy="19" r="2.5" fill="#111" stroke="currentColor" strokeWidth="1.6"/></svg></span><p><b>{en ? 'Free delivery' : 'Livraison gratuite'}</b><br />{en ? 'Depending on your area' : 'Selon votre zone'}<br />{en ? 'from 1 main dish' : 'à partir de 1 plat'}</p></div>
        <div><span aria-hidden="true"><svg viewBox="0 0 24 28" fill="none"><path d="M4 8h16l1.5 17h-19L4 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8 9V6a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></span><p><b>{en ? 'Takeaway' : 'À emporter'}</b><br />{en ? 'Ready in' : 'Commande prête'}<br />{en ? '30 to 40 minutes' : 'en 30 à 40 minutes'}</p></div>
      </div>
    </section>
    <section className={styles.categorySection} aria-label={en ? 'Menu categories' : 'Catégories de la carte'}>
      <div className={styles.categories}>{categories.map(category => <Link key={category.name} href={`/menu?category=${category.slug}#carte`} className={`${styles.category} ${styles[category.image]}`}><span>{en ? ({ Pizzas: 'Pizzas', Pâtes: 'Pasta', Entrées: 'Starters', Salades: 'Salads', Desserts: 'Desserts', Boissons: 'Drinks' } as Record<string, string>)[category.name] : category.name}</span></Link>)}</div>
    </section>
    <section className={styles.about} id="apropos" aria-labelledby="about-title">
      <div className={styles.aboutCopy}>
        <p className={styles.aboutKicker}>PIZZERIA ROMA · NAMUR</p>
        <h2 id="about-title">{en ? 'A family story, rooted in Italian tradition' : content.aboutTitle}</h2>
        <p>{en ? 'Pizzeria Roma has been part of the Namur region since 2003, sharing Italian culinary traditions in a warm, family atmosphere.' : content.aboutTextOne}</p>
        <p>{en ? 'From takeaway and delivery to welcoming guests at the restaurant, we are grateful to our loyal customers for more than twenty years.' : content.aboutTextTwo}</p>
        <Link className={styles.aboutLink} href="/a-propos">{en ? 'Discover our story' : 'Découvrir notre histoire'} <span aria-hidden="true">→</span></Link>
      </div>
      <div className={styles.aboutImage} role="img" aria-label={en ? 'Pizzeria Roma, its pizzas and Italian traditions' : 'La Pizzeria Roma, ses pizzas et ses traditions italiennes'} />
    </section>
  </main>;
}
