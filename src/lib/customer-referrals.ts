import 'server-only';
import { prisma } from './db';

export const REFERRAL_REWARD_CENTS = 500;

export async function getCustomerReferralSummary(userId: string) {
  const [user, pending, rewarded] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } }),
    prisma.referral.count({ where: { referrerId: userId, status: 'PENDING' } }),
    prisma.referral.count({ where: { referrerId: userId, status: 'REWARDED' } }),
  ]);
  if (!user) return null;
  return { code: user.referralCode, pending, rewarded };
}
