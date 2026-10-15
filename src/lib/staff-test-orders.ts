import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from './db';
import { ACTIVE_TEST_STATUSES, STAFF_TEST_PAGE_SIZE, type StaffTestFilters } from './staff-test-filters.mjs';
export async function listStaffTestOrders(filters: StaffTestFilters) {
  const where: Prisma.TestOrderWhereInput = {
    ...(filters.status === 'active' ? { status: { in: [...ACTIVE_TEST_STATUSES] } } : filters.status !== 'all' ? { status: filters.status } : {}),
    ...(filters.fulfillment ? { fulfillment: filters.fulfillment } : {}),
    ...(filters.q ? { publicReference: { contains: filters.q, mode: 'insensitive' } } : {}),
  };
  const direction = filters.sort === 'oldest' ? 'asc' : 'desc';
  return prisma.$transaction(async tx => {
    const total = await tx.testOrder.count({ where });
    const pages = Math.max(1, Math.ceil(total / STAFF_TEST_PAGE_SIZE));
    const page = Math.min(filters.page, pages);
    const orders = await tx.testOrder.findMany({ where, select: { id: true, publicReference: true, status: true, placedAt: true, scheduledFor: true, contactName: true, phone: true, fulfillment: true, address: true, zoneId: true, comment: true, itemsSnapshot: true, totalCents: true, revision: true }, orderBy: [{ placedAt: direction }, { id: direction }], skip: (page - 1) * STAFF_TEST_PAGE_SIZE, take: STAFF_TEST_PAGE_SIZE });
    return { orders, total, page, pages };
  }, { isolationLevel: 'RepeatableRead' });
}
