'use client';

import { useEffect, useState } from 'react';
import type { SiteLocale } from '../lib/locale';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function InstallPwa({ locale = 'fr' }: { locale?: SiteLocale }) {
  const en = locale === 'en';
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const appleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(appleMobile);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  if (!prompt && !isIos) return null;

  async function install() {
    if (!prompt) {
      setShowInstructions(true);
      return;
    }
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }

  return <div className="pwa-install-wrap">
    <button type="button" className="pwa-install-button" onClick={install}>{prompt ? en ? 'Install the app' : 'Installer l’application' : en ? 'Add to home screen' : 'Ajouter à l’écran d’accueil'}</button>
    {showInstructions && <div className="pwa-install-overlay" role="presentation" onClick={event => { if (event.target === event.currentTarget) setShowInstructions(false); }}>
      <section className="pwa-install-dialog" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
        <button type="button" className="pwa-install-close" aria-label={en ? 'Close' : 'Fermer'} onClick={() => setShowInstructions(false)}>×</button>
        <h2 id="pwa-install-title">{en ? 'Add Pizzeria Roma to your home screen' : 'Ajouter Pizzeria Roma à l’écran d’accueil'}</h2>
        <ol><li>{en ? <>In Safari, tap the <strong>Share</strong> button</> : <>Dans Safari, touchez le bouton <strong>Partager</strong></>} <span aria-label={en ? 'Share' : 'Partager'}>↑</span>.</li><li>{en ? <>Choose <strong>Add to Home Screen</strong>, then confirm.</> : <>Choisissez <strong>Sur l’écran d’accueil</strong>, puis confirmez.</>}</li></ol>
      </section>
    </div>}
  </div>;
}
