import { prisma } from '../../../../lib/db';
import { requireCustomer } from '../../../../lib/customer-session';
import { testOrdersEnabled } from '../../../../lib/test-mode';
import { realOrdersEnabled } from '../../../../lib/real-orders';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!testOrdersEnabled() && !realOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const user = await requireCustomer();
    const data = await prisma.user.findFirst({
      where: { id: user.id, role: 'CUSTOMER', disabledAt: null },
      select: {
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        customerAddresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
          select: { label: true, address: true, zoneId: true, isDefault: true, createdAt: true, updatedAt: true },
        },
        testOrders: {
          orderBy: [{ placedAt: 'desc' }, { id: 'desc' }],
          select: {
            publicReference: true,
            fulfillment: true,
            zoneId: true,
            scheduledFor: true,
            pizzaCount: true,
            contactName: true,
            phone: true,
            address: true,
            comment: true,
            status: true,
            totalCents: true,
            itemsSnapshot: true,
            placedAt: true,
            updatedAt: true,
          },
        },
        orders: {
          orderBy: [{ placedAt: 'desc' }, { id: 'desc' }],
          select: {
            publicReference: true,
            guestEmail: true,
            fulfillment: true,
            status: true,
            totalCents: true,
            subtotalCents: true,
            discountCents: true,
            loyaltyDiscountCents: true,
            loyaltyPaidDishCount: true,
            loyaltyFreeDishCount: true,
            promotionName: true,
            creditAppliedCents: true,
            currency: true,
            itemsSnapshot: true,
            placedAt: true,
            updatedAt: true,
            items: { select: { nameSnapshot: true, quantity: true, unitPriceCents: true } },
          },
        },
      },
    });
    if (!data) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

    const filename = `pizzeria-roma-donnees-${new Date().toISOString().slice(0, 10)}.json`;
    return new Response(JSON.stringify({ format: 'pizzeria-roma-customer-export-v1', exportedAt: new Date().toISOString(), account: data }, null, 2), {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return Response.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    return Response.json({ error: 'EXPORT_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
