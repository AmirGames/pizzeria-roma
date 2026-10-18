import Link from 'next/link';
import styles from '../home.module.css';
import { publicPageMetadata } from '../../lib/site-seo';
import type { Metadata } from 'next';
import { getSiteLocale } from '../../lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getSiteLocale()) === 'en';
  return publicPageMetadata(
    en ? 'Our Italian story in Namur' : 'Notre histoire italienne à Namur',
    en ? 'Since 2003, Pizzeria Roma has shared Italian traditions, pizza and pasta in a family atmosphere in Namur.' : 'Depuis 2003, Pizzeria Roma partage à Namur ses traditions culinaires italiennes, ses pizzas et ses pâtes dans une ambiance familiale.',
    '/a-propos',
    en ? 'en' : 'fr',
  );
}

export default async function AboutPage() {
  const en = (await getSiteLocale()) === 'en';
  return <main className={styles.home}>
    <section className={styles.about} aria-labelledby="about-title">
      <div className={styles.aboutCopy}>
        <p className={styles.aboutKicker}>PIZZERIA ROMA · NAMUR · {en ? 'SINCE 2003' : 'DEPUIS 2003'}</p>
        <h1 id="about-title">{en ? 'A family story of passion and tradition' : 'Une histoire de famille, de passion et de tradition'}</h1>
        <p>{en ? <><strong>Pizzeria Roma</strong> has been part of the Namur region for over twenty years, in a neighbourhood that has been completely renewed. Our story began in early 2003, shaped by passion and tradition.</> : <>La <strong>Pizzeria Roma</strong> est présente dans le Namurois depuis plus de vingt ans, dans un quartier complètement rénové. Notre histoire est née au début de l’année 2003, entre passion et tradition.</>}</p>
        <p>{en ? 'In a family atmosphere, the pizzeria was created around a shared desire to pass on our Italian culinary traditions. Pizza and pasta remain firm favourites at our tables.' : 'Dans une ambiance familiale, la création de la pizzeria s’est construite autour de différentes idées, portées par la volonté de transmettre nos traditions culinaires italiennes. La pizza et les pâtes sont des plats incontournables, toujours très présents sur nos tables.'}</p>
        <p>{en ? 'We began with delivery and takeaway. Over the years, at our customers’ request, we also welcomed guests to dine in. This service was paused during the Covid crisis.' : 'Nous avons commencé par la livraison et les plats à emporter. Au fil des années, à la demande de nos clients, nous avons également proposé de déguster nos plats sur place. Ce service a été interrompu pendant la crise du Covid.'}</p>
        <p>{en ? 'More than twenty years later, we are still here. We would like to thank our loyal customers for being part of our story.' : 'Vingt ans plus tard, nous sommes toujours présents. Nous tenons à remercier nos fidèles clients qui font vivre cette histoire avec nous.'}</p>
        <blockquote>{en ? <>“What has made <strong>Pizzeria Roma</strong> successful is the right balance between professional cooking and competitive prices.”</> : <>« Ce qui a déterminé le succès de la <strong>Pizzeria Roma</strong>, c’est d’avoir trouvé un juste équilibre entre des plats préparés avec professionnalisme et un prix compétitif. »</>}</blockquote>
        <Link className={styles.aboutLink} href="/menu">{en ? 'Explore our menu' : 'Découvrir notre carte'} <span aria-hidden="true">→</span></Link>
      </div>
      <div className={styles.aboutImage} role="img" aria-label={en ? 'Pizzeria Roma, Italian culinary traditions in Namur' : 'Pizzeria Roma, traditions culinaires italiennes à Namur'} />
    </section>
  </main>;
}
