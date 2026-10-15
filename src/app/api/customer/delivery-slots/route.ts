import { prisma } from '../../../../lib/db';
import { requireCustomer } from '../../../../lib/customer-session';
import { testOrdersEnabled } from '../../../../lib/test-mode';
import { brusselsDayWindow } from '../../../../lib/staff-dashboard.mjs';
// @ts-ignore JavaScript module; covered by unit tests
import { availableSlots, listBookableDates } from '../../../../lib/delivery-slots.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    await requireCustomer();
    const params = new URL(request.url).searchParams;
    const date = params.get('date') ?? '';
    const mode = params.get('mode') ?? '';
    const pizzaCount = Number(params.get('pizzaCount') ?? '0');
    if ([...params.keys()].some(key => !['date', 'mode', 'pizzaCount'].includes(key)) || !/^\d{4}-\d\d-\d\d$/.test(date) ||
        !['pickup', 'delivery'].includes(mode) || !Number.isSafeInteger(pizzaCount) || pizzaCount < 0 || pizzaCount > 99) {
      return Response.json({ error: 'INVALID_SLOT_REQUEST' }, { status: 400 });
    }
    const probe = new Date(`${date}T12:00:00.000Z`);
    const day = brusselsDayWindow(probe);
    if (day.date !== date) return Response.json({ error: 'INVALID_SLOT_DATE' }, { status: 400 });
    const config = await prisma.deliveryConfiguration.findUnique({ where: { id: 'global' } });
    if (!config) throw new Error('DELIVERY_CONFIGURATION_MISSING');
    const groups = await prisma.testOrder.groupBy({
      by: ['scheduledFor'],
      where: { scheduledFor: { gte: day.start, lt: day.end }, status: { notIn: ['REJECTED', 'CANCELLED', 'COMPLETED'] } },
      _sum: { pizzaCount: true },
    });
    const usedBySlot = Object.fromEntries(groups.map(group => [group.scheduledFor.toISOString(), group._sum.pizzaCount ?? 0]));
    const slots = availableSlots({ date, mode, pizzaCount, usedBySlot, pickupLeadMinutes: config.pickupLeadMinutes, slotPizzaCapacity: config.slotPizzaCapacity });
    return Response.json({ dates: listBookableDates(), slots, slotMinutes: 15 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'INVALID_SLOT_DATE' ? 400 : 503;
    return Response.json({ error: status === 503 ? 'SERVICE_UNAVAILABLE' : code }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
