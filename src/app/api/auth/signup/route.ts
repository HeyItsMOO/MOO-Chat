import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';
import { provisionTenant } from '@/lib/provision';
import { recordReferral } from '@/lib/referral';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().max(120).optional().default(''),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  businessName: z.string().trim().min(1).max(120),
  websiteUrl: z.string().trim().max(300).optional().default(''),
  ref: z.string().trim().max(40).optional().default(''),
});

export async function POST(req: NextRequest) {
  let data;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : 'Invalid input';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, name: data.name, passwordHash: await hashPassword(data.password) },
  });

  const tenant = await provisionTenant({
    userId: user.id,
    businessName: data.businessName,
    websiteUrl: data.websiteUrl,
  });

  // Credit the referrer, if this signup came through a referral link.
  if (data.ref) {
    await recordReferral({ code: data.ref, referredTenantId: tenant.id, referredName: data.businessName });
  }

  await createSession({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true });
}
