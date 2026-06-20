import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { APP_URL } from '@/lib/brand';
import { createSession } from '@/lib/auth';
import { consumeSsoToken } from '@/lib/provisioning';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Single sign-on landing. WHMCS sends the client here with a short-lived token
 * (minted by /api/provisioning action=sso). We verify it, start a session, and
 * drop them in the dashboard. Never logs anyone in without a valid, unexpired token.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  const fail = (reason: string) => NextResponse.redirect(`${APP_URL}/login?sso=${reason}`);

  if (!token) return fail('missing');

  const userId = await consumeSsoToken(token);
  if (!userId) return fail('invalid');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return fail('invalid');

  await createSession({ userId: user.id, email: user.email });
  return NextResponse.redirect(`${APP_URL}/dashboard`);
}
