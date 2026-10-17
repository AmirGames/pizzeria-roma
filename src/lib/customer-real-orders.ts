import 'server-only';
import { prisma } from './db';

export async function listCustomerRealOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    select: {
      id: true,
      publicReference: true,
      status: true,
      paymentStatus: true,
      fulfillment: true,
      scheduledFor: true,
      totalCents: true,
      creditAppliedCents: true,
      currency: true,
      placedAt: true,
    },
    orderBy: [{ placedAt: 'desc' }, { id: 'desc' }],
    take: 50,
  });
}

export type CustomerRealOrders = Awaited<ReturnType<typeof listCustomerRealOrders>>;
