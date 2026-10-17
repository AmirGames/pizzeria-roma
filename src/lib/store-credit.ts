import 'server-only';
import { prisma } from './db';

export async function getStoreCredit(userId: string) {
  return prisma.$transaction(async tx => {
    const [entries, reservations] = await Promise.all([
      tx.storeCreditEntry.aggregate({ where: { userId }, _sum: { amountCents: true } }),
      tx.storeCreditReservation.aggregate({ where: { userId, status: 'ACTIVE' }, _sum: { amountCents: true } }),
    ]);
    const balanceCents = Math.max(0, (entries._sum.amountCents ?? 0) - (reservations._sum.amountCents ?? 0));
    const recentEntries = await tx.storeCreditEntry.findMany({
      where: { userId }, select: { id: true, kind: true, amountCents: true, note: true, createdAt: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 20,
    });
    return { balanceCents, recentEntries };
  }, { isolationLevel: 'RepeatableRead' });
}
