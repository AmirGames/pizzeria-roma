import { prisma } from '../../../../lib/db';
import { realOrdersEnabled } from '../../../../lib/real-orders';
import { brusselsDayWindow } from '../../../../lib/staff-dashboard.mjs';
// @ts-ignore JavaScript module
import { availableSlots, listBookableDates } from '../../../../lib/delivery-slots.mjs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!realOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  const params = new URL(request.url).searchParams;
  const date = params.get('date') ?? '';
  const mode = params.get('mode') ?? '';
  const pizzaCount = Number(params.get('pizzaCount') ?? '0');
  if ([...params.keys()].some(key => !['date','mode','pizzaCount'].includes(key)) || !/^\d{4}-\d\d-\d\d$/.test(date) || !['pickup','delivery'].includes(mode) || !Number.isSafeInteger(pizzaCount) || pizzaCount < 0 || pizzaCount > 99) return Response.json({ error: 'INVALID_SLOT_REQUEST' }, { status: 400 });
  try {
    const day = brusselsDayWindow(new Date(`${date}T12:00:00.000Z`));
    if (day.date !== date) return Response.json({ error: 'INVALID_SLOT_DATE' }, { status: 400 });
    const config = await prisma.deliveryConfiguration.findUnique({ where: { id: 'global' } });
    if (!config) throw new Error('DELIVERY_CONFIGURATION_MISSING');
    const reservations = await prisma.order.findMany({ where: {
      scheduledFor: { gte: day.start, lt: day.end }, OR: [
        { paymentStatus: { in: ['PAID', 'CREDITED'] }, status: { notIn: ['REJECTED','CANCELLED'] } },
        { paymentStatus: 'PENDING', status: 'PENDING', placedAt: { gt: new Date(Date.now() - 45 * 60_000) } },
      ],
    }, select: { scheduledFor: true, pizzaCount: true } });
    const usedBySlot: Record<string, number> = {};
    for (const order of reservations) if (order.scheduledFor) usedBySlot[order.scheduledFor.toISOString()] = (usedBySlot[order.scheduledFor.toISOString()] ?? 0) + order.pizzaCount;
    const slots = availableSlots({ date, mode, pizzaCount, usedBySlot, leadTimeMinutes: config.leadTimeMinutes, slotPizzaCapacity: config.slotPizzaCapacity });
    return Response.json({ dates: listBookableDates(), slots, slotMinutes: 15 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
