import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatMoney, summarizeReferrals } from '@/lib/referral';
import { AdminReferralRow, type ReferralRow } from './AdminReferralRow';

// Payable first, then pending, then settled/void.
const STATUS_ORDER: Record<string, number> = { earned: 0, pending: 1, paid: 2, void: 3 };

export default async function AdminReferralsPage() {
  const referrals = await prisma.referral.findMany({ orderBy: { createdAt: 'desc' } });

  // Resolve each referrer tenant's name + owner email in one query.
  const referrerIds = [...new Set(referrals.map((r) => r.referrerId))];
  const tenants = referrerIds.length
    ? await prisma.tenant.findMany({
        where: { id: { in: referrerIds } },
        select: {
          id: true,
          name: true,
          memberships: { where: { role: 'owner' }, include: { user: true }, take: 1 },
        },
      })
    : [];
  const byId = new Map(tenants.map((t) => [t.id, t]));

  const stats = summarizeReferrals(referrals);

  const rows: ReferralRow[] = referrals
    .slice()
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
    .map((r) => {
      const t = byId.get(r.referrerId);
      return {
        id: r.id,
        referrerName: t?.name || '—',
        referrerEmail: t?.memberships[0]?.user.email || '—',
        referredName: r.referredName || 'New customer',
        date: r.createdAt.toLocaleDateString(),
        status: r.status,
        amount: formatMoney(r.commissionCents),
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referrals</h1>
        <Link href="/admin" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
          ← Overview
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Referrals" value={stats.total.toLocaleString()} />
        <Stat label="Pending" value={stats.pending.toLocaleString()} />
        <Stat label="Payable now" value={formatMoney(stats.earnedCents)} />
        <Stat label="Paid out" value={formatMoney(stats.paidCents)} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-ink-mute">
          No referrals yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-ink-mute">
              <tr>
                <th className="px-4 py-3">Referrer</th>
                <th className="px-4 py-3">Referred</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <AdminReferralRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
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
