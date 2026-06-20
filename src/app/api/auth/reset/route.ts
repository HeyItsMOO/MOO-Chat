import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, hashResetToken, createSession } from '@/lib/auth';
import { rateLimit, clientIp, hashIp } from '@/lib/tenant';

export const runtime = 'nodejs';

const schema = z.object({
  token: z.string().trim().min(20).max(200),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
});

const INVALID = 'This reset link is invalid or has expired. Please request a new one.';

/** Complete a password reset with a valid one-time token, then sign the user in. */
export async function POST(req: NextRequest) {
  if (!rateLimit(`reset:${hashIp(clientIp(req.headers))}`, 30)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait and try again.' }, { status: 429 });
  }

  let data;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : 'Invalid input';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(data.token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: INVALID }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user) {
    return NextResponse.json({ error: INVALID }, { status: 400 });
  }

  const passwordHash = await hashPassword(data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    // Burn any other outstanding tokens for this user.
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
  ]);

  // Log them straight in.
  await createSession({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true });
}
