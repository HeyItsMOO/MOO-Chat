import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { requireSuperAdmin, IMPERSONATE_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { tenantId } = await req.json().catch(() => ({}));
  const tenant = await prisma.tenant.findUnique({ where: { id: String(tenantId || '') } });
  if (!tenant) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const jar = await cookies();
  jar.set(IMPERSONATE_COOKIE, tenant.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 2,
  });
  return NextResponse.json({ ok: true });
}
