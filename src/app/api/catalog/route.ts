import { loadPublicCatalog } from '../../../lib/public-catalog-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json({ categories: await loadPublicCatalog() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/catalog] Failed to load the public catalog:', error);
    return Response.json({ error: 'CATALOG_UNAVAILABLE' }, { status: 503 });
  }
}
