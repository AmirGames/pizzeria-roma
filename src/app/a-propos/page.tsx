import Link from 'next/link';
import styles from '../home.module.css';
import { publicPageMetadata } from '../../lib/site-seo';

export const metadata = publicPageMetadata(
  'Notre histoire italienne à Namur',
  'Depuis 2003, Pizzeria Roma partage à Namur ses traditions culinaires italiennes, ses pizzas et ses pâtes dans une ambiance familiale.',
  '/a-propos',
);

export default function AboutPage() {
  return <main className={styles.home}>
    <section className={styles.about} aria-labelledby="about-title">
      <div className={styles.aboutCopy}>
        <p className={styles.aboutKicker}>PIZZERIA ROMA · NAMUR · DEPUIS 2003</p>
        <h1 id="about-title">Une histoire de famille, de passion et de tradition</h1>
        <p>La <strong>Pizzeria Roma</strong> est présente dans le Namurois depuis plus de vingt ans, dans un quartier complètement rénové. Notre histoire est née au début de l’année 2003, entre passion et tradition.</p>
        <p>Dans une ambiance familiale, la création de la pizzeria s’est construite autour de différentes idées, portées par la volonté de transmettre nos traditions culinaires italiennes. La pizza et les pâtes sont des plats incontournables, toujours très présents sur nos tables.</p>
        <p>Nous avons commencé par la livraison et les plats à emporter. Au fil des années, à la demande de nos clients, nous avons également proposé de déguster nos plats sur place. Ce service a été interrompu pendant la crise du Covid.</p>
        <p>Vingt ans plus tard, nous sommes toujours présents. Nous tenons à remercier nos fidèles clients qui font vivre cette histoire avec nous.</p>
        <blockquote>« Ce qui a déterminé le succès de la <strong>Pizzeria Roma</strong>, c’est d’avoir trouvé un juste équilibre entre des plats préparés avec professionnalisme et un prix compétitif. »</blockquote>
        <Link className={styles.aboutLink} href="/menu">Découvrir notre carte <span aria-hidden="true">→</span></Link>
      </div>
      <div className={styles.aboutImage} role="img" aria-label="Pizzeria Roma, traditions culinaires italiennes à Namur" />
    </section>
  </main>;
}
