import Link from 'next/link';
import styles from './contact.module.css';
import ContactForm from './contact-form';
import { publicPageMetadata } from '../../lib/site-seo';

export const metadata = publicPageMetadata('Adresse, horaires et contact à Namur', 'Retrouvez l’adresse, les horaires et le formulaire de contact de Pizzeria Roma, Rue Général Michel 23 à Namur.', '/contact');

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PIZZERIA ROMA · NAMUR</p>
          <h1>On se retrouve<br />à table ?</h1>
          <p>Une envie de pizza, de pâtes ou simplement de nous rendre visite ? Retrouvez ici les informations pratiques de la Pizzeria Roma.</p>
        </div>
      </section>

      <section className={styles.details} aria-label="Informations de contact">
        <article className={styles.card}>
          <span className={styles.number}>01</span>
          <h2>Nous trouver</h2>
          <address>Rue Général Michel 23<br />Namur, Belgique</address>
          <a className={styles.textLink} href="https://www.google.com/maps/search/?api=1&query=Rue+G%C3%A9n%C3%A9ral+Michel+23%2C+Namur%2C+Belgique" target="_blank" rel="noreferrer">Voir l’itinéraire <span aria-hidden="true">↗</span></a>
        </article>

        <article className={styles.card}>
          <span className={styles.number}>02</span>
          <h2>Nos horaires</h2>
          <dl className={styles.hours}>
            <div><dt>Lundi – vendredi</dt><dd>11h30–14h00<br />18h00–22h00</dd></div>
            <div><dt>Samedi</dt><dd>18h00–22h00</dd></div>
            <div><dt>Dimanche</dt><dd>Fermé</dd></div>
          </dl>
        </article>

        <article className={`${styles.card} ${styles.orderCard}`}>
          <span className={styles.number}>03</span>
          <h2>À emporter ou en livraison</h2>
          <p>Consultez notre carte, puis choisissez le mode de retrait qui vous convient.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/menu">Découvrir la carte <span aria-hidden="true">→</span></Link>
            <Link className={styles.secondary} href="/commande">Options de livraison</Link>
          </div>
        </article>
      </section>
      <ContactForm />
    </main>
  );
}
