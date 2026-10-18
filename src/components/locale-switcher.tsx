'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { SiteLocale } from '../lib/locale';
import { getMessages } from '../i18n/messages';
import styles from './site-header.module.css';

export default function LocaleSwitcher({ locale }: { locale: SiteLocale }) {
  const t = getMessages(locale).header;
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  function select(next: SiteLocale) {
    if (next === locale || busy) return;
    document.cookie = `roma_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    startTransition(() => router.refresh());
  }
  return <div className={styles.languages} aria-label={t.language}>
    <button type="button" className={locale === 'fr' ? styles.languageCurrent : styles.languageOption} aria-pressed={locale === 'fr'} disabled={busy} onClick={() => select('fr')}>FR</button>
    <button type="button" className={locale === 'en' ? styles.languageCurrent : styles.languageOption} aria-pressed={locale === 'en'} disabled={busy} onClick={() => select('en')}>EN</button>
  </div>;
}
