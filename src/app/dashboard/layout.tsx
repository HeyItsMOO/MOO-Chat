import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentContext } from '@/lib/auth';
import { BRAND } from '@/lib/brand';
import { LogoutButton, ExitImpersonation } from './_components';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/assistant', label: 'Assistant', icon: '🧠' },
  { href: '/dashboard/install', label: 'Install', icon: '🔌' },
  { href: '/dashboard/live', label: 'Live chat', icon: '🟢' },
  { href: '/dashboard/conversations', label: 'Conversations', icon: '💬' },
  { href: '/dashboard/leads', label: 'Leads', icon: '📥' },
  { href: '/dashboard/billing', label: 'Billing', icon: '💳' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentContext();
  if (!ctx) redirect('/login');
  if (!ctx.tenant) redirect(ctx.user.isSuperAdmin ? '/admin' : '/onboarding');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col border-r border-slate-200 bg-white p-4 md:flex">
          <div className="flex items-center gap-2 px-2 py-2 font-bold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs text-white">{BRAND.emoji}</span>
            {BRAND.name}
          </div>
          <nav className="mt-6 flex-1 space-y-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100 hover:text-ink"
              >
                <span>{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-slate-100 pt-3">
            <div className="px-3 text-xs text-ink-mute">{ctx.user.email}</div>
            <div className="mt-1 px-3 text-xs font-semibold uppercase text-brand-700">{ctx.tenant.plan} plan</div>
            <LogoutButton />
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {ctx.impersonating && (
            <div className="flex items-center justify-between gap-3 bg-amber-400 px-5 py-2 text-sm font-medium text-amber-950">
              <span>👁️ Viewing <strong>{ctx.tenant.name}</strong> as admin (impersonating).</span>
              <ExitImpersonation />
            </div>
          )}
          {/* Mobile top bar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 md:hidden">
            <span className="font-bold">{BRAND.shortName}</span>
            <LogoutButton />
          </div>
          <div className="p-5 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
