import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { APP_URL } from '@/lib/brand';
import { PLANS, type PlanId } from '@/lib/plans';
import { provisionAccount } from '@/lib/provision';
import { isProvisioningAuthed, issueSsoToken, PROVISIONING_CONFIGURED } from '@/lib/provisioning';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Provisioning API for external billing systems (the WHMCS module).
 * One POST endpoint, dispatched by `action`. Authenticated by PROVISIONING_API_KEY.
 *
 *   create       { email, password?, name?, businessName, websiteUrl?, plan? }
 *   suspend      { tenantId }
 *   unsuspend    { tenantId }
 *   terminate    { tenantId }
 *   change_plan  { tenantId, plan }
 *   sso          { tenantId }                     -> { url }
 */
export async function POST(req: NextRequest) {
  if (!PROVISIONING_CONFIGURED) {
    return NextResponse.json(
      { ok: false, error: 'Provisioning API is not configured (set PROVISIONING_API_KEY).' },
      { status: 503 },
    );
  }
  if (!isProvisioningAuthed(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const action = String(body.action || '');

  try {
    switch (action) {
      case 'create': {
        if (!body.email || !body.businessName) {
          return NextResponse.json({ ok: false, error: 'email and businessName are required' }, { status: 400 });
        }
        const { user, tenant } = await provisionAccount({
          email: String(body.email),
          password: body.password ? String(body.password) : undefined,
          name: body.name ? String(body.name) : undefined,
          businessName: String(body.businessName),
          websiteUrl: body.websiteUrl ? String(body.websiteUrl) : undefined,
          plan: body.plan ? String(body.plan) : undefined,
        });
        return NextResponse.json({
          ok: true,
          tenantId: tenant.id,
          publicKey: tenant.publicKey,
          ownerUserId: user.id,
          plan: tenant.plan,
          loginUrl: `${APP_URL}/login`,
          dashboardUrl: `${APP_URL}/dashboard`,
        });
      }

      case 'suspend':
      case 'unsuspend': {
        const tenant = await findTenant(body.tenantId);
        if (!tenant) return notFound();
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { status: action === 'suspend' ? 'suspended' : 'active' },
        });
        return NextResponse.json({ ok: true, tenantId: tenant.id, status: action === 'suspend' ? 'suspended' : 'active' });
      }

      case 'terminate': {
        const tenant = await findTenant(body.tenantId);
        if (!tenant) return notFound();
        // Cascades to assistant, conversations, leads, domains, usage.
        await prisma.tenant.delete({ where: { id: tenant.id } });
        return NextResponse.json({ ok: true, tenantId: tenant.id, terminated: true });
      }

      case 'change_plan': {
        const tenant = await findTenant(body.tenantId);
        if (!tenant) return notFound();
        const plan = String(body.plan || '');
        if (!((plan as PlanId) in PLANS)) {
          return NextResponse.json({ ok: false, error: `unknown plan "${plan}"` }, { status: 400 });
        }
        await prisma.tenant.update({ where: { id: tenant.id }, data: { plan } });
        return NextResponse.json({ ok: true, tenantId: tenant.id, plan });
      }

      case 'sso': {
        const tenant = await prisma.tenant.findUnique({
          where: { id: String(body.tenantId || '') },
          include: { memberships: { orderBy: { createdAt: 'asc' } } },
        });
        if (!tenant) return notFound();
        // Prefer the owner, else the earliest member.
        const owner = tenant.memberships.find((m) => m.role === 'owner') || tenant.memberships[0];
        if (!owner) return NextResponse.json({ ok: false, error: 'no_owner' }, { status: 409 });
        const token = await issueSsoToken(owner.userId);
        return NextResponse.json({ ok: true, url: `${APP_URL}/api/auth/sso?token=${encodeURIComponent(token)}` });
      }

      default:
        return NextResponse.json({ ok: false, error: `unknown action "${action}"` }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'provisioning_error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

function notFound() {
  return NextResponse.json({ ok: false, error: 'tenant_not_found' }, { status: 404 });
}

async function findTenant(id: unknown) {
  const tenantId = String(id || '');
  if (!tenantId) return null;
  return prisma.tenant.findUnique({ where: { id: tenantId } });
}
