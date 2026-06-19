import { NextRequest, NextResponse } from 'next/server';
import { getCurrentContext } from '@/lib/auth';
import { scrapeSite } from '@/lib/scrape';
import { rateLimit } from '@/lib/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Auto-setup: scrape the customer's website and return draft assistant content.
 * The client previews it and the user saves — we don't overwrite anything silently.
 */
export async function POST(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Each scrape makes several outbound fetches — cap how often a tenant can run it.
  if (!rateLimit(`autofill:${ctx.tenant.id}`, 15)) {
    return NextResponse.json({ error: 'Too many auto-fill requests. Please wait a bit and try again.' }, { status: 429 });
  }

  const { url } = await req.json().catch(() => ({ url: '' }));
  if (typeof url !== 'string' || url.length > 2048) {
    return NextResponse.json({ error: 'Please enter a valid website URL.' }, { status: 400 });
  }
  const info = await scrapeSite(url);
  if (!info.ok) return NextResponse.json({ error: info.error || 'Could not read that site.' }, { status: 422 });

  return NextResponse.json({
    ok: true,
    companyName: info.companyName,
    description: info.description,
    themeColor: info.themeColor,
    knowledgeBase: info.knowledgeBase,
    pagesFetched: info.pagesFetched,
  });
}
