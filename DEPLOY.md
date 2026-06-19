# Deploying MOO Chat (Neon Postgres + Vercel)

Local dev runs on SQLite with zero setup. Production needs Postgres. This is the
exact, ordered runbook. ~30 minutes.

## 0. Accounts you'll need (all have free tiers)
- **Neon** (Postgres) — https://neon.tech
- **Vercel** (hosting) — https://vercel.com
- **Anthropic** (the AI) — https://console.anthropic.com
- **PayPal Developer** (billing, optional at first) — https://developer.paypal.com
- **Resend** (email, optional at first) — https://resend.com

## 1. Create the database
1. In Neon, create a project → copy the **connection string** (looks like
   `postgresql://user:pass@host/db?sslmode=require`).

## 2. Switch the schema to Postgres
In `prisma/schema.prisma`, change the datasource provider:
```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

## 3. Generate the initial migration against Neon
From `frontdesk/`, with `DATABASE_URL` set to your Neon string:
```bash
# PowerShell:  $env:DATABASE_URL="postgresql://...";  bash:  export DATABASE_URL="postgresql://..."
npx prisma migrate dev --name init      # creates prisma/migrations/ AND applies it to Neon
npm run db:seed                          # seed the demo + admin (optional in prod)
```
Commit the generated `prisma/migrations/` folder — Vercel uses it.

## 4. Push to GitHub
```bash
cd frontdesk
git init && git add -A && git commit -m "MOO Chat"
gh repo create moo-chat --private --source=. --push      # or push to a repo you made
```

## 5. Deploy on Vercel
1. Import the repo in Vercel. Set the **Root Directory** to `frontdesk` if the repo
   root is one level up.
2. **Build command:** `npm run vercel-build` (runs `prisma migrate deploy` then builds).
3. Add **Environment Variables** (Production):

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | your Neon connection string |
   | `ANTHROPIC_API_KEY` | from console.anthropic.com |
   | `AUTH_SECRET` | a long random string (`openssl rand -hex 48`) |
   | `NEXT_PUBLIC_APP_URL` | your final URL, e.g. `https://app.heyitsmoo.com` |
   | `PAYPAL_ENV` / `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` | when enabling billing |
   | `PAYPAL_WEBHOOK_ID` | **required** once billing is on (see §7) |
   | `PAYPAL_PLAN_STARTER/PRO/BUSINESS` | from `npm run paypal:setup` |
   | `RESEND_API_KEY` / `EMAIL_FROM` | when enabling email |

4. Deploy. Visit the URL — log in as the seeded admin to confirm.

## 6. Point your domain
In Vercel → Project → Domains, add `app.heyitsmoo.com` and follow the DNS steps.
Set `NEXT_PUBLIC_APP_URL` to that domain and redeploy so the embed snippet uses it.

## 7. Turn on billing (when ready)
1. Locally with prod PayPal creds: `npm run paypal:setup` → paste the printed
   `PAYPAL_PLAN_*` lines into Vercel env.
2. In the PayPal dashboard, create a **webhook** → URL `https://YOUR-APP/api/webhooks/paypal`,
   events `BILLING.SUBSCRIPTION.*` and `PAYMENT.SALE.COMPLETED`. Copy its **Webhook ID**
   into `PAYPAL_WEBHOOK_ID`. **This is required** — the webhook rejects unverified events,
   so billing won't update tenants without it.

## 8. Production hardening (recommended)
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
