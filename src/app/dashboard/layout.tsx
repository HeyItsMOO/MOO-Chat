import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentContext } from '@/lib/auth';
import { effectivePlan, isTrialActive, trialDaysLeft } from '@/lib/plans';
import { PortalHeader, PortalFooter } from '@/components/site/PortalChrome';
import { ExitImpersonation } from './_components';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/assistant', label: 'Assistant', icon: '🧠' },
  { href: '/dashboard/install', label: 'Install', icon: '🔌' },
  { href: '/dashboard/live', label: 'Live chat', icon: '🟢' },
  { href: '/dashboard/conversations', label: 'Conversations', icon: '💬' },
  { href: '/dashboard/leads', label: 'Leads', icon: '📥' },
  { href: '/dashboard/team', label: 'Team', icon: '👥' },
  { href: '/dashboard/billing', label: 'Billing', icon: '💳' },
  { href: '/dashboard/referrals', label: 'Refer & earn', icon: '🎁' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentContext();
  if (!ctx) redirect('/login');
  if (!ctx.tenant) redirect(ctx.user.isSuperAdmin ? '/admin' : '/onboarding');

  const plan = effectivePlan(ctx.tenant);
  const onTrial = isTrialActive(ctx.tenant);
  const planLabel = onTrial ? `${plan.name} trial · ${trialDaysLeft(ctx.tenant)}d left` : `${plan.name} plan`;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <PortalHeader email={ctx.user.email} planLabel={planLabel} />

      {ctx.impersonating && (
        <div className="flex items-center justify-between gap-3 border-b-2 border-cow-black bg-accent px-5 py-2 text-sm font-bold text-cow-black">
          <span>👁️ Spy mode — viewing <strong>{ctx.tenant.name}</strong> as admin.</span>
          <ExitImpersonation />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-60 flex-none border-r border-slate-200 bg-white p-4 md:block">
          <nav className="space-y-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper hover:text-cow-black"
              >
                <span>{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Mobile section nav */}
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-paper"
              >
                {n.icon} {n.label}
              </Link>
            ))}
          </div>
          <div className="p-5 sm:p-8">{children}</div>
        </main>
      </div>

      <PortalFooter />
    </div>
  );
}
