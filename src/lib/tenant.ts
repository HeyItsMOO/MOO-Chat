import crypto from 'crypto';
import { prisma } from './db';

/** Normalize a host: lowercase, strip leading www. */
export function normalizeHost(input: string | null | undefined): string {
  if (!input) return '';
  let host = input.trim().toLowerCase();
  // Accept a full URL or a bare host.
  try {
    if (host.includes('://')) host = new URL(host).host;
  } catch {
    /* fall through */
  }
  host = host.replace(/:\d+$/, ''); // strip port
  host = host.replace(/^www\./, '');
  return host;
}

export function hostFromOriginOrReferer(origin: string | null, referer: string | null): string {
  return normalizeHost(origin || referer || '');
}

/**
 * Is this request origin allowed to use the tenant's widget?
 * Rule: the tenant's own website host is always allowed, plus any AllowedDomain
 * rows. Same-origin requests (the embed served by this same app) and localhost
 * in development are always allowed for easy testing.
 *
 * `selfHost` is this app's own serving host (the request's Host header). When
 * the page making the request is served by us — e.g. our always-on site bot on
 * our marketing site — it's same-origin and trusted regardless of which domain
 * (vercel alias, custom domain, …) the app happens to be on. A third-party site
 * can never make a browser send a request whose Origin/Referer equals our host.
 */
export function isOriginAllowed(
  reqHost: string,
  tenantWebsite: string,
  allowed: { domain: string }[],
  selfHost?: string | null,
): boolean {
  // Same-origin embed (our own bot on our own domain): always trusted.
  const self = normalizeHost(selfHost);
  if (reqHost && self && reqHost === self) return true;
  // Fail closed in production: a real browser always sends Origin (cross-origin
  // POST) or Referer (same-origin embed). A header-less direct API call (curl,
  // server-to-server) is treated as not-allowed in prod so a scraped public key
  // can't be used to drive the shared AI key off-site. Allowed in dev for testing.
  if (!reqHost) return process.env.NODE_ENV !== 'production';
  if (process.env.NODE_ENV !== 'production' && (reqHost === 'localhost' || reqHost === '127.0.0.1')) {
    return true;
  }
  const own = normalizeHost(tenantWebsite);
  if (own && (reqHost === own || reqHost.endsWith('.' + own))) return true;
  return allowed.some((a) => {
    const d = normalizeHost(a.domain);
    return d && (reqHost === d || reqHost.endsWith('.' + d));
  });
}

export function generatePublicKey(): string {
  // Public, safe to expose in HTML. Prefixed so it's recognizable.
  return 'moo_' + crypto.randomBytes(16).toString('hex');
}

export function hashIp(ip: string): string {
  return crypto.createHash('md5').update(ip).digest('hex');
}

export function clientIp(headers: Headers): string {
  // Prefer headers set by the trusted platform edge (Vercel sets
  // x-vercel-forwarded-for / x-real-ip to the true client and a client cannot
  // override the platform-set value). Raw cf-connecting-ip / leftmost
  // x-forwarded-for are client-spoofable, so they're the last resort.
  // NOTE: behind a different proxy, configure trusted-proxy parsing accordingly.
  const ordered = ['x-vercel-forwarded-for', 'x-real-ip', 'x-forwarded-for', 'cf-connecting-ip'];
  for (const key of ordered) {
    const v = headers.get(key);
    if (v) {
      const ip = v.split(',')[0].trim();
      if (ip) return ip;
    }
  }
  return '0.0.0.0';
}

// ── Simple in-memory rate limiter ──────────────────────────────────
// Good enough for local dev and single-instance deploys. For multi-region
// serverless, swap this for Upstash Redis or Vercel KV (same interface).
// Entries are pruned so the Map can't grow unbounded.
const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 20000;

function pruneBuckets(now: number) {
  for (const [k, v] of buckets) {
    if (now > v.resetAt) buckets.delete(k);
  }
  if (buckets.size > MAX_BUCKETS) buckets.clear(); // last-resort memory bound
}

export function rateLimit(key: string, limitPerHour: number): boolean {
  if (limitPerHour <= 0) return true; // 0 = unlimited
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    if (buckets.size >= MAX_BUCKETS) pruneBuckets(now);
    buckets.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (b.count >= limitPerHour) return false;
  b.count += 1;
  return true;
}

export async function loadTenantByPublicKey(publicKey: string) {
  if (!publicKey) return null;
  return prisma.tenant.findUnique({
    where: { publicKey },
    include: { assistant: true, allowedDomains: true },
  });
}
