# Deploying ChatMOO (Postgres + Vercel)

The app runs on **PostgreSQL** everywhere (local and production). This is the exact,
ordered runbook. ~20 minutes.

## 0. Accounts you'll need (all have free tiers)
- **Neon** (Postgres) — https://neon.tech  (Supabase or Vercel Postgres work too)
- **Vercel** (hosting) — https://vercel.com
- **Anthropic** (the AI) — https://console.anthropic.com
- **PayPal Developer** (billing, optional at first) — https://developer.paypal.com
- **Resend** (email, optional at first) — https://resend.com

## 1. Create the database
In Neon, create a project → copy the **connection string** (looks like
`postgresql://user:pass@host/db?sslmode=require`).

## 2. Push to GitHub
The repo is already a Git repository with the Next.js app at its **root** (no
sub-folder). Push it to GitHub:
```bash
git add -A && git commit -m "ChatMOO"
git push -u origin main
```
(Or create an empty repo in the GitHub UI and add it as `origin` first.)

## 3. Deploy on Vercel
1. Import the repo in Vercel. The **Root Directory** is the repo root — leave it as-is;
   Next.js is auto-detected.
2. **Build command:** already pinned by `vercel.json` to `npm run vercel-build`, which runs
   `prisma generate && prisma db push && next build`. `prisma db push` creates the tables on
   the first deploy, so there is no separate migration step.
3. Add **Environment Variables** (Production):

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | your Neon connection string |
   | `ANTHROPIC_API_KEY` | from console.anthropic.com |
   | `AUTH_SECRET` | a long random string (`openssl rand -hex 48`) |
   | `NEXT_PUBLIC_APP_URL` | your final URL, e.g. `https://app.heyitsmoo.com` |
   | `PAYPAL_ENV` / `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` | when enabling billing |
   | `PAYPAL_WEBHOOK_ID` | **required** once billing is on (see §5) |
   | `PAYPAL_PLAN_STARTER/PRO/BUSINESS` | from `npm run paypal:setup` |
   | `RESEND_API_KEY` / `EMAIL_FROM` | when enabling email |

4. Deploy. To load the demo + admin once (optional), run the seed locally with
   `DATABASE_URL` pointed at your production Postgres:
   ```bash
   npm run db:seed
   ```
   Visit the URL — log in as the seeded admin to confirm.

> **Versioned migrations (optional).** This setup uses `prisma db push`, which syncs the
> schema directly — simplest for a single app and fine for production at this scale. If you
> later want a migration history, run `npx prisma migrate dev --name init` against your
> Postgres URL, commit the generated `prisma/migrations/` folder, and switch the
> `vercel-build` script from `prisma db push` to `prisma migrate deploy`.

## 4. Point your domain
In Vercel → Project → Domains, add `app.heyitsmoo.com` and follow the DNS steps.
Set `NEXT_PUBLIC_APP_URL` to that domain and redeploy so the embed snippet uses it.

## 5. Turn on billing (when ready)
1. Locally with prod PayPal creds: `npm run paypal:setup` → paste the printed
   `PAYPAL_PLAN_*` lines into Vercel env.
2. In the PayPal dashboard, create a **webhook** → URL `https://YOUR-APP/api/webhooks/paypal`,
   events `BILLING.SUBSCRIPTION.*` and `PAYMENT.SALE.COMPLETED`. Copy its **Webhook ID**
   into `PAYPAL_WEBHOOK_ID`. **This is required** — the webhook rejects unverified events,
   so billing won't update tenants without it.

## 6. Production hardening (recommended)
- **Rate limiting:** the in-memory limiter in `src/lib/tenant.ts` is per-instance and
  resets on cold start. For real protection, back it with **Vercel KV / Upstash Redis**
  (same `rateLimit(key, limit)` interface). The DB-backed monthly quota still caps cost.
- **Client IP:** `clientIp()` prefers Vercel's `x-vercel-forwarded-for`; if you put
  Cloudflare in front, adjust the trusted header order.
- Keep `PAYPAL_WEBHOOK_INSECURE` unset (it must never be `1` in production).
- **Auto-fill SSRF defence-in-depth:** the scraper (`src/lib/scrape.ts`) blocks
  private/loopback/link-local/metadata IPs and re-checks every redirect hop, but a
  narrow DNS-rebinding window remains. Where possible, run on an egress-restricted
  network policy that blocks RFC1918 ranges and `169.254.169.254` so the function
  can't reach internal services regardless.

## Notes
- The seed's demo tenant (`moo_demo_insuregroup`) powers the landing-page live demo and
  is allow-listed for your app domain automatically (it reads `NEXT_PUBLIC_APP_URL`).
- To rename the product, edit `src/lib/brand.ts` only.
