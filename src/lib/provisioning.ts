/**
 * Provisioning API auth + SSO tokens.
 *
 * The provisioning API lets an external billing system (the WHMCS module) create
 * and manage ChatMOO accounts. It's authenticated with a single shared secret
 * (PROVISIONING_API_KEY) sent as `Authorization: Bearer <key>` or `X-Api-Key`.
 *
 * SSO tokens are short-lived JWTs signed with AUTH_SECRET so a client can be
 * dropped straight into their ChatMOO dashboard from WHMCS without a password.
 */
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

export const PROVISIONING_CONFIGURED = !!(
  process.env.PROVISIONING_API_KEY && process.env.PROVISIONING_API_KEY.length >= 16
);

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** True if the request carries the correct provisioning API key. */
export function isProvisioningAuthed(req: Request): boolean {
  const key = process.env.PROVISIONING_API_KEY || '';
  if (!key || key.length < 16) return false;
  const hdr = req.headers.get('authorization') || '';
  const bearer = /^bearer\s+/i.test(hdr) ? hdr.replace(/^bearer\s+/i, '').trim() : '';
  const provided = bearer || req.headers.get('x-api-key') || '';
  if (!provided) return false;
  return safeEqual(provided, key);
}

const SSO_ALG = 'HS256';

function ssoSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_SECRET is missing or too short.');
  return new TextEncoder().encode(s);
}

/** Mint a short-lived single-sign-on token for a user (default 2 minutes). */
export async function issueSsoToken(userId: string, ttlSeconds = 120): Promise<string> {
  return new SignJWT({ uid: userId, purpose: 'sso' })
    .setProtectedHeader({ alg: SSO_ALG })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(ssoSecret());
}

/** Verify an SSO token and return the user id, or null if invalid/expired. */
export async function consumeSsoToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, ssoSecret(), { algorithms: [SSO_ALG] });
    if (payload.purpose !== 'sso') return null;
    return String(payload.uid);
  } catch {
    return null;
  }
}
