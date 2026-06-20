/**
 * Referral / affiliate program.
 *
 * Each tenant gets a shareable code (`/signup?ref=CODE`). When a new tenant
 * signs up with that code we record a Referral for the referrer. It starts
 * `pending` and flips to `earned` (a payable commission) once the referred
 * tenant becomes a paying customer. The platform owner pays affiliates out
 * manually and marks each one `paid` from the admin.
 *
 * Commission is a flat amount per converted referral, configurable with
 * REFERRAL_COMMISSION_CENTS (default A$20.00).
 */
import crypto from 'crypto';
import { prisma } from './db';
import { CURRENCY_SYMBOL } from './plans';

export const REFERRAL_COMMISSION_CENTS = Math.max(
  0,
  Math.round(Number(process.env.REFERRAL_COMMISSION_CENTS) || 2000),
);
export const REFERRAL_CURRENCY = 'AUD';

// No ambiguous characters (0/O, 1/I) so codes are easy to read and share.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferralCode(len = 6): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function normalizeRefCode(input: string): string {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
}

export function formatMoney(cents: number): string {
  return `${CURRENCY_SYMBOL}${(cents / 100).toFixed(2)}`;
}

/** Allocate (once) and return a tenant's own shareable referral code. */
export async function ensureReferralCode(tenantId: string): Promise<string> {
  const existing = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateReferralCode();
    try {
      // eslint-disable-next-line no-await-in-loop
      await prisma.tenant.update({ where: { id: tenantId }, data: { referralCode: code } });
      return code;
    } catch {
      // Unique collision (astronomically rare) — try another code.
    }
  }
  throw new Error('Could not allocate a referral code.');
}

/**
 * Record a referral for a brand-new tenant if `code` belongs to a *different*
 * tenant. Best-effort: this must never break the signup flow, so all failures
 * are swallowed.
 */
export async function recordReferral(opts: {
  code: string;
  referredTenantId: string;
  referredName: string;
}): Promise<void> {
  try {
    const code = normalizeRefCode(opts.code);
    if (!code) return;
    const referrer = await prisma.tenant.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!referrer || referrer.id === opts.referredTenantId) return;

    await prisma.referral.create({
      data: {
        code,
        referrerId: referrer.id,
        referredId: opts.referredTenantId,
        referredName: opts.referredName.slice(0, 120),
        commissionCents: REFERRAL_COMMISSION_CENTS,
        currency: REFERRAL_CURRENCY,
        status: 'pending',
      },
    });
  } catch {
    // referredId is unique (one referral per referred tenant) — ignore dupes
    // and any other error; a missed referral must never block signup.
  }
}

/**
 * When a referred tenant first becomes a paying customer, flip its pending
 * referral to `earned` so the commission becomes payable. Idempotent and
 * best-effort.
 */
export async function markReferralEarned(referredTenantId: string): Promise<void> {
  try {
    await prisma.referral.updateMany({
      where: { referredId: referredTenantId, status: 'pending' },
      data: { status: 'earned', earnedAt: new Date() },
    });
  } catch {
    // best-effort
  }
}

export interface ReferralStats {
  total: number;
  pending: number;
  earned: number;
  paid: number;
  earnedCents: number; // payable (earned, not yet paid)
  paidCents: number;
  pendingCents: number;
}

/** Aggregate a referrer's commissions for their dashboard summary. */
export function summarizeReferrals(
  rows: { status: string; commissionCents: number }[],
): ReferralStats {
  const s: ReferralStats = {
    total: rows.length,
    pending: 0,
    earned: 0,
    paid: 0,
    earnedCents: 0,
    paidCents: 0,
    pendingCents: 0,
  };
  for (const r of rows) {
    if (r.status === 'pending') {
      s.pending += 1;
      s.pendingCents += r.commissionCents;
    } else if (r.status === 'earned') {
      s.earned += 1;
      s.earnedCents += r.commissionCents;
    } else if (r.status === 'paid') {
      s.paid += 1;
      s.paidCents += r.commissionCents;
    }
  }
  return s;
}
