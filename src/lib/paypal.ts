/**
 * Minimal PayPal Subscriptions client (REST v1/v2).
 * Docs: https://developer.paypal.com/docs/subscriptions/
 *
 * Required env:
 *   PAYPAL_ENV=sandbox|live
 *   PAYPAL_CLIENT_ID, PAYPAL_SECRET
 *   PAYPAL_WEBHOOK_ID            (for webhook signature verification)
 *   PAYPAL_PLAN_STARTER/PRO/BUSINESS  (plan IDs from scripts/paypal-setup.ts)
 */

export const PAYPAL_CONFIGURED = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);

export function paypalBase(): string {
  return (process.env.PAYPAL_ENV || 'sandbox') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;
  const id = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_SECRET || '';
  const auth = Buffer.from(`${id}:${secret}`).toString('base64');

  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

async function ppFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${paypalBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  return res;
}

export interface CreatedSubscription {
  id: string;
  approveUrl: string;
}

/** Create a subscription tied to a tenant via custom_id, returns the approval URL. */
export async function createSubscription(opts: {
  planId: string;
  tenantId: string;
  brandName: string;
  returnUrl: string;
  cancelUrl: string;
  subscriberEmail?: string;
}): Promise<CreatedSubscription> {
  const res = await ppFetch('/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: opts.planId,
      custom_id: opts.tenantId,
      subscriber: opts.subscriberEmail ? { email_address: opts.subscriberEmail } : undefined,
      application_context: {
        brand_name: opts.brandName,
        user_action: 'SUBSCRIBE_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
  });
  if (!res.ok) throw new Error(`createSubscription failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const approve = (data.links || []).find((l: any) => l.rel === 'approve');
  if (!approve) throw new Error('No approval link returned by PayPal');
  return { id: data.id, approveUrl: approve.href };
}

export async function getSubscription(id: string): Promise<any> {
  const res = await ppFetch(`/v1/billing/subscriptions/${id}`, { method: 'GET' });
  if (!res.ok) throw new Error(`getSubscription failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function cancelSubscription(id: string, reason = 'Customer cancelled'): Promise<void> {
  const res = await ppFetch(`/v1/billing/subscriptions/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  // 204 = success; 422 often means already cancelled — treat as ok.
  if (!res.ok && res.status !== 422) {
    throw new Error(`cancelSubscription failed: ${res.status} ${await res.text()}`);
  }
}

/** Verify a webhook came from PayPal (prevents spoofed plan upgrades). */
export async function verifyWebhookSignature(headers: Headers, body: any): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const res = await ppFetch('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_time: headers.get('paypal-transmission-time'),
      cert_url: headers.get('paypal-cert-url'),
      auth_algo: headers.get('paypal-auth-algo'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      webhook_id: webhookId,
      webhook_event: body,
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}

// ── used by scripts/paypal-setup.ts ────────────────────────────────
export async function createProduct(name: string, description: string): Promise<string> {
  const res = await ppFetch('/v1/catalogs/products', {
    method: 'POST',
    body: JSON.stringify({ name, description, type: 'SERVICE', category: 'SOFTWARE' }),
  });
  if (!res.ok) throw new Error(`createProduct failed: ${res.status} ${await res.text()}`);
  return (await res.json()).id;
}

export async function createPlan(opts: {
  productId: string;
  name: string;
  price: number;
  currency?: string;
  intervalUnit?: 'MONTH' | 'YEAR';
}): Promise<string> {
  const res = await ppFetch('/v1/billing/plans', {
    method: 'POST',
    body: JSON.stringify({
      product_id: opts.productId,
      name: opts.name,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: { interval_unit: opts.intervalUnit || 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // 0 = until cancelled
          pricing_scheme: {
            fixed_price: { value: opts.price.toFixed(2), currency_code: opts.currency || 'USD' },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 2,
      },
    }),
  });
  if (!res.ok) throw new Error(`createPlan failed: ${res.status} ${await res.text()}`);
  return (await res.json()).id;
}
