import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashResetToken } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { APP_URL, BRAND } from '@/lib/brand';
import { rateLimit, clientIp, hashIp } from '@/lib/tenant';

export const runtime = 'nodejs';

const schema = z.object({ email: z.string().trim().email() });
const TTL_MINUTES = 60;

/**
 * Start a password reset: email a one-time link. Always responds OK so the
 * endpoint never reveals whether an email has an account (no enumeration).
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(`forgot:${hashIp(clientIp(req.headers))}`, 10)) {
    return NextResponse.json({ error: 'Too many requests. Please wait and try again.' }, { status: 429 });
  }

  let data;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const email = data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // Keep at most one active token per user.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
      },
    });

    const link = `${APP_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: `Reset your ${BRAND.name} password`,
      text:
        `Hi,\n\nWe received a request to reset your ${BRAND.name} password.\n\n` +
        `Reset it here (this link expires in ${TTL_MINUTES} minutes):\n${link}\n\n` +
        `If you didn't request this, you can safely ignore this email — your password won't change.\n\n` +
        `— The ${BRAND.name} team`,
    });
  }

  return NextResponse.json({ ok: true });
}
