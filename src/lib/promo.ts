/**
 * Promo codes.
 *
 * A code grants ONE of three benefits when redeemed by a tenant. All three are
 * realized as FREE TIME (per product decision) — value we fully control,
 * independent of PayPal:
 *   - free_days   : extend the trial by N days, or (if planId set) comp that
 *                   plan free for N days.
 *   - percent_off : X% off for N months → the equivalent number of free days
 *                   (X% × N months ≈ that fraction of a month, in days).
 *   - credit      : a $ amount → free days worth that much on the reference plan.
 *
 * Each tenant can redeem a given code once; codes can have an expiry and a max
 * total redemptions.
 */
import { prisma } from './db';
import { PLANS, CURRENCY_SYMBOL, getPlan, TRIAL_PLAN_ID, type PlanId } from './plans';

export const PROMO_BENEFITS = ['free_days', 'percent_off', 'credit'] as const;
export type PromoBenefit = (typeof PROMO_BENEFITS)[number];

export function normalizeCode(input: string): string {
  return String(input || '').trim().toUpperCase().replace(/\s+/g, '');
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function isPaidPlan(id: string): boolean {
  return !!id && id !== 'free' && (id as PlanId) in PLANS;
}

type PromoRow = NonNullable<Awaited<ReturnType<typeof prisma.promoCode.findUnique>>>;

type PromoLike = {
  benefit: string;
  planId: string;
  days: number;
  percentOff: number;
  durationMonths: number;
  amountCents: number;
};

/**
 * Free days a code is worth. percent_off and credit are converted to the
 * equivalent free time; `fallbackPlanId` is the reference plan used to price a
 * credit code when the code itself isn't scoped to a plan.
 */
export function realizedFreeDays(c: PromoLike, fallbackPlanId: string = TRIAL_PLAN_ID): number {
  if (c.benefit === 'free_days') return c.days;
  if (c.benefit === 'percent_off') return Math.round((c.percentOff / 100) * c.durationMonths * 30);
  if (c.benefit === 'credit') {
    const refId = isPaidPlan(c.planId) ? c.planId : isPaidPlan(fallbackPlanId) ? fallbackPlanId : TRIAL_PLAN_ID;
    const ref = getPlan(refId);
    return ref.priceMonthly > 0 ? Math.round((c.amountCents / (ref.priceMonthly * 100)) * 30) : 0;
  }
  return 0;
}

/** A plain-English summary of what a code does (admin list + success message). */
export function describePromo(c: PromoLike & { currency?: string }): string {
  if (c.benefit === 'free_days') {
    const plan = isPaidPlan(c.planId) ? getPlan(c.planId) : null;
    return plan ? `${c.days} days of ${plan.name} free` : `${c.days} extra trial days`;
  }
  if (c.benefit === 'percent_off') {
    return `${c.percentOff}% off for ${c.durationMonths} month${c.durationMonths === 1 ? '' : 's'} (≈ ${realizedFreeDays(c)} free days)`;
  }
  if (c.benefit === 'credit') {
    return `${CURRENCY_SYMBOL}${(c.amountCents / 100).toFixed(2)} credit (≈ ${realizedFreeDays(c)} free days)`;
  }
  return 'Promo';
}

export type PromoCheck =
  | { ok: true; code: PromoRow }
  | { ok: false; error: string };

/** Validate a code exists and is currently redeemable (ignores per-tenant use). */
export async function validatePromo(codeStr: string): Promise<PromoCheck> {
  const code = normalizeCode(codeStr);
  if (!code) return { ok: false, error: 'Enter a promo code.' };
  const row = await prisma.promoCode.findUnique({ where: { code } });
  if (!row || !row.active) return { ok: false, error: 'That promo code is not valid.' };
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: 'That promo code has expired.' };
  }
  if (row.maxRedemptions > 0 && row.redemptionCount >= row.maxRedemptions) {
    return { ok: false, error: 'That promo code has reached its redemption limit.' };
  }
  return { ok: true, code: row };
}

export type PromoResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Redeem a code for a tenant and apply its benefit. Atomic: re-checks limits and
 * the per-tenant uniqueness inside a transaction so concurrent redemptions can't
 * over-spend a code.
 */
export async function redeemPromo(opts: {
  tenantId: string;
  userId?: string;
  code: string;
}): Promise<PromoResult> {
  const check = await validatePromo(opts.code);
  if (!check.ok) return check;
  const code = check.code;

  try {
    const message = await prisma.$transaction(async (tx) => {
      // Re-read the code under the transaction and re-check the global limit.
      const fresh = await tx.promoCode.findUnique({ where: { id: code.id } });
      if (!fresh || !fresh.active) throw new Error('That promo code is not valid.');
      if (fresh.maxRedemptions > 0 && fresh.redemptionCount >= fresh.maxRedemptions) {
        throw new Error('That promo code has reached its redemption limit.');
      }

      // One redemption per tenant.
      const existing = await tx.promoRedemption.findUnique({
        where: { codeId_tenantId: { codeId: fresh.id, tenantId: opts.tenantId } },
      });
      if (existing) throw new Error('You have already redeemed this code.');

      const tenant = await tx.tenant.findUnique({ where: { id: opts.tenantId } });
      if (!tenant) throw new Error('Account not found.');

      const now = new Date();

      // Every benefit type is realized as free time. Convert percent_off / credit
      // to an equivalent number of free days, then either comp a paid plan or
      // extend the trial.
      const days = realizedFreeDays(fresh, tenant.plan);
      if (days <= 0) throw new Error('This code has no value to apply.');

      // Comp target: the code's plan if it names one, else the tenant's current
      // paid plan, else extend the trial.
      const targetPlanId = isPaidPlan(fresh.planId) ? fresh.planId : isPaidPlan(tenant.plan) ? tenant.plan : '';

      let note: string;
      if (isPaidPlan(targetPlanId)) {
        // Extend the paid-through date from the later of now / current renewal.
        const base = tenant.planRenewsAt && tenant.planRenewsAt.getTime() > now.getTime() ? tenant.planRenewsAt : now;
        await tx.tenant.update({
          where: { id: tenant.id },
          data: { plan: targetPlanId, status: 'active', planRenewsAt: addDays(base, days) },
        });
        note = `${days} days of ${getPlan(targetPlanId).name} free`;
      } else {
        // Extend the trial from the later of now / current trial end.
        const base = tenant.trialEndsAt && tenant.trialEndsAt.getTime() > now.getTime() ? tenant.trialEndsAt : now;
        await tx.tenant.update({
          where: { id: tenant.id },
          data: { status: 'trialing', trialEndsAt: addDays(base, days) },
        });
        note = `${days} extra trial days`;
      }

      await tx.promoCode.update({ where: { id: fresh.id }, data: { redemptionCount: { increment: 1 } } });
      await tx.promoRedemption.create({
        data: { codeId: fresh.id, tenantId: opts.tenantId, userId: opts.userId || '', note },
      });

      return note;
    });

    return { ok: true, message: `Applied: ${message}.` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not redeem that code.' };
  }
}
