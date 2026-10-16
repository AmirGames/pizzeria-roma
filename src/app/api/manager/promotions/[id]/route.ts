import { prisma } from '../../../../../lib/db';
import { requirePermission } from '../../../../../lib/auth';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { readJson } from '../../../../../lib/http-json';
// @ts-ignore JavaScript module
import { validatePromotionInput } from '../../../../../lib/promotion-management.mjs';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('catalog:write');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const { id } = await context.params;
    const raw = await readJson(request, 4096) as Record<string, unknown>;
    const data = validatePromotionInput(raw);
    const changed = await prisma.$transaction(async tx => {
      const current = await tx.promotion.findUnique({ where: { id } });
      if (!current || current.revision !== raw.revision) return null;
      if (data.kind === 'AUTOMATIC' && data.active) await tx.promotion.updateMany({ where: { kind: 'AUTOMATIC', active: true, id: { not: id } }, data: { active: false, revision: { increment: 1 } } });
      const result = await tx.promotion.updateMany({ where: { id, revision: raw.revision as number }, data: { ...data, revision: { increment: 1 } } });
      return result.count === 1 ? tx.promotion.findUnique({ where: { id } }) : null;
    });
    return changed ? Response.json({ promotion: changed }, { headers: { 'Cache-Control': 'no-store' } }) : Response.json({ error: 'PROMOTION_CONFLICT' }, { status: 409 });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const uniqueConflict = typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
    const status = code === 'FORBIDDEN' ? 403 : code === 'INVALID_PROMOTION' || code === 'INVALID_REQUEST' ? 400 : uniqueConflict ? 409 : 503;
    return Response.json({ error: status === 403 ? 'FORBIDDEN' : status === 400 ? 'INVALID_PROMOTION' : status === 409 ? 'PROMOTION_CODE_EXISTS' : 'SERVICE_UNAVAILABLE' }, { status });
  }
}
