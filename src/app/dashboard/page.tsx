import Link from 'next/link';
import { getCurrentContext } from '@/lib/auth';
import { getUsage } from '@/lib/usage';
import { effectivePlan, isTrialActive, trialDaysLeft } from '@/lib/plans';
import { APP_URL } from '@/lib/brand';
import { ANTHROPIC_CONFIGURED } from '@/lib/anthropic';
import { CopyButton } from './_components';
import { prisma } from '@/lib/db';

export default async function Overview() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return null;
  const tenant = ctx.tenant;
  const usage = await getUsage(tenant.id);
  const plan = effectivePlan(tenant);
  const onTrial = isTrialActive(tenant);
  const pct = Math.min(100, Math.round((usage.messageCount / plan.messagesPerMonth) * 100));
  const convoCount = await prisma.conversation.count({ where: { tenantId: tenant.id, msgCount: { gt: 0 } } });

  const snippet = `<script src="${APP_URL}/embed.js" data-key="${tenant.publicKey}" async></script>`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back 👋</h1>
        <p className="text-ink-soft">Here&apos;s how {tenant.name} is doing.</p>
      </div>

      {!ANTHROPIC_CONFIGURED && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ No central <code>ANTHROPIC_API_KEY</code> is set on the server yet, so the assistant returns a
          &quot;not configured&quot; message. Add it to <code>.env</code> and restart to enable live AI replies.
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="AI replies this month" value={`${usage.messageCount.toLocaleString()} / ${plan.messagesPerMonth.toLocaleString()}`}>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
          </div>
        </Stat>
        <Stat label="Conversations" value={convoCount.toLocaleString()} />
        <Stat label="Current plan" value={onTrial ? `${plan.name} (trial)` : plan.name}>
          {onTrial && (
            <div className="mt-1 text-xs font-semibold text-brand-700">{trialDaysLeft(tenant)} day(s) left in your trial</div>
          )}
          <Link href="/dashboard/billing" className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Manage plan →
          </Link>
        </Stat>
      </div>

      {/* Install snippet */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your install snippet</h2>
          <CopyButton text={snippet} label="Copy snippet" />
        </div>
        <p className="mt-1 text-sm text-ink-soft">Paste this just before <code>&lt;/body&gt;</code> on your site.</p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">{snippet}</pre>
        <Link href="/dashboard/install" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
          WordPress / Shopify instructions →
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Action href="/dashboard/assistant" title="Train your assistant" body="Edit the knowledge base, persona, branding and behaviour." />
        <Action href="/dashboard/conversations" title="Read conversations" body="See what your visitors are asking and how the bot replied." />
      </div>
    </div>
  );
}

function Stat({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-ink-mute">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {children}
    </div>
  );
}

function Action({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-600 hover:shadow-sm">
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-ink-soft">{body}</div>
    </Link>
  );
}
