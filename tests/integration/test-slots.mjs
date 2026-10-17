import { availableSlots, listBookableDates } from '../../src/lib/delivery-slots.mjs';

/** Pick a currently available slot so integration requests exercise the order flow. */
export async function nextTestSlot(prisma, { mode = 'pickup', pizzaCount = 1 } = {}) {
  const config = await prisma.deliveryConfiguration.findUniqueOrThrow({ where: { id: 'global' } });
  const now = new Date();
  for (const date of listBookableDates(now)) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 86_400_000);
    const reservations = await prisma.testOrder.groupBy({
      by: ['scheduledFor'],
      where: { scheduledFor: { gte: start, lt: end }, status: { notIn: ['REJECTED', 'CANCELLED'] } },
      _sum: { pizzaCount: true },
    });
    const usedBySlot = Object.fromEntries(reservations.map(row => [row.scheduledFor.toISOString(), row._sum.pizzaCount ?? 0]));
    const slot = availableSlots({ date, mode, now, pizzaCount, usedBySlot, leadTimeMinutes: config.leadTimeMinutes, slotPizzaCapacity: config.slotPizzaCapacity })[0];
    if (slot) return slot.value;
  }
  throw new Error('No available integration-test slot');
}
