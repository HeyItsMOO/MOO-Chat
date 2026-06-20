import { redirect } from 'next/navigation';
import { getCurrentContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { APP_URL } from '@/lib/brand';
import {
  ensureReferralCode,
  summarizeReferrals,
  formatMoney,
  REFERRAL_COMMISSION_CENTS,
} from '@/lib/referral';
import { CopyField } from './CopyField';

export const metadata = { title: 'Refer & earn' };

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700',
  earned: 'bg-green-100 text-green-700',
  paid: 'bg-slate-200 text-slate-700',
  void: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Signed up',
  earned: 'Payable',
  paid: 'Paid out',
  void: 'Void',
};

export default async function ReferralsPage() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) redirect('/login');

  const code = await ensureReferralCode(ctx.tenant.id);
  const link = `${APP_URL}/signup?ref=${code}`;

  const referrals = await prisma.referral.findMany({
    where: { referrerId: ctx.tenant.id },
    orderBy: { createdAt: 'desc' },
  });
  const stats = summarizeReferrals(referrals);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-cow-black">Refer &amp; earn 🎁</h1>
        <p className="mt-1 font-semibold text-ink-soft">
          Earn <strong>{formatMoney(REFERRAL_COMMISSION_CENTS)}</strong> for every business you refer that
          becomes a paying customer. Share your link below.
        </p>
      </div>

      {/* Share link */}
      <div className="card-moo p-6">
        <div className="text-sm font-bold text-ink-soft">Your referral link</div>
        <div className="mt-2">
          <CopyField value={link} />
        </div>
        <p className="mt-3 text-sm font-semibold text-ink-mute">
          Your code is <span className="font-mono font-bold text-cow-black">{code}</span>. Anyone who signs up
          through your link is tracked to you automatically.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Referrals" value={stats.total.toLocaleString()} />
        <Stat label="Pending" value={stats.pending.toLocaleString()} hint="Signed up, not yet paying" />
        <Stat label="Payable now" value={formatMoney(stats.earnedCents)} hint={`${stats.earned} converted`} accent />
        <Stat label="Paid out" value={formatMoney(stats.paidCents)} hint={`${stats.paid} settled`} />
      </div>

      {/* How it works */}
      <div className="rounded-2xl border-2 border-dashed border-pasture bg-pasture-light/40 p-5 text-sm font-semibold text-ink-soft">
        <span className="font-bold text-cow-black">How it works:</span> share your link → they sign up and
        start a paid plan → your commission becomes <strong>payable</strong>. We pay out payable commissions
        on request — email us and we&apos;ll settle up.
      </div>

      {/* Referral list */}
      <div>
        <h2 className="font-heading text-lg font-bold text-cow-black">Your referrals</h2>
        {referrals.length === 0 ? (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-ink-mute">
            No referrals yet. Share your link to get started! 🚀
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-ink-mute">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Signed up</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-cow-black">{r.referredName || 'New customer'}</td>
                    <td className="px-4 py-3 text-ink-soft">{r.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_PILL[r.status] || ''}`}>
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-cow-black">{formatMoney(r.commissionCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${accent ? 'border-cow-black bg-pasture-light' : 'border-slate-200 bg-white'}`}>
      <div className="text-sm font-bold text-ink-mute">{label}</div>
      <div className="mt-1 font-heading text-2xl font-bold text-cow-black">{value}</div>
      {hint && <div className="mt-1 text-xs font-semibold text-ink-mute">{hint}</div>}
    </div>
  );
}
