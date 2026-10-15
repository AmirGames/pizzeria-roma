import type { OrderStatus, FulfillmentType } from '@prisma/client';
export type DashboardGroup = { status: OrderStatus; _count: { _all: number } };
export function brusselsDayWindow(now?: Date): { date: string; start: Date; end: Date };
export function summarizeStaffDashboard(globalGroups: DashboardGroup[], dayGroups: Array<DashboardGroup & { fulfillment: FulfillmentType }>): { statuses: Record<OrderStatus, number>; active: number; today: { total: number; pickup: number; delivery: number; cancelledOrRejected: number } };
