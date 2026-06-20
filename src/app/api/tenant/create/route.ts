import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentContext } from '@/lib/auth';
import { provisionTenant } from '@/lib/provision';
import { redeemPromo } from '@/lib/promo';

export const runtime = 'nodejs';

const schema = z.object({
  businessName: z.string().trim().min(1).max(120),
  websiteUrl: z.string().trim().max(300).optional().default(''),
  promoCode: z.string().trim().max(64).optional().default(''),
});

export async function POST(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (ctx.tenant) return NextResponse.json({ ok: true }); // already has one

  let data;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const tenant = await provisionTenant({ userId: ctx.user.id, businessName: data.businessName, websiteUrl: data.websiteUrl });

  // Apply a promo code if one was entered (best-effort — never block signup).
  let promoMessage = '';
  let promoError = '';
  if (data.promoCode) {
    const res = await redeemPromo({ tenantId: tenant.id, userId: ctx.user.id, code: data.promoCode });
    if (res.ok) promoMessage = res.message;
    else promoError = res.error;
  }

  return NextResponse.json({ ok: true, promoMessage, promoError });
}
