import { prisma } from '../../../../../lib/db';
import { requirePermission } from '../../../../../lib/auth';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
// @ts-ignore JavaScript module
import { validateIngredient } from '../../../../../lib/ingredient-management.mjs';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('catalog:write');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({ error: 'REQUEST_TOO_LARGE' }, { status: 413 });
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return Response.json({ error: 'INVALID_INGREDIENT' }, { status: 400 }); }
    const { id } = await context.params;
    const data = validateIngredient(input);
    const ingredient = await prisma.$transaction(async tx => {
      const current = await tx.ingredient.findUnique({ where: { id } });
      if (!current) return null;
      const updated = await tx.ingredient.update({ where: { id }, data });
      if (current.nameFr !== data.nameFr) {
        const products = await tx.product.findMany({ where: { OR: [{ ingredients: { has: current.nameFr } }, { removableIngredients: { has: current.nameFr } }] }, select: { id: true, ingredients: true, removableIngredients: true } });
        for (const product of products) await tx.product.update({ where: { id: product.id }, data: {
          ingredients: product.ingredients.map(name => name === current.nameFr ? data.nameFr : name),
          removableIngredients: product.removableIngredients.map(name => name === current.nameFr ? data.nameFr : name),
          catalogRevision: { increment: 1 },
        } });
      }
      return updated;
    });
    if (!ingredient) return Response.json({ error: 'INGREDIENT_NOT_FOUND' }, { status: 404 });
    return Response.json({ ingredient }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : code === 'INVALID_INGREDIENT' ? 400 : 503;
    return Response.json({ error: status === 503 ? 'INGREDIENT_CATALOG_UNAVAILABLE' : code }, { status });
  }
}
