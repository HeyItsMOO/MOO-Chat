import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, fakeVerify, createSession } from '@/lib/auth';
import { rateLimit, clientIp, hashIp } from '@/lib/tenant';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  // Throttle login attempts per IP to slow online guessing / enumeration.
  if (!rateLimit(`login:${hashIp(clientIp(req.headers))}`, 30)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait and try again.' }, { status: 429 });
  }

  let data;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user) {
    await fakeVerify(data.password); // constant-time: don't leak whether the email exists
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }
  if (!(await verifyPassword(data.password, user.passwordHash))) {
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  await createSession({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true });
}
