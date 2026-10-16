import { normalizePromotionCode } from './promotions.mjs';

const keys = ['name', 'kind', 'code', 'discountType', 'value', 'minimumSubtotalCents', 'validFrom', 'validUntil', 'weekdays', 'startTime', 'endTime', 'usageLimit', 'active', 'revision'];

export function validatePromotionInput(input, creating = false) {
  const fail = () => { throw new Error('INVALID_PROMOTION'); };
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !keys.includes(key))) fail();
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 100 || !['AUTOMATIC', 'CODE'].includes(input.kind) || !['PERCENT', 'FIXED'].includes(input.discountType)) fail();
  if (input.kind === 'CODE' && (typeof input.code !== 'string' || !/^[A-Za-z0-9-]{3,32}$/.test(input.code.trim()))) fail();
  if (input.kind === 'AUTOMATIC' && input.code != null && input.code !== '') fail();
  if (!Number.isSafeInteger(input.value) || input.value < 1 || (input.discountType === 'PERCENT' ? input.value > 100 : input.value > 100_000_000)) fail();
  if (!Number.isSafeInteger(input.minimumSubtotalCents) || input.minimumSubtotalCents < 0 || input.minimumSubtotalCents > 100_000_000) fail();
  const date = value => {
    if (value === null || value === '') return null;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) || new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value) fail();
    return new Date(`${value}T00:00:00.000Z`);
  };
  const validFrom = date(input.validFrom);
  const validUntil = date(input.validUntil);
  if (validFrom && validUntil && validUntil < validFrom) fail();
  if (!Array.isArray(input.weekdays) || input.weekdays.length < 1 || input.weekdays.length > 7 || new Set(input.weekdays).size !== input.weekdays.length || !input.weekdays.every(day => Number.isSafeInteger(day) && day >= 1 && day <= 7)) fail();
  const startTime = input.startTime === '' ? null : input.startTime;
  const endTime = input.endTime === '' ? null : input.endTime;
  if ((startTime === null) !== (endTime === null) || (startTime !== null && (typeof startTime !== 'string' || typeof endTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime))) fail();
  if (input.usageLimit !== null && (!Number.isSafeInteger(input.usageLimit) || input.usageLimit < 1 || input.usageLimit > 1_000_000)) fail();
  if (typeof input.active !== 'boolean' || (!creating && (!Number.isSafeInteger(input.revision) || input.revision < 0))) fail();
  return {
    name: input.name.trim(), kind: input.kind, code: input.kind === 'CODE' ? normalizePromotionCode(input.code) : null,
    discountType: input.discountType, value: input.value, minimumSubtotalCents: input.minimumSubtotalCents,
    validFrom, validUntil, weekdays: input.weekdays, startTime, endTime, usageLimit: input.usageLimit, active: input.active,
  };
}
