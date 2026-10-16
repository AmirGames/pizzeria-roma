import 'server-only';
import { prisma } from './db';

export async function getCustomerLoyaltyStatus(userId: string) {
  const [completed, reserved] = await Promise.all([
    prisma.testOrder.aggregate({ where: { userId, status: 'COMPLETED' }, _sum: { loyaltyPaidDishCount: true } }),
    prisma.testOrder.aggregate({ where: { userId, status: { notIn: ['CANCELLED', 'REJECTED'] }, loyaltyFreeDishCount: { gt: 0 } }, _sum: { loyaltyFreeDishCount: true } }),
  ]);
  const paidDishCount = completed._sum.loyaltyPaidDishCount ?? 0;
  const reservedFreeDishCount = reserved._sum.loyaltyFreeDishCount ?? 0;
  return { paidDishCount, reservedFreeDishCount, progress: paidDishCount % 10, rewardsAvailable: Math.max(Math.floor(paidDishCount / 10) - reservedFreeDishCount, 0), rewardsReserved: reservedFreeDishCount };
}
