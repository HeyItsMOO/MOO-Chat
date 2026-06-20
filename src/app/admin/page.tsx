import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getPlan, PLANS } from '@/lib/plans';
import { currentPeriod } from '@/lib/usage';
import { AdminTenantRow } from './AdminTenantRow';

export default async function AdminPage() {
  const period = currentPeriod();
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { conversations: true, leads: true } },
      usageCounters: { where: { period } },
      memberships: { where: { role: 'owner' }, include: { user: true }, take: 1 },
    },
  });

  const rows = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    plan: t.plan,
    status: t.status,
    owner: t.memberships[0]?.user.email || '—',
    usage: t.usageCounters[0]?.messageCount ?? 0,
    conversations: t._count.conversations,
    leads: t._count.leads,
    createdAt: t.createdAt,
  }));

  const totalTenants = rows.length;
  const paying = rows.filter((r) => r.plan !== 'free' && r.status === 'active');
  const mrr = paying.reduce((sum, r) => sum + getPlan(r.plan).priceMonthly, 0);
  const totalMessages = rows.reduce((sum, r) => sum + r.usage, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Platform overview</h1>
        <div className="flex gap-2">
          <Link href="/admin/referrals" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            Referrals →
          </Link>
          <Link href="/admin/promos" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Promo codes →
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Tenants" value={totalTenants.toLocaleString()} />
        <Stat label="Paying" value={paying.length.toLocaleString()} />
        <Stat label="MRR (est.)" value={`$${mrr.toLocaleString()}`} />
        <Stat label={`Messages (${period})`} value={totalMessages.toLocaleString()} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-ink-mute">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Convos</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <AdminTenantRow key={r.id} row={r} planLimit={PLANS[r.plan as keyof typeof PLANS]?.messagesPerMonth ?? 0} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-ink-mute">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
