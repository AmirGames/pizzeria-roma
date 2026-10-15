import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/db';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
// @ts-ignore JavaScript module; covered by unit tests
import { redeemManagerAccess } from '../../../../lib/manager-access.mjs';
// @ts-ignore JavaScript module; covered by unit tests
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '../../../../lib/session-policy.mjs';
// @ts-ignore JavaScript module; covered by unit tests
import { hashSessionToken } from '../../../../lib/session-token.mjs';

export async function POST(request: Request) {
  if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 1024) return Response.json({ error: 'REQUEST_TOO_LARGE' }, { status: 413 });
    let input;
    try { input = JSON.parse(raw); } catch { throw new Error('INVALID_ACCESS'); }
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 || typeof input.token !== 'string') throw new Error('INVALID_ACCESS');
    const token = await prisma.$transaction(tx => redeemManagerAccess(tx, input.token));
    (await cookies()).set(SESSION_COOKIE, token, { ...SESSION_COOKIE_OPTIONS, secure: process.env.NODE_ENV !== 'development' });
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const invalid = error instanceof Error && error.message === 'INVALID_ACCESS';
    return Response.json({ error: invalid ? 'INVALID_ACCESS' : 'SERVICE_UNAVAILABLE' }, { status: invalid ? 401 : 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) {
      let tokenHash;
      try { tokenHash = hashSessionToken(token); } catch { /* Malformed cookie: simply clear it. */ }
      if (tokenHash) await prisma.session.deleteMany({ where: { tokenHash } });
    }
    jar.delete(SESSION_COOKIE);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 }); }
}
