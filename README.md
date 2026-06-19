# MOO Chat — by HeyItsMOO

A multi-tenant SaaS platform that turns one AI chatbot into a product you can sell to
any store. Each customer ("tenant") gets their own assistant — branding, knowledge base,
and usage meter — installable on any website with **one script tag**.

> The product name lives in `src/lib/brand.ts` (currently **MOO Chat**, a HeyItsMOO product).

> Built from the InsureGroup WordPress chatbot. The original per-site model (each site
> holds its own AI key) is flipped to a **central gateway**: the platform holds one
> Anthropic key and meters usage per tenant, which is what makes subscriptions possible.

---

## Quick start (local)

```bash
cd frontdesk
npm install                      # already done
cp .env.example .env             # a .env is already created for you
#  → open .env and paste your ANTHROPIC_API_KEY to enable live AI replies
npm run db:push                  # create the SQLite database (already done)
npm run db:seed                  # seed demo data (already done)
npm run dev                      # http://localhost:3000
```

### Demo logins (from the seed)

| Role | Email | Password |
|------|-------|----------|
| Customer (owns the InsureGroup demo) | `demo@moochat.app` | `demo12345` |
| Platform super-admin (you) | `admin@moochat.app` | `admin12345` |

The landing page (`/`) has a **live demo widget** in the corner running the seeded
InsureGroup assistant. Add your `ANTHROPIC_API_KEY` to `.env` and it will give real answers.

---

## What works today (Stages 1–6 — feature-complete)

> Stage 2 = PayPal billing · Stage 3 = lead-capture forms + email + inbox ·
> Stage 4 = live chat / human takeover (Pro+) · Stage 5 = URL auto-fill + WordPress plugin +
> Shopify embed (see `integrations/`) · Stage 6 = super-admin console at `/admin` (all tenants,
> plan overrides, "jump in" impersonation). Log in as the seeded super-admin to see it.


- **Marketing landing page** with live demo widget + pricing.
- **Auth** — signup / login / logout (cookie sessions, bcrypt).
- **Onboarding** → auto-creates a tenant + assistant + domain allowlist.
- **Customer dashboard** — overview, assistant editor (appearance / knowledge / behaviour),
  install snippet + per-platform instructions, domain allowlist, conversations inbox, billing view.
- **Embed widget** (`/embed.js` + `/widget.js`) — self-contained, themeable, works on any site.
- **Chat gateway** (`/api/v1/widget/message`) — resolves tenant, enforces domain allowlist,
  rate limits, checks the monthly plan quota, builds the system prompt
  (persona + knowledge base + guardrails), calls Anthropic with the **central** key,
  meters token usage, and stores the conversation.
- **Usage metering** per tenant per month, with plan limits.

## Billing (Stage 2 — PayPal)

Subscriptions run on **PayPal**. To enable:

1. Add `PAYPAL_ENV`, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` to `.env`.
2. `npm run paypal:setup` → creates the Product + a Plan per tier; paste the printed
   `PAYPAL_PLAN_*` lines into `.env`.
3. In the PayPal dashboard, add a webhook → `https://YOUR-APP/api/webhooks/paypal`
   (events: `BILLING.SUBSCRIPTION.*`, `PAYMENT.SALE.COMPLETED`) and set `PAYPAL_WEBHOOK_ID`.

Customers upgrade/cancel from **Dashboard → Billing**. The webhook keeps `tenant.plan` /
`status` in sync; `suspended` pauses the widget, over-quota soft-blocks.

## Install snippet (what a customer pastes)

```html
<script src="https://YOUR-APP-DOMAIN/embed.js" data-key="moo_xxxxxxxx" async></script>
```

---

## Architecture

```
Customer's website
   └── <script> embed.js ──► widget.js  (vanilla, themed per tenant)
                                  │  fetch config + post messages (CORS)
                                  ▼
        Next.js app (Vercel)  ── /api/v1/widget/*  ── the gateway
                                  │
                                  ├── Prisma ─► Postgres/SQLite  (tenants, convos, usage)
                                  └── Anthropic SDK ─► ONE central API key (metered)
```

- **One Next.js app** serves the marketing site, the dashboard, the API, and the widget.
- **Tenancy:** every row is scoped by `tenantId`. The widget authenticates with a public
  `publicKey`; abuse is contained by the per-tenant **domain allowlist** + rate limits + quotas.
- **Secrets never reach the browser.** The Anthropic key lives only on the server.

### Key files

| Area | Path |
|------|------|
| Data model | `prisma/schema.prisma` |
| Chat gateway | `src/app/api/v1/widget/message/route.ts` |
| Widget public config | `src/app/api/v1/widget/config/route.ts` |
| System prompt builder | `src/lib/prompt.ts` |
| Plans & limits | `src/lib/plans.ts` |
| Usage metering | `src/lib/usage.ts` |
| Tenant resolution / allowlist / rate limit | `src/lib/tenant.ts` |
| Embed loader + widget | `public/embed.js`, `public/widget.js` |
| Assistant editor | `src/app/dashboard/assistant/` |
| Rebrand in one place | `src/lib/brand.ts` |

---

## Going to production (Postgres + Vercel)

1. Create a free Postgres DB at **neon.tech** (or Supabase) and copy the connection string.
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
3. Set env vars on Vercel: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `AUTH_SECRET`,
   `NEXT_PUBLIC_APP_URL` (your deployed URL).
4. `npx prisma migrate deploy` (or `prisma db push`) against the Postgres URL, then seed.
5. Deploy to Vercel (`vercel` or connect the Git repo). `npm run build` runs `prisma generate`.

See `ROADMAP.md` for what's next (billing, lead forms, live chat, auto-setup, WP/Shopify, admin).
