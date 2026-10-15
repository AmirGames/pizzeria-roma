function invalid() { throw new Error('INVALID_PROFILE'); }
export function validateCustomerProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['name', 'phone'].includes(key)) ||
      typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 128 ||
      typeof input.phone !== 'string' || (input.phone.trim() !== '' && !/^\+?[0-9 ()-]{7,30}$/.test(input.phone.trim()))) invalid();
  return { name: input.name.trim(), phone: input.phone.trim() || null };
}
export function validatePasswordChange(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['currentPassword', 'newPassword', 'confirmation'].includes(key))) invalid();
  for (const value of [input.currentPassword, input.newPassword]) {
    if (typeof value !== 'string' || value.length < 12 || Buffer.byteLength(value, 'utf8') > 256) invalid();
  }
  if (input.newPassword !== input.confirmation || input.newPassword === input.currentPassword) invalid();
  return { currentPassword: input.currentPassword, newPassword: input.newPassword };
}
