import 'server-only';
import { prisma } from './db';
import { brusselsDayWindow, summarizeStaffDashboard } from './staff-dashboard.mjs';
export async function loadStaffDashboard() {
  const window = brusselsDayWindow();
  return prisma.$transaction(async tx => {
    const global = await tx.testOrder.groupBy({ by: ['status'], _count: { _all: true } });
    const today = await tx.testOrder.groupBy({ by: ['fulfillment', 'status'], where: { placedAt: { gte: window.start, lt: window.end } }, _count: { _all: true } });
    return { ...summarizeStaffDashboard(global, today), date: window.date, refreshedAt: new Date() };
  }, { isolationLevel: 'RepeatableRead' });
}
