/**
 * Subscription plans. Limits are enforced in code (Stage 1); Stripe price IDs
 * get wired up in Stage 2. Tune these freely — they're your packaging.
 */
export type PlanId = 'free' | 'starter' | 'pro' | 'business';

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number; // display only until Stripe is connected
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
    priceMonthly: 0,
    messagesPerMonth: 100,
    models: ['claude-haiku-4-5-20251001'],
    features: { liveChat: false, leadCapture: true, removeBranding: false, extraDomains: 0 },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 29,
    messagesPerMonth: 1500,
    models: ['claude-haiku-4-5-20251001'],
    features: { liveChat: false, leadCapture: true, removeBranding: false, extraDomains: 1 },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 79,
    messagesPerMonth: 6000,
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'],
    features: { liveChat: true, leadCapture: true, removeBranding: true, extraDomains: 3 },
    highlight: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    priceMonthly: 199,
    messagesPerMonth: 25000,
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
