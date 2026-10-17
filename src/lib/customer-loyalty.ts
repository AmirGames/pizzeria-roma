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

export async function getCustomerRealLoyaltyStatus(userId: string) {
  const now = new Date();
  const [completed, reserved] = await Promise.all([
    prisma.order.aggregate({ where: { userId, status: 'COMPLETED', paymentStatus: { in: ['PAID', 'CREDITED'] } }, _sum: { loyaltyPaidDishCount: true } }),
    prisma.order.aggregate({ where: { userId, loyaltyFreeDishCount: { gt: 0 }, OR: [
      { paymentStatus: { in: ['PAID', 'CREDITED'] }, status: { notIn: ['CANCELLED', 'REJECTED'] } },
      { paymentStatus: 'PENDING', status: 'PENDING', placedAt: { gt: new Date(now.getTime() - 45 * 60_000) } },
    ] }, _sum: { loyaltyFreeDishCount: true } }),
  ]);
  const paidDishCount = completed._sum.loyaltyPaidDishCount ?? 0;
  const reservedFreeDishCount = reserved._sum.loyaltyFreeDishCount ?? 0;
  return { paidDishCount, reservedFreeDishCount, progress: paidDishCount % 10, rewardsAvailable: Math.max(Math.floor(paidDishCount / 10) - reservedFreeDishCount, 0), rewardsReserved: reservedFreeDishCount };
}
