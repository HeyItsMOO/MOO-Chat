import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { IMPERSONATE_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const jar = await cookies();
  jar.delete(IMPERSONATE_COOKIE);
  return NextResponse.json({ ok: true });
}
