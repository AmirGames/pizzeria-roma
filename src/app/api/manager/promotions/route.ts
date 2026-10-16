import { prisma } from '../../../../lib/db';
import { requirePermission } from '../../../../lib/auth';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { readJson } from '../../../../lib/http-json';
// @ts-ignore JavaScript module
import { validatePromotionInput } from '../../../../lib/promotion-management.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission('catalog:write');
    const promotions = await prisma.promotion.findMany({ orderBy: [{ kind: 'asc' }, { updatedAt: 'desc' }] });
    return Response.json({ promotions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 503;
    return Response.json({ error: status === 403 ? 'FORBIDDEN' : 'SERVICE_UNAVAILABLE' }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission('catalog:write');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = validatePromotionInput(await readJson(request, 4096), true);
    const promotion = await prisma.$transaction(async tx => {
      if (input.kind === 'AUTOMATIC' && input.active) await tx.promotion.updateMany({ where: { kind: 'AUTOMATIC', active: true }, data: { active: false, revision: { increment: 1 } } });
      return tx.promotion.create({ data: input });
    });
    return Response.json({ promotion }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const uniqueConflict = typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
    const status = code === 'FORBIDDEN' ? 403 : code === 'INVALID_PROMOTION' || code === 'INVALID_REQUEST' ? 400 : uniqueConflict ? 409 : 503;
    return Response.json({ error: status === 403 ? 'FORBIDDEN' : status === 400 ? 'INVALID_PROMOTION' : status === 409 ? 'PROMOTION_CODE_EXISTS' : 'SERVICE_UNAVAILABLE' }, { status });
  }
}
