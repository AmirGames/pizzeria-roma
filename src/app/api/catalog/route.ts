import { prisma } from '../../../lib/db';
// @ts-ignore JavaScript module; covered by unit tests
import { buildPublicCatalog } from '../../../lib/public-catalog.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: [{ position: 'asc' }, { nameFr: 'asc' }],
      select: {
        id: true, nameFr: true, position: true, fulfillmentCategory: true,
        products: { where: { active: true }, select: {
          id: true, nameFr: true, active: true, baseCents: true, choiceLabel: true, extraSelectionMode: true,
          sizes: { where: { active: true }, orderBy: [{ priceCents: 'asc' }, { label: 'asc' }], select: { id: true, label: true, priceCents: true } },
          extras: { where: { active: true }, select: { id: true, nameFr: true, priceCents: true } },
        } },
      },
    });
    return Response.json({ categories: buildPublicCatalog(categories) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'CATALOG_UNAVAILABLE' }, { status: 503 });
  }
}
