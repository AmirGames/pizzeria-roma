import { createHash, randomBytes } from 'node:crypto';

// Store only the SHA-256 hash in the database, never the bearer token.
export function createSessionToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashSessionToken(token) };
}

export function hashSessionToken(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new TypeError('Invalid session token');
  }
  return createHash('sha256').update(token).digest('hex');
}
