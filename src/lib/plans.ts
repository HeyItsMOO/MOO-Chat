/**
 * Subscription plans (AUD) + trial logic.
 *
 * Pricing is tuned for the Australian SMB market: a tiny free tier for
 * frictionless signup, then paid tiers. New signups get a no-card trial of the
 * TRIAL plan that always ends on a Monday (see computeTrialEnd).
 *
 * Plan ids are kept stable (free/starter/pro/business) so existing tenants and
 * PayPal plan mappings don't break — only the display names, prices, and limits
 * changed.
 */
export type PlanId = 'free' | 'starter' | 'pro' | 'business';

export const CURRENCY = 'AUD';
export const CURRENCY_SYMBOL = 'A$';

/** Trial is at least this many days and always ends on a Monday. */
export const TRIAL_MIN_DAYS = 5;
/** Trialing tenants get this plan's features + limits. */
export const TRIAL_PLAN_ID: PlanId = 'pro';

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // AUD
  /** Included AI replies per month. */
  messagesPerMonth: number;
  /** Allowed AI model tiers. */
  models: string[];
  features: {
    liveChat: boolean;
    leadCapture: boolean;
    removeBranding: boolean;
    extraDomains: number; // additional embed domains beyond the primary
  };
  highlight?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Kick the tyres',
    priceMonthly: 0,
    messagesPerMonth: 50,
    models: ['claude-haiku-4-5-20251001'],
    features: { liveChat: false, leadCapture: true, removeBranding: false, extraDomains: 0 },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'For a growing site',
    priceMonthly: 49,
    messagesPerMonth: 2000,
    models: ['claude-haiku-4-5-20251001'],
    features: { liveChat: false, leadCapture: true, removeBranding: false, extraDomains: 1 },
  },
  pro: {
    id: 'pro',
    name: 'Growth',
    tagline: 'Most popular',
    priceMonthly: 129,
    messagesPerMonth: 8000,
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'],
    features: { liveChat: true, leadCapture: true, removeBranding: true, extraDomains: 3 },
    highlight: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'High volume + control',
    priceMonthly: 349,
    messagesPerMonth: 30000,
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8'],
    features: { liveChat: true, leadCapture: true, removeBranding: true, extraDomains: 25 },
  },
};

export function getPlan(id: string): Plan {
  return PLANS[(id as PlanId)] ?? PLANS.free;
}

export const PLAN_LIST: Plan[] = [PLANS.free, PLANS.starter, PLANS.pro, PLANS.business];

/** Paid plans only (have a PayPal subscription plan). */
export const PAID_PLAN_IDS: PlanId[] = ['starter', 'pro', 'business'];

/** Format an AUD price for display, e.g. "Free" or "A$129". */
export function formatPrice(priceMonthly: number): string {
  return priceMonthly === 0 ? 'Free' : `${CURRENCY_SYMBOL}${priceMonthly}`;
}

// ── Trial ───────────────────────────────────────────────────────────

type TrialTenant = { plan: string; status: string; trialEndsAt: Date | string | null };

/**
 * Trial end date: at least TRIAL_MIN_DAYS away, then rolled forward to the next
 * Monday. e.g. sign up Mon → ends the following Mon; sign up Sat → ends the
 * Monday at least 5 days out. Returns end-of-day UTC.
 */
export function computeTrialEnd(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + TRIAL_MIN_DAYS);
  // Roll forward to Monday (getUTCDay: 0=Sun … 1=Mon … 6=Sat).
  const daysToMonday = (8 - d.getUTCDay()) % 7; // 0 if already Monday
  d.setUTCDate(d.getUTCDate() + daysToMonday);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export function isTrialActive(t: TrialTenant): boolean {
  if (t.status !== 'trialing' || !t.trialEndsAt) return false;
  return new Date(t.trialEndsAt).getTime() > Date.now();
}

/** The plan a tenant effectively has right now (TRIAL plan while trialing). */
export function effectivePlanId(t: TrialTenant): PlanId {
  return isTrialActive(t) ? TRIAL_PLAN_ID : ((t.plan as PlanId) in PLANS ? (t.plan as PlanId) : 'free');
}

export function effectivePlan(t: TrialTenant): Plan {
  return PLANS[effectivePlanId(t)];
}

/** Whole days left in the trial (0 if not trialing). */
export function trialDaysLeft(t: TrialTenant): number {
  if (!isTrialActive(t) || !t.trialEndsAt) return 0;
  const ms = new Date(t.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/** The PayPal plan id for one of our tiers (from env, set by scripts/paypal-setup.ts). */
export function paypalPlanIdFor(plan: PlanId): string | undefined {
  const map: Record<string, string | undefined> = {
    starter: process.env.PAYPAL_PLAN_STARTER,
    pro: process.env.PAYPAL_PLAN_PRO,
    business: process.env.PAYPAL_PLAN_BUSINESS,
  };
  return map[plan];
}

/** Reverse-map a PayPal plan id back to one of our tiers (used by the webhook). */
export function planFromPaypalPlanId(ppPlanId: string | undefined | null): PlanId | null {
  if (!ppPlanId) return null;
  if (ppPlanId === process.env.PAYPAL_PLAN_STARTER) return 'starter';
  if (ppPlanId === process.env.PAYPAL_PLAN_PRO) return 'pro';
  if (ppPlanId === process.env.PAYPAL_PLAN_BUSINESS) return 'business';
  return null;
}
