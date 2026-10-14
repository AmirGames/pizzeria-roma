import 'server-only';
import { cookies } from 'next/headers';
import { prisma } from './db';
// @ts-ignore JavaScript module; covered by unit tests\nimport { hashSessionToken } from './session-token.mjs';
// @ts-ignore JavaScript module; covered by unit tests\nimport { isActiveSession, SESSION_COOKIE } from './session-policy.mjs';
// @ts-ignore JavaScript module; covered by unit tests\nimport { can } from './authorization.mjs';

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let tokenHash: string;
  try {
    tokenHash = hashSessionToken(token);
  } catch {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!isActiveSession(session)) return null;

  return {
    id: session!.user.id,
    email: session!.user.email,
    name: session!.user.name,
    role: session!.user.role,
  };
}

export async function requirePermission(permission: string) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, permission)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
