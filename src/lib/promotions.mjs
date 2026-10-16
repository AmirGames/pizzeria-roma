export function normalizePromotionCode(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase();
}

export function promotionDiscount(promotion, subtotalCents, now = new Date()) {
  if (!promotion || promotion.active !== true || !Number.isSafeInteger(subtotalCents) || subtotalCents < 0) return 0;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const localDate = `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}-${parts.find(part => part.type === 'day')?.value}`;
  if (promotion.validFrom && localDate < new Date(promotion.validFrom).toISOString().slice(0, 10)) return 0;
  if (promotion.validUntil && localDate > new Date(promotion.validUntil).toISOString().slice(0, 10)) return 0;
  const weekdayLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Brussels', weekday: 'short' }).format(now);
  const weekday = ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 })[weekdayLabel];
  if (!Array.isArray(promotion.weekdays) || !promotion.weekdays.includes(weekday)) return 0;
  if (promotion.startTime && promotion.endTime) {
    const timeParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const localTime = `${timeParts.find(part => part.type === 'hour')?.value}:${timeParts.find(part => part.type === 'minute')?.value}`;
    if (localTime < promotion.startTime || localTime >= promotion.endTime) return 0;
  }
  if (promotion.usageLimit != null && promotion.usageCount >= promotion.usageLimit) return 0;
  if (subtotalCents < promotion.minimumSubtotalCents) return 0;
  if (promotion.discountType === 'PERCENT' && Number.isSafeInteger(promotion.value) && promotion.value >= 1 && promotion.value <= 100) {
    return Math.min(subtotalCents, Math.floor(subtotalCents * promotion.value / 100));
  }
  if (promotion.discountType === 'FIXED' && Number.isSafeInteger(promotion.value) && promotion.value > 0) {
    return Math.min(subtotalCents, promotion.value);
  }
  return 0;
}

export function selectPromotion({ automatic, codePromotion, code, subtotalCents, now = new Date() }) {
  const normalizedCode = normalizePromotionCode(code);
  const automaticDiscount = promotionDiscount(automatic, subtotalCents, now);
  const codeMatches = !!normalizedCode && codePromotion && normalizePromotionCode(codePromotion.code) === normalizedCode;
  const codeDiscount = codeMatches ? promotionDiscount(codePromotion, subtotalCents, now) : 0;
  const chosen = codeDiscount > 0 && codeDiscount >= automaticDiscount ? codePromotion : automaticDiscount ? automatic : null;
  const discountCents = chosen ? (chosen === codePromotion ? codeDiscount : automaticDiscount) : 0;
  let codeError = '';
  if (normalizedCode && !codeDiscount) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const localDate = `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}-${parts.find(part => part.type === 'day')?.value}`;
    const weekdayLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Brussels', weekday: 'short' }).format(now);
    const weekday = ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 })[weekdayLabel];
    const timeParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const localTime = `${timeParts.find(part => part.type === 'hour')?.value}:${timeParts.find(part => part.type === 'minute')?.value}`;
    codeError = !codeMatches ? 'CODE_INVALIDE' : codePromotion.usageLimit != null && codePromotion.usageCount >= codePromotion.usageLimit ? 'CODE_EPUISE' : !codePromotion.active ? 'CODE_INACTIF' : codePromotion.validFrom && localDate < new Date(codePromotion.validFrom).toISOString().slice(0, 10) ? 'CODE_PAS_ENCORE_VALIDE' : codePromotion.validUntil && localDate > new Date(codePromotion.validUntil).toISOString().slice(0, 10) ? 'CODE_EXPIRE' : !codePromotion.weekdays.includes(weekday) || (codePromotion.startTime && (localTime < codePromotion.startTime || localTime >= codePromotion.endTime)) ? 'CODE_HORS_HORAIRE' : subtotalCents < codePromotion.minimumSubtotalCents ? 'MONTANT_MINIMUM_NON_ATTEINT' : 'CODE_INACTIF';
  }
  return { promotion: chosen ? { id: chosen.id, name: chosen.name, code: chosen.code ?? null } : null, discountCents, totalCents: subtotalCents - discountCents, codeError, codeNotSelected: !!codeDiscount && chosen !== codePromotion };
}
