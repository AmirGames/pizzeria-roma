import { PrismaClient } from '@prisma/client';
import { parseArgs } from 'node:util';
import { createSessionToken } from '../src/lib/session-token.mjs';

// Operator-only provisioning. Never run this from a public request or during build/seed.
const { values } = parseArgs({ options: { email: { type: 'string' }, origin: { type: 'string' } } });
const email = values.email?.trim().toLowerCase();
const origin = new URL(values.origin ?? 'http://localhost:3000');
if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))) || origin.username || origin.password) {
  throw new Error('Usage : npm run manager:access -- --email gerant@example.be --origin https://votre-site.be');
}
const prisma = new PrismaClient();
try {
  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await prisma.$transaction(async tx => {
    const user = await tx.user.upsert({ where: { email }, create: { email, role: 'MANAGER' }, update: {} });
    if (user.role !== 'MANAGER' || user.disabledAt) throw new Error('Ce compte existe sans accès gérant actif. Aucune promotion automatique.');
    await tx.managerAccessToken.deleteMany({ where: { OR: [{ userId: user.id }, { expiresAt: { lte: new Date() } }] } });
    await tx.managerAccessToken.create({ data: { tokenHash, userId: user.id, expiresAt } });
  });
  // The fragment is never sent in HTTP requests. Keep this link private.
  console.log(`Lien privé à usage unique, valable 15 minutes :\n${origin.origin}/gerant/connexion#${token}`);
} finally { await prisma.$disconnect(); }
