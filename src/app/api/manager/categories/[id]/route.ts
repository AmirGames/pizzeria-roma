import { prisma } from '../../../../../lib/db';
import { requirePermission } from '../../../../../lib/auth';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { validateMenuCategory } from '../../../../../lib/menu-management.mjs';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('catalog:write');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({ error: 'REQUEST_TOO_LARGE' }, { status: 413 });
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return Response.json({ error: 'INVALID_CATEGORY' }, { status: 400 }); }
    const { id } = await context.params;
    const result = await prisma.menuCategory.updateMany({ where: { id }, data: validateMenuCategory(input) });
    if (!result.count) return Response.json({ error: 'CATEGORY_NOT_FOUND' }, { status: 404 });
    const category = await prisma.menuCategory.findUniqueOrThrow({ where: { id } });
    return Response.json({ category }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : code === 'INVALID_MENU_ITEM' ? 400 : 503;
    return Response.json({ error: status === 503 ? 'CATALOG_UNAVAILABLE' : 'INVALID_CATEGORY' }, { status });
  }
}
