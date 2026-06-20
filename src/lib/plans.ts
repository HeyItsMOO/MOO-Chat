/**
 * Subscription plans (AUD) + trial logic.
 *
 * Pricing is tuned for the Australian SMB market: a tiny free tier for
 * frictionless signup, then paid tiers, then a "Custom" enterprise tier that's
 * quoted per account (no public price). New signups get a no-card trial of the
 * TRIAL plan that always ends on a Monday (see computeTrialEnd).
 *
 * Plan ids are kept stable (free/starter/pro/business/custom) so existing
 * tenants and PayPal plan mappings don't break — only the display names,
 * prices, and limits changed.
 *
 * Billing can be monthly or yearly. Yearly = 10× the monthly price (2 months
 * free); see priceForInterval / YEARLY_MONTHS_CHARGED.
 */
export type PlanId = 'free' | 'starter' | 'pro' | 'business' | 'custom';

export type BillingInterval = 'monthly' | 'yearly';

export const CURRENCY = 'AUD';
export const CURRENCY_SYMBOL = 'A$';

/** A yearly subscription is charged for this many months (2 months free). */
export const YEARLY_MONTHS_CHARGED = 10;

/** Trial is at least this many days and always ends on a Monday. */
export const TRIAL_MIN_DAYS = 5;
/** Trialing tenants get this plan's features + limits. */
export const TRIAL_PLAN_ID: PlanId = 'pro';

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // AUD
  /** True for quote-on-request tiers (no public price, no self-serve checkout). */
  contactSales?: boolean;
  /** Included AI replies per month. */
  messagesPerMonth: number;
  /** Allowed AI model tiers. */
  models: string[];
  features: {
    liveChat: boolean;
    leadCapture: boolean;
    removeBranding: boolean;
    /** Inject the tenant's own custom scripts on their site alongside the widget. */
    customScripts: boolean;
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
    features: { liveChat: false, leadCapture: true, removeBranding: false, customScripts: false, extraDomains: 0 },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'For a growing site',
    priceMonthly: 49,
    messagesPerMonth: 2000,
    models: ['claude-haiku-4-5-20251001'],
    features: { liveChat: false, leadCapture: true, removeBranding: false, customScripts: false, extraDomains: 1 },
  },
  pro: {
    id: 'pro',
    name: 'Growth',
    tagline: 'Most popular',
    priceMonthly: 129,
    messagesPerMonth: 8000,
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'],
    features: { liveChat: true, leadCapture: true, removeBranding: true, customScripts: true, extraDomains: 3 },
    highlight: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'High volume + control',
    priceMonthly: 349,
    messagesPerMonth: 30000,
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8'],
    features: { liveChat: true, leadCapture: true, removeBranding: true, customScripts: true, extraDomains: 25 },
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    tagline: 'Tailored for scale',
    priceMonthly: 0, // quoted per account — see contactSales
    contactSales: true,
    messagesPerMonth: 100000,
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8'],
    features: { liveChat: true, leadCapture: true, removeBranding: true, customScripts: true, extraDomains: 100 },
  },
};

export function getPlan(id: string): Plan {
  return PLANS[(id as PlanId)] ?? PLANS.free;
}

/** Self-serve tiers shown in the main pricing grid (Custom is rendered separately). */
export const PLAN_LIST: Plan[] = [PLANS.free, PLANS.starter, PLANS.pro, PLANS.business];

/** The quote-on-request tier (shown as its own card / CTA). */
export const CUSTOM_PLAN: Plan = PLANS.custom;

/** Paid plans with a PayPal subscription plan (self-serve checkout). */
export const PAID_PLAN_IDS: PlanId[] = ['starter', 'pro', 'business'];

// ── Pricing helpers ─────────────────────────────────────────────────

/** The charged price for a plan on a given billing interval (AUD). */
export function priceForInterval(plan: Plan, interval: BillingInterval): number {
  if (plan.priceMonthly === 0) return 0;
  return interval === 'yearly' ? plan.priceMonthly * YEARLY_MONTHS_CHARGED : plan.priceMonthly;
}

/** Format an AUD price for display, e.g. "Free" or "A$129". */
export function formatPrice(priceMonthly: number): string {
  return priceMonthly === 0 ? 'Free' : `${CURRENCY_SYMBOL}${priceMonthly}`;
}

/**
 * Display label + period for a plan card, honouring Custom (contact sales) and
 * the chosen interval. e.g. { price: 'A$1,290', period: '/yr', sub: 'A$108/mo billed yearly' }.
 */
export function planPriceLabel(plan: Plan, interval: BillingInterval = 'monthly') {
  if (plan.contactSales) return { price: 'Custom', period: '', sub: "Let's talk" };
  if (plan.priceMonthly === 0) return { price: 'Free', period: '', sub: '' };
  if (interval === 'yearly') {
    const yearly = priceForInterval(plan, 'yearly');
    const perMonth = Math.round(yearly / 12);
    return {
      price: `${CURRENCY_SYMBOL}${yearly.toLocaleString()}`,
      period: '/yr',
      sub: `${CURRENCY_SYMBOL}${perMonth.toLocaleString()}/mo billed yearly · 2 months free`,
    };
  }
  return { price: `${CURRENCY_SYMBOL}${plan.priceMonthly.toLocaleString()}`, period: '/mo', sub: '' };
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

// ── PayPal plan-id mapping (monthly + yearly) ───────────────────────

/**
 * The PayPal plan id for one of our tiers on a given interval (from env, set by
 * scripts/paypal-setup.ts). Yearly uses the PAYPAL_PLAN_<TIER>_YEARLY vars.
 */
export function paypalPlanIdFor(plan: PlanId, interval: BillingInterval = 'monthly'): string | undefined {
  const monthly: Record<string, string | undefined> = {
    starter: process.env.PAYPAL_PLAN_STARTER,
    pro: process.env.PAYPAL_PLAN_PRO,
    business: process.env.PAYPAL_PLAN_BUSINESS,
  };
  const yearly: Record<string, string | undefined> = {
    starter: process.env.PAYPAL_PLAN_STARTER_YEARLY,
    pro: process.env.PAYPAL_PLAN_PRO_YEARLY,
    business: process.env.PAYPAL_PLAN_BUSINESS_YEARLY,
  };
  return (interval === 'yearly' ? yearly : monthly)[plan];
}

/** Reverse-map a PayPal plan id back to one of our tiers (used by the webhook). */
export function planFromPaypalPlanId(ppPlanId: string | undefined | null): PlanId | null {
  if (!ppPlanId) return null;
  const map: Record<string, PlanId> = {};
  for (const [tier, monthly, yearly] of [
    ['starter', process.env.PAYPAL_PLAN_STARTER, process.env.PAYPAL_PLAN_STARTER_YEARLY],
    ['pro', process.env.PAYPAL_PLAN_PRO, process.env.PAYPAL_PLAN_PRO_YEARLY],
    ['business', process.env.PAYPAL_PLAN_BUSINESS, process.env.PAYPAL_PLAN_BUSINESS_YEARLY],
  ] as const) {
    if (monthly) map[monthly] = tier;
    if (yearly) map[yearly] = tier;
  }
  return map[ppPlanId] ?? null;
}
