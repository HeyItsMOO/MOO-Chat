/**
 * Promo codes.
 *
 * A code grants ONE of three benefits when redeemed by a tenant:
 *   - free_days   : extend the trial by N days, or (if planId set) comp that
 *                   plan free for N days — fully under our control.
 *   - percent_off : a % discount for N months, recorded on the tenant and
 *                   surfaced at checkout (applied where billing supports it).
 *   - credit      : add an account-credit balance (cents).
 *
 * Each tenant can redeem a given code once; codes can have an expiry and a max
 * total redemptions.
 */
import { prisma } from './db';
import { PLANS, CURRENCY_SYMBOL, getPlan, type PlanId } from './plans';

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
function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

type PromoRow = NonNullable<Awaited<ReturnType<typeof prisma.promoCode.findUnique>>>;

/** A plain-English summary of what a code does (admin list + success message). */
export function describePromo(c: {
  benefit: string;
  planId: string;
  days: number;
  percentOff: number;
  durationMonths: number;
  amountCents: number;
  currency: string;
}): string {
  if (c.benefit === 'free_days') {
    const plan = c.planId && (c.planId as PlanId) in PLANS ? getPlan(c.planId) : null;
    return plan ? `${c.days} days of ${plan.name} free` : `${c.days} extra trial days`;
  }
  if (c.benefit === 'percent_off') {
    return `${c.percentOff}% off for ${c.durationMonths} month${c.durationMonths === 1 ? '' : 's'}`;
  }
  if (c.benefit === 'credit') {
    return `${CURRENCY_SYMBOL}${(c.amountCents / 100).toFixed(2)} account credit`;
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
      const note = describePromo(fresh);

      if (fresh.benefit === 'free_days') {
        const compPlan = fresh.planId && (fresh.planId as PlanId) in PLANS && fresh.planId !== 'free';
        if (compPlan) {
          // Comp the plan: extend the paid-through date from the later of now /
          // current renewal, and flip the account active on that plan.
          const base = tenant.planRenewsAt && tenant.planRenewsAt.getTime() > now.getTime() ? tenant.planRenewsAt : now;
          await tx.tenant.update({
            where: { id: tenant.id },
            data: { plan: fresh.planId, status: 'active', planRenewsAt: addDays(base, fresh.days) },
          });
        } else {
          // Extend the trial from the later of now / current trial end.
          const base = tenant.trialEndsAt && tenant.trialEndsAt.getTime() > now.getTime() ? tenant.trialEndsAt : now;
          await tx.tenant.update({
            where: { id: tenant.id },
            data: { status: 'trialing', trialEndsAt: addDays(base, fresh.days) },
          });
        }
      } else if (fresh.benefit === 'percent_off') {
        const base = tenant.discountUntil && tenant.discountUntil.getTime() > now.getTime() ? tenant.discountUntil : now;
        await tx.tenant.update({
          where: { id: tenant.id },
          data: { discountPercent: fresh.percentOff, discountUntil: addMonths(base, fresh.durationMonths) },
        });
      } else if (fresh.benefit === 'credit') {
        await tx.tenant.update({
          where: { id: tenant.id },
          data: { creditCents: { increment: fresh.amountCents } },
        });
      } else {
        throw new Error('Unsupported promo type.');
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
