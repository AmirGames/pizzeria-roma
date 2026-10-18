import { absoluteSiteUrl } from '../lib/site-seo';

const restaurant = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Pizzeria Roma',
  url: absoluteSiteUrl('/'),
  image: absoluteSiteUrl('/roma-hero.png'),
  servesCuisine: ['Italian', 'Pizza'],
  hasMenu: absoluteSiteUrl('/menu'),
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rue Général Michel 23',
    addressLocality: 'Namur',
    postalCode: '5000',
    addressCountry: 'BE',
  },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '11:30', closes: '14:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '18:00', closes: '22:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '18:00', closes: '22:00' },
  ],
};

export default function RestaurantJsonLd() {
  const json = JSON.stringify(restaurant).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
