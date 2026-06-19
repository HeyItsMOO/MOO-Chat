import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentContext } from '@/lib/auth';

export const runtime = 'nodejs';

const ROLES = ['owner', 'admin', 'agent'] as const;
type Role = (typeof ROLES)[number];

/** Resolve the acting context and the actor's role on the current tenant. */
async function actor() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return null;
  // Super-admins acting via "spy mode" get owner-level control of the tenant.
  const role = ctx.impersonating ? 'owner' : ctx.membership?.role ?? null;
  return { ctx, role, userId: ctx.user.id, tenantId: ctx.tenant.id };
}

function canManage(role: string | null): role is Role {
  return role === 'owner' || role === 'admin';
}

async function ownerCount(tenantId: string): Promise<number> {
  return prisma.membership.count({ where: { tenantId, role: 'owner' } });
}

export async function GET() {
  const a = await actor();
  if (!a) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const members = await prisma.membership.findMany({
    where: { tenantId: a.tenantId },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    me: { userId: a.userId, role: a.role },
    canManage: canManage(a.role),
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
    })),
  });
}

export async function POST(req: NextRequest) {
  const a = await actor();
  if (!a) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canManage(a.role)) return NextResponse.json({ error: 'You need owner or admin access.' }, { status: 403 });

  const { email, role } = await req.json().catch(() => ({}));
  const cleanEmail = String(email || '').trim().toLowerCase();
  const newRole = String(role || 'agent') as Role;
  if (!cleanEmail || !ROLES.includes(newRole)) {
    return NextResponse.json({ error: 'Enter a valid email and role.' }, { status: 400 });
  }
  if (newRole === 'owner' && a.role !== 'owner') {
    return NextResponse.json({ error: 'Only an owner can add another owner.' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user) {
    return NextResponse.json(
      { error: 'No ChatMOO account uses that email yet. Ask them to sign up first, then invite them.' },
      { status: 404 },
    );
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: a.tenantId } },
  });
  if (existing) return NextResponse.json({ error: 'That person is already on your team.' }, { status: 409 });

  await prisma.membership.create({ data: { userId: user.id, tenantId: a.tenantId, role: newRole } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const a = await actor();
  if (!a) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canManage(a.role)) return NextResponse.json({ error: 'You need owner or admin access.' }, { status: 403 });

  const { membershipId, role } = await req.json().catch(() => ({}));
  const newRole = String(role || '') as Role;
  if (!membershipId || !ROLES.includes(newRole)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  const m = await prisma.membership.findFirst({ where: { id: String(membershipId), tenantId: a.tenantId } });
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if ((m.role === 'owner' || newRole === 'owner') && a.role !== 'owner') {
    return NextResponse.json({ error: 'Only an owner can change owner roles.' }, { status: 403 });
  }
  // Don't demote the last owner.
  if (m.role === 'owner' && newRole !== 'owner' && (await ownerCount(a.tenantId)) <= 1) {
    return NextResponse.json({ error: 'You need at least one owner.' }, { status: 400 });
  }

  await prisma.membership.update({ where: { id: m.id }, data: { role: newRole } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const a = await actor();
  if (!a) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canManage(a.role)) return NextResponse.json({ error: 'You need owner or admin access.' }, { status: 403 });

  const { membershipId } = await req.json().catch(() => ({}));
  const m = await prisma.membership.findFirst({ where: { id: String(membershipId || ''), tenantId: a.tenantId } });
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (m.role === 'owner' && (await ownerCount(a.tenantId)) <= 1) {
    return NextResponse.json({ error: 'You can’t remove the last owner.' }, { status: 400 });
  }

  await prisma.membership.delete({ where: { id: m.id } });
  return NextResponse.json({ ok: true });
}
