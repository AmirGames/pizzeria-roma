'use client';

import { useState } from 'react';

export default function ReferralCard({ code, pending, rewarded, rewardCents }: { code: string; pending: number; rewarded: number; rewardCents: number }) {
  const [copied, setCopied] = useState(false);
  const reward = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(rewardCents / 100);
  async function copyLink() {
    const link = `${window.location.origin}/compte?parrain=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }
  return <section id="parrainage" className="customer-referral" aria-labelledby="customer-referral-title">
    <div><p className="eyebrow">FAITES DÉCOUVRIR ROMA</p><h2 id="customer-referral-title">Parrainez vos proches</h2>
      <p>Partagez votre lien. Après la première commande payée et terminée de votre proche, vous recevez chacun <strong>{reward} d’avoir</strong> sur votre compte.</p>
      <div className="customer-referral-link"><span>Votre code : <strong>{code}</strong></span><button type="button" onClick={copyLink}>{copied ? 'Lien copié !' : 'Copier mon lien'}</button></div>
      <p className="customer-referral-note" aria-live="polite">{copied ? 'Vous pouvez maintenant envoyer ce lien à votre proche.' : 'Le parrainage est réservé aux nouveaux comptes. L’avoir est ajouté après la commande terminée.'}</p>
    </div>
    <div className="customer-referral-stats" aria-label="Suivi de vos parrainages"><article><strong>{pending}</strong><span>en attente</span></article><article><strong>{rewarded}</strong><span>récompensé(s)</span></article></div>
  </section>;
}
