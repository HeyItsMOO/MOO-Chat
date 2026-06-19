import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentContext } from '@/lib/auth';

export const runtime = 'nodejs';

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const leads = await prisma.lead.findMany({
    where: { tenantId: ctx.tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  // Collect the union of all field labels across leads for stable columns.
  const labelSet: string[] = [];
  const rows = leads.map((lead) => {
    let values: Record<string, string> = {};
    let fields: { key: string; label: string }[] = [];
    try {
      const p = JSON.parse(lead.payload);
      fields = Array.isArray(p.fields) ? p.fields : [];
      values = p.values || {};
    } catch {
      /* ignore */
    }
    const byLabel: Record<string, string> = {};
    for (const f of fields) {
      if (!labelSet.includes(f.label)) labelSet.push(f.label);
      byLabel[f.label] = values[f.key] ?? '';
    }
    return { createdAt: lead.createdAt, pageUrl: lead.pageUrl, byLabel };
  });

  const header = ['Date', ...labelSet, 'Page'];
  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) {
    const cells = [new Date(r.createdAt).toISOString(), ...labelSet.map((l) => r.byLabel[l] ?? ''), r.pageUrl];
    lines.push(cells.map(csvCell).join(','));
  }

  const csv = lines.join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${ctx.tenant.slug}.csv"`,
    },
  });
}
