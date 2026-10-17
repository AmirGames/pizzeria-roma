export function realOrdersEnabled() {
  return process.env.ENABLE_REAL_ORDERS === 'true';
}

export function stripeReady() {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  const origin = process.env.APP_ORIGIN ?? '';
  try {
    const url = new URL(origin);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return false;
    if (key.startsWith('sk_live_') && (process.env.ENABLE_LIVE_PAYMENTS !== 'true' || url.protocol !== 'https:')) return false;
  } catch { return false; }
  return (key.startsWith('sk_test_') || (key.startsWith('sk_live_') && process.env.ENABLE_LIVE_PAYMENTS === 'true')) && !!process.env.STRIPE_WEBHOOK_SECRET;
}

export function configuredStripeMethods() {
  // Apple Pay and Google Pay are presented by Stripe Checkout as eligible card wallets.
  return ['card', 'bancontact'] as const;
}

export function nextRealOrderStatuses(status: string, fulfillment: string) {
  return ({
    ACCEPTED: ['PREPARING'],
    PREPARING: ['READY'],
    READY: fulfillment === 'DELIVERY' ? ['OUT_FOR_DELIVERY'] : ['COMPLETED'],
    OUT_FOR_DELIVERY: ['COMPLETED'],
  } as Record<string, string[]>)[status] ?? [];
}
