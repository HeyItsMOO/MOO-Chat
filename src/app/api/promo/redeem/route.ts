import { NextRequest, NextResponse } from 'next/server';
import { getCurrentContext } from '@/lib/auth';
import { redeemPromo } from '@/lib/promo';
import { rateLimit } from '@/lib/tenant';

export const runtime = 'nodejs';

/** Redeem a promo code for the current tenant. */
export async function POST(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Throttle code guessing.
  if (!rateLimit(`promo:${ctx.tenant.id}`, 20)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a bit and try again.' }, { status: 429 });
  }

  const { code } = await req.json().catch(() => ({ code: '' }));
  if (typeof code !== 'string' || code.length > 64) {
    return NextResponse.json({ error: 'Enter a valid promo code.' }, { status: 400 });
  }

  const result = await redeemPromo({ tenantId: ctx.tenant.id, userId: ctx.user.id, code });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, message: result.message });
}
