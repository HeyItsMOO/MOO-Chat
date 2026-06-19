import { getCurrentContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TeamManager } from './TeamManager';

export default async function TeamPage() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return null;

  const myRole = ctx.impersonating ? 'owner' : ctx.membership?.role ?? 'agent';
  const canManage = myRole === 'owner' || myRole === 'admin';

  const rows = await prisma.membership.findMany({
    where: { tenantId: ctx.tenant.id },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const members = rows.map((m) => ({ id: m.id, userId: m.userId, email: m.user.email, name: m.user.name, role: m.role }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team &amp; roles</h1>
        <p className="text-ink-soft">Invite teammates to {ctx.tenant.name} and choose what each person can do.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <RoleCard title="Owner" body="Full access including billing, team, and deleting the account." />
        <RoleCard title="Admin" body="Manage the assistant, leads, install and team — everything except ownership." />
        <RoleCard title="Agent" body="Handle live chats and read conversations and leads." />
      </div>

      <TeamManager initialMembers={members} myUserId={ctx.user.id} myRole={myRole} canManage={canManage} />
    </div>
  );
}

function RoleCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="font-heading font-bold text-cow-black">{title}</div>
      <p className="mt-1 text-xs text-ink-soft">{body}</p>
    </div>
  );
}
