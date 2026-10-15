import 'server-only';
import { prisma } from './db';
import type { Prisma } from '@prisma/client';
import { CUSTOMER_HISTORY_PAGE_SIZE, type CustomerHistoryFilters } from './customer-history.mjs';
export async function listCustomerOrderHistory(userId: string, filters: CustomerHistoryFilters) {
  const where: Prisma.TestOrderWhereInput = { userId, ...(filters.status ? { status: filters.status } : {}), ...(filters.q ? { publicReference: { contains: filters.q, mode: 'insensitive' } } : {}) };
  return prisma.$transaction(async tx => {
    const total = await tx.testOrder.count({ where });
    const pages = Math.max(1, Math.ceil(total / CUSTOMER_HISTORY_PAGE_SIZE));
    const page = Math.min(filters.page, pages);
    const orders = await tx.testOrder.findMany({ where, select: { id: true, publicReference: true, status: true, totalCents: true, placedAt: true }, orderBy: [{ placedAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * CUSTOMER_HISTORY_PAGE_SIZE, take: CUSTOMER_HISTORY_PAGE_SIZE });
    return { orders, total, page, pages };
  }, { isolationLevel: 'RepeatableRead' });
}
export type CustomerOrderHistoryResult = Awaited<ReturnType<typeof listCustomerOrderHistory>>;
