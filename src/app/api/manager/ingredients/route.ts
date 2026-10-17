import { prisma } from '../../../../lib/db';
import { requirePermission } from '../../../../lib/auth';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { invalidatePublicCatalog } from '../../../../lib/public-catalog-cache';
// @ts-ignore JavaScript module
import { validateIngredient } from '../../../../lib/ingredient-management.mjs';

export async function POST(request: Request) {
  try {
    await requirePermission('catalog:write');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({ error: 'REQUEST_TOO_LARGE' }, { status: 413 });
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return Response.json({ error: 'INVALID_INGREDIENT' }, { status: 400 }); }
    const ingredient = await prisma.ingredient.create({ data: validateIngredient(input) });
    invalidatePublicCatalog();
    return Response.json({ ingredient }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : code === 'INVALID_INGREDIENT' ? 400 : 503;
    return Response.json({ error: status === 503 ? 'INGREDIENT_CATALOG_UNAVAILABLE' : code }, { status });
  }
}
