import Link from 'next/link';
import styles from './contact.module.css';
import ContactForm from './contact-form';
import { publicPageMetadata } from '../../lib/site-seo';
import { getSiteLocale } from '../../lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getSiteLocale()) === 'en';
  return publicPageMetadata(
    en ? 'Address, opening hours and contact in Namur' : 'Adresse, horaires et contact à Namur',
    en ? 'Find the address, opening hours and contact form for Pizzeria Roma, Rue Général Michel 23 in Namur.' : 'Retrouvez l’adresse, les horaires et le formulaire de contact de Pizzeria Roma, Rue Général Michel 23 à Namur.',
    '/contact',
    en ? 'en' : 'fr',
  );
}

export default async function ContactPage() {
  const en = (await getSiteLocale()) === 'en';
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PIZZERIA ROMA · NAMUR</p>
          <h1>{en ? <>Shall we meet<br />at the table?</> : <>On se retrouve<br />à table ?</>}</h1>
          <p>{en ? 'Craving pizza or pasta, or simply planning to visit? Find all the practical information about Pizzeria Roma here.' : 'Une envie de pizza, de pâtes ou simplement de nous rendre visite ? Retrouvez ici les informations pratiques de la Pizzeria Roma.'}</p>
        </div>
      </section>

      <section className={styles.details} aria-label={en ? 'Contact information' : 'Informations de contact'}>
        <article className={styles.card}>
          <span className={styles.number}>01</span>
          <h2>{en ? 'Find us' : 'Nous trouver'}</h2>
          <address>Rue Général Michel 23<br />Namur, Belgique</address>
          <a className={styles.textLink} href="https://www.google.com/maps/search/?api=1&query=Rue+G%C3%A9n%C3%A9ral+Michel+23%2C+Namur%2C+Belgique" target="_blank" rel="noreferrer">{en ? 'Get directions' : 'Voir l’itinéraire'} <span aria-hidden="true">↗</span></a>
        </article>

        <article className={styles.card}>
          <span className={styles.number}>02</span>
          <h2>{en ? 'Opening hours' : 'Nos horaires'}</h2>
          <dl className={styles.hours}>
            <div><dt>{en ? 'Monday – Friday' : 'Lundi – vendredi'}</dt><dd>{en ? '11:30 am–2:00 pm' : '11h30–14h00'}<br />{en ? '6:00–10:00 pm' : '18h00–22h00'}</dd></div>
            <div><dt>{en ? 'Saturday' : 'Samedi'}</dt><dd>{en ? '6:00–10:00 pm' : '18h00–22h00'}</dd></div>
            <div><dt>{en ? 'Sunday' : 'Dimanche'}</dt><dd>{en ? 'Closed' : 'Fermé'}</dd></div>
          </dl>
        </article>

        <article className={`${styles.card} ${styles.orderCard}`}>
          <span className={styles.number}>03</span>
          <h2>{en ? 'Takeaway or delivery' : 'À emporter ou en livraison'}</h2>
          <p>{en ? 'Browse our menu, then choose the collection option that suits you.' : 'Consultez notre carte, puis choisissez le mode de retrait qui vous convient.'}</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/menu">{en ? 'Explore the menu' : 'Découvrir la carte'} <span aria-hidden="true">→</span></Link>
            <Link className={styles.secondary} href="/commande">{en ? 'Delivery options' : 'Options de livraison'}</Link>
          </div>
        </article>
      </section>
      <ContactForm locale={en ? 'en' : 'fr'} />
    </main>
  );
}
