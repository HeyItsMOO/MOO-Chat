import Link from 'next/link';
import { getCurrentContext } from '@/lib/auth';
import { effectivePlan } from '@/lib/plans';
import LiveConsole from './LiveConsole';

export default async function LivePage() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return null;
  const plan = effectivePlan(ctx.tenant);

  if (!plan.features.liveChat) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">Live chat</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="text-4xl">🟢</div>
          <h2 className="mt-3 font-semibold">Live chat is a Pro feature</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Let visitors talk to a real person and jump into conversations from here.
            Upgrade to Pro or Business to enable it.
          </p>
          <Link href="/dashboard/billing" className="mt-5 inline-block rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">
            See plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Live chat</h1>
        <p className="text-ink-soft">Monitor active chats and jump in when a visitor needs a person.</p>
      </div>
      <LiveConsole agentName={ctx.user.name || ctx.user.email.split('@')[0]} />
    </div>
  );
}
