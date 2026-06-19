import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth';
import { PortalHeader, PortalFooter } from '@/components/site/PortalChrome';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect('/dashboard');

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <PortalHeader email={admin.email} admin />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">{children}</main>
      <PortalFooter />
    </div>
  );
}
