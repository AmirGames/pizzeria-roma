import 'server-only';
import { cookies } from 'next/headers';

export type SiteLocale = 'fr' | 'en';
export const SITE_LOCALE_COOKIE = 'roma_locale';

export async function getSiteLocale(): Promise<SiteLocale> {
  return (await cookies()).get(SITE_LOCALE_COOKIE)?.value === 'en' ? 'en' : 'fr';
}

export function chooseLocale(locale: SiteLocale, french: string, english: string) {
  return locale === 'en' ? english : french;
}
