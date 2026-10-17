import { createHash } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const subjectLabels: Record<string, string> = {
  question: 'Question générale',
  commande: 'À propos d’une commande',
  carte: 'Carte et allergènes',
  autre: 'Autre demande',
};
const attempts = new Map<string, { count: number; startedAt: number }>();
const windowMs = 10 * 60 * 1000;

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function limited(key: string, now: number) {
  for (const [entry, value] of attempts) if (now - value.startedAt > windowMs) attempts.delete(entry);
  if (attempts.size > 2000) attempts.clear();
  const current = attempts.get(key);
  if (!current || now - current.startedAt > windowMs) {
    attempts.set(key, { count: 1, startedAt: now });
    return false;
  }
  current.count += 1;
  return current.count > 3;
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'INVALID_REQUEST' }, { status: 403 });

  let input: Record<string, unknown>;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    input = body as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'INVALID_MESSAGE' }, { status: 400 });
  }

  // Quietly accept bot submissions without forwarding them.
  if (text(input.website, 200)) return Response.json({ ok: true });

  const name = text(input.name, 100);
  const email = text(input.email, 254).toLowerCase();
  const subject = text(input.subject, 40);
  const message = text(input.message, 4000);
  if (!name || !validEmail(email) || !subjectLabels[subject] || message.length < 10) {
    return Response.json({ error: 'INVALID_MESSAGE' }, { status: 400 });
  }

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const client = forwarded || request.headers.get('x-real-ip') || 'unknown';
  const key = createHash('sha256').update(client).digest('hex');
  if (limited(key, Date.now())) return Response.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429, headers: { 'Retry-After': '600' } });

  const to = process.env.CONTACT_EMAIL?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  if (!to || !apiKey || !from) return Response.json({ error: 'CONTACT_UNAVAILABLE' }, { status: 503 });

  const safeName = name.replace(/[\r\n\u0000-\u001f]/g, ' ').trim();
  const safeMessage = message.replace(/\u0000/g, '');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[Pizzeria Roma] ${subjectLabels[subject]}`,
        text: `Nom : ${safeName}\nE-mail : ${email}\n\n${safeMessage}`,
      }),
    });
    if (!response.ok) return Response.json({ error: 'CONTACT_UNAVAILABLE' }, { status: 503 });
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'CONTACT_UNAVAILABLE' }, { status: 503 });
  }
}
