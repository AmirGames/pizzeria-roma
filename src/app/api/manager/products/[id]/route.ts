import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../../lib/db';
import { requirePermission } from '../../../../../lib/auth';
import { isSameOriginMutation, validateCatalogEdit } from '../../../../../lib/catalog-management.mjs';
import { invalidatePublicCatalog } from '../../../../../lib/public-catalog-cache';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('catalog:write');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 65536) return Response.json({ error: 'REQUEST_TOO_LARGE' }, { status: 413 });
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return Response.json({ error: 'INVALID_CATALOG_EDIT' }, { status: 400 }); }
    const { id } = await context.params;
    const product = await prisma.$transaction(async tx => {
      const current = await tx.product.findUnique({ where: { id }, include: { category: true, sizes: true, extras: true } });
      if (!current) throw new Error('PRODUCT_NOT_FOUND');
      const categoryId = input && typeof input === 'object' ? (input as { categoryId?: unknown }).categoryId : null;
      if (typeof categoryId !== 'string') throw new Error('INVALID_CATALOG_EDIT');
      const category = await tx.menuCategory.findUnique({ where: { id: categoryId } });
      if (!category) throw new Error('INVALID_CATALOG_EDIT');
      const edit = validateCatalogEdit(input, { ...current, category });
      if (category.fulfillmentCategory !== 'PIZZA' && edit.removableIngredients.length) throw new Error('INVALID_CATALOG_EDIT');
      const updated = await tx.product.updateMany({ where: { id, catalogRevision: edit.revision }, data: {
        categoryId, nameFr: edit.nameFr, nameEn: current.nameEn, active: edit.active, baseCents: edit.baseCents,
        ingredients: edit.ingredients, removableIngredients: edit.removableIngredients, catalogRevision: { increment: 1 },
      } });
      if (updated.count !== 1) throw new Error('CATALOG_CONFLICT');
      for (const size of edit.sizes) await tx.productSize.update({ where: { id: size.id, productId: id }, data: { priceCents: size.priceCents, active: size.active } });
      await tx.productExtra.updateMany({ where: { productId: id, id: { notIn: edit.extras.flatMap(extra => extra.id ? [extra.id] : []) } }, data: { active: false } });
      for (const extra of edit.extras) {
        const data = { nameFr: extra.nameFr, priceCents: extra.priceCents, active: extra.active, sizePrices: extra.sizePrices ?? Prisma.DbNull };
        if (extra.id) await tx.productExtra.update({ where: { id: extra.id, productId: id }, data });
        else await tx.productExtra.create({ data: { ...data, id: randomUUID(), productId: id, nameEn: extra.nameFr } });
      }
      return tx.product.findUniqueOrThrow({ where: { id }, include: { category: true, sizes: { orderBy: { priceCents: 'asc' } }, extras: { orderBy: { nameFr: 'asc' } } } });
    });
    invalidatePublicCatalog();
    return Response.json({ product }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : code === 'PRODUCT_NOT_FOUND' ? 404 : code === 'CATALOG_CONFLICT' ? 409 : code === 'INVALID_CATALOG_EDIT' ? 400 : 503;
    return Response.json({ error: status === 503 ? 'CATALOG_UNAVAILABLE' : code }, { status });
  }
}
