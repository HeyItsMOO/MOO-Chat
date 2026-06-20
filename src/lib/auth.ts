import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './db';

const COOKIE = 'moo_session';
const ALG = 'HS256';

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error('AUTH_SECRET is missing or too short. Set it in .env');
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/** SHA-256 of a password-reset token — only the hash is stored server-side. */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Run a bcrypt comparison against a dummy hash when no user is found, so the
// login response time doesn't reveal whether an email has an account.
let dummyHashCache: string | null = null;
export async function fakeVerify(plain: string): Promise<void> {
  if (!dummyHashCache) dummyHashCache = await bcrypt.hash('moo-chat-timing-guard', 10);
  await bcrypt.compare(plain, dummyHashCache);
}

export type SessionPayload = { userId: string; email: string };

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    return { userId: String(payload.userId), email: String(payload.email) };
  } catch {
    return null;
  }
}

/** Full current user (or null). */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export const IMPERSONATE_COOKIE = 'moo_impersonate';

/**
 * Returns the user + their primary tenant (and membership role).
 * Super-admins can "impersonate" a tenant (jump in to help): when the
 * impersonation cookie is set, the returned tenant is that tenant instead.
 */
export async function getCurrentContext() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: { tenant: { include: { assistant: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!user) return null;
  const membership = user.memberships[0] ?? null;

  // Impersonation (super-admin only).
  if (user.isSuperAdmin) {
    const jar = await cookies();
    const impId = jar.get(IMPERSONATE_COOKIE)?.value;
    if (impId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: impId },
        include: { assistant: true },
      });
      if (tenant) {
        return { user, membership, tenant, impersonating: true as const };
      }
    }
  }

  return {
    user,
    membership,
    tenant: membership?.tenant ?? null,
    impersonating: false as const,
  };
}

export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user?.isSuperAdmin ? user : null;
}
