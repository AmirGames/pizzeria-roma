import type { OrderStatus } from '@prisma/client';
import { prisma } from '../../../../../lib/db';
import { requirePermission } from '../../../../../lib/auth';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { nextTestStatuses } from '../../../../../lib/test-order-policy.mjs';
import { testOrdersEnabled } from '../../../../../lib/test-mode';
import { readJson } from '../../../../../lib/http-json';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    await requirePermission('orders:update-status');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = await readJson(request, 1024) as { status?: string; revision?: number };
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['status', 'revision'].includes(key)) || typeof input.status !== 'string' || !Number.isSafeInteger(input.revision)) return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    const { id } = await context.params;
    const current = await prisma.testOrder.findUnique({ where: { id } });
    if (!current) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    if (!nextTestStatuses(current.status, current.fulfillment).includes(input.status)) return Response.json({ error: 'INVALID_TRANSITION' }, { status: 400 });
    const result = await prisma.testOrder.updateMany({ where: { id, revision: input.revision, status: current.status }, data: { status: input.status as OrderStatus, revision: { increment: 1 } } });
    return Response.json({ ok: result.count === 1 }, { status: result.count === 1 ? 200 : 409 });
  } catch (error) { return Response.json({ error: 'UNAVAILABLE' }, { status: error instanceof Error && error.message === 'FORBIDDEN' ? 403 : error instanceof Error && error.message === 'INVALID_REQUEST' ? 400 : 503 }); }
}
