import { NextResponse } from 'next/server';
import { getCurrentContext } from '@/lib/auth';
import { getPlan } from '@/lib/plans';
import { listActive } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!getPlan(ctx.tenant.plan).features.liveChat) {
    return NextResponse.json({ error: 'live_chat_not_on_plan', conversations: [] }, { status: 403 });
  }
  const conversations = await listActive(ctx.tenant.id);
  return NextResponse.json({ conversations });
}
