import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth';
import { BRAND } from '@/lib/brand';
import { LogoutButton } from '../dashboard/_components';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="font-bold">{BRAND.emoji} {BRAND.shortName} Admin</span>
            <span className="rounded bg-slate-700 px-2 py-0.5 text-xs">platform</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="hover:underline">Tenants</Link>
            <span className="text-slate-400">{admin.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
