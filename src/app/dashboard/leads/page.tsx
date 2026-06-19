import { getCurrentContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { parseFields } from '@/lib/leadform';

function fmt(d: Date) {
  return new Date(d).toLocaleString();
}

export default async function LeadsPage() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return null;

  const leads = await prisma.lead.findMany({
    where: { tenantId: ctx.tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-ink-soft">{leads.length} submission{leads.length === 1 ? '' : 's'} captured by your assistant.</p>
        </div>
        {leads.length > 0 && (
          <a href="/api/tenant/leads/export" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Export CSV
          </a>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-ink-mute">
          No leads yet. When visitors submit the form in your chat widget, they show up here.
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            let parsed: { fields: { key: string; label: string }[]; values: Record<string, string> } = { fields: [], values: {} };
            try {
              const p = JSON.parse(lead.payload);
              parsed = { fields: parseFields(JSON.stringify(p.fields)), values: p.values || {} };
            } catch {
              /* ignore */
            }
            return (
              <details key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{lead.name || 'Anonymous'}</span>
                  <span className="text-sm text-ink-soft">{lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</span>
                  <span className="text-xs text-ink-mute">{fmt(lead.createdAt)}</span>
                </summary>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    {parsed.fields.map((f) => (
                      <div key={f.key}>
                        <dt className="text-xs font-semibold uppercase text-ink-mute">{f.label}</dt>
                        <dd className="text-sm">{parsed.values[f.key] || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                  {lead.pageUrl && <p className="mt-3 text-xs text-ink-mute">Submitted from: {lead.pageUrl}</p>}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
