import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
const parameters = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const prefix = 'scrypt$32768$8$3';
const dummy = `${prefix}$00000000000000000000000000000000$${'0'.repeat(128)}`;
export function validateCustomerAuth(input) {
  const fail = () => { throw new Error('INVALID_AUTH'); };
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['action', 'email', 'password', 'name', 'referralCode'].includes(key)) || !['login', 'register'].includes(input.action)) fail();
  if (typeof input.email !== 'string' || input.email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) fail();
  if (typeof input.password !== 'string' || input.password.length < 12 || Buffer.byteLength(input.password, 'utf8') > 256) fail();
  if (input.action === 'register' && (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 128)) fail();
  if (input.referralCode !== undefined && input.referralCode !== '' && (input.action !== 'register' || typeof input.referralCode !== 'string' || input.referralCode.length > 32 || !/^[a-z0-9]{6,32}$/i.test(input.referralCode.trim()))) fail();
  return { action: input.action, email: input.email.trim().toLowerCase(), password: input.password, name: input.action === 'register' ? input.name.trim() : undefined, referralCode: input.action === 'register' && typeof input.referralCode === 'string' && input.referralCode.trim() ? input.referralCode.trim().toLowerCase() : undefined };
}
export async function hashCustomerPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64, parameters);
  return `${prefix}$${salt}$${hash.toString('hex')}`;
}
export async function verifyCustomerPassword(password, encoded) {
  const valid = typeof encoded === 'string' && /^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded);
  const parts = (valid ? encoded : dummy).split('$');
  const calculated = await scrypt(password, parts[4], 64, parameters);
  return timingSafeEqual(calculated, Buffer.from(parts[5], 'hex')) && valid;
}
