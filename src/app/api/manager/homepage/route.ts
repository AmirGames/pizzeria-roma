import { prisma } from '../../../../lib/db';
import { requirePermission } from '../../../../lib/auth';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { readJson } from '../../../../lib/http-json';

export const dynamic = 'force-dynamic';

const limits = {
  eyebrow: 80,
  title: 180,
  intro: 500,
  primaryLabel: 60,
  secondaryLabel: 60,
  heroImage: 300,
  aboutTitle: 180,
  aboutTextOne: 500,
  aboutTextTwo: 500,
  metaTitle: 70,
  metaDescription: 170,
} as const;
type ContentFields = { -readonly [Key in keyof typeof limits]: string };
type ValidContent = ContentFields & { revision: number };
type StoredContent = ContentFields & { id: string; revision: number };

function validate(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const data = input as Record<string, unknown>;
  if (Object.keys(data).some(key => ![...Object.keys(limits), 'revision'].includes(key)) ||
      !Number.isSafeInteger(data.revision) || (data.revision as number) < 0) return null;
  const clean = {} as ContentFields;
  for (const [key, max] of Object.entries(limits)) {
    const field = key as keyof typeof limits;
    const value = data[field];
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(trimmed)) return null;
    clean[field] = trimmed;
  }
  if (!clean.heroImage.startsWith('/') || clean.heroImage.startsWith('//') || clean.heroImage.includes('..') || /[?#\\]/.test(clean.heroImage)) return null;
  return { ...clean, revision: data.revision as number } satisfies ValidContent;
}

export async function PUT(request: Request) {
  try {
    await requirePermission('homepage:write');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = validate(await readJson(request, 8192));
    if (!input) return Response.json({ error: 'INVALID_CONTENT' }, { status: 400 });
    const { revision, ...content } = input;

    const updated = await prisma.$queryRaw<StoredContent[]>`
      UPDATE "HomePageContent" SET
        "eyebrow" = ${content.eyebrow}, "title" = ${content.title}, "intro" = ${content.intro},
        "primaryLabel" = ${content.primaryLabel}, "secondaryLabel" = ${content.secondaryLabel}, "heroImage" = ${content.heroImage},
        "aboutTitle" = ${content.aboutTitle}, "aboutTextOne" = ${content.aboutTextOne}, "aboutTextTwo" = ${content.aboutTextTwo},
        "metaTitle" = ${content.metaTitle}, "metaDescription" = ${content.metaDescription},
        "revision" = "revision" + 1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = 'global' AND "revision" = ${revision}
      RETURNING "id", "eyebrow", "title", "intro", "primaryLabel", "secondaryLabel", "heroImage", "aboutTitle", "aboutTextOne", "aboutTextTwo", "metaTitle", "metaDescription", "revision"`;
    if (updated.length > 0) return Response.json({ content: updated[0] }, { headers: { 'Cache-Control': 'no-store' } });
    const exists = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "HomePageContent" WHERE "id" = 'global' LIMIT 1`;
    if (exists.length > 0) return Response.json({ error: 'CONTENT_CONFLICT' }, { status: 409 });
    try {
      const created = await prisma.$queryRaw<StoredContent[]>`
        INSERT INTO "HomePageContent" ("id", "eyebrow", "title", "intro", "primaryLabel", "secondaryLabel", "heroImage", "aboutTitle", "aboutTextOne", "aboutTextTwo", "metaTitle", "metaDescription", "revision", "updatedAt")
        VALUES ('global', ${content.eyebrow}, ${content.title}, ${content.intro}, ${content.primaryLabel}, ${content.secondaryLabel}, ${content.heroImage}, ${content.aboutTitle}, ${content.aboutTextOne}, ${content.aboutTextTwo}, ${content.metaTitle}, ${content.metaDescription}, 1, CURRENT_TIMESTAMP)
        RETURNING "id", "eyebrow", "title", "intro", "primaryLabel", "secondaryLabel", "heroImage", "aboutTitle", "aboutTextOne", "aboutTextTwo", "metaTitle", "metaDescription", "revision"`;
      return Response.json({ content: created[0] }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      const duplicate = typeof error === 'object' && error !== null && 'code' in error && (error.code === 'P2002' || error.code === 'P2010');
      if (duplicate) return Response.json({ error: 'CONTENT_CONFLICT' }, { status: 409 });
      throw error;
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : code === 'INVALID_REQUEST' ? 400 : 503;
    return Response.json({ error: status === 403 ? 'FORBIDDEN' : status === 400 ? 'INVALID_REQUEST' : 'SERVICE_UNAVAILABLE' }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
