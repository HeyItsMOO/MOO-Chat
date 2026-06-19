# ChatMOO — build roadmap

Turning the InsureGroup chatbot into a sellable, multi-tenant SaaS, in stages.

## ✅ Stage 1 — Core platform (DONE)

The foundation everything else hangs off:
- [x] Next.js + TypeScript + Tailwind app (marketing + dashboard + API + widget in one deploy)
- [x] Multi-tenant Postgres/SQLite schema (Prisma): users, tenants, assistants, domains,
      conversations, messages, leads, usage counters
- [x] Auth (signup / login / logout, cookie sessions, bcrypt)
- [x] Onboarding → provisions tenant + assistant + domain allowlist + public key
- [x] **Central AI gateway**: per-tenant config, domain allowlist, rate limit, monthly quota,
      prompt (persona + KB + guardrails), Anthropic call on the central key, usage metering, storage
- [x] **Embed widget** — one script tag, themeable, self-contained, works anywhere
- [x] Dashboard: overview, assistant editor, install page, conversations inbox, billing view
- [x] Marketing landing page with live demo + pricing
- [x] InsureGroup reproduced as a seeded demo tenant

## ✅ Stage 2 — Billing & licensing (PayPal) — DONE

Turns plans into real money and gates features by subscription. **PayPal Subscriptions** (not Stripe).
- [x] `scripts/paypal-setup.ts` creates the Product + a Plan per paid tier (`npm run paypal:setup`)
- [x] Subscribe flow: dashboard → `/api/billing/subscribe` → PayPal approval → `/api/billing/return` activates
- [x] Webhook `/api/webhooks/paypal` (signature-verified) is the source of truth for
      ACTIVATED / CANCELLED / SUSPENDED / PAYMENT.FAILED / renewal events
- [x] Cancel/downgrade → `/api/billing/cancel` (drops to Free, keeps assistant running)
- [x] Gating: `suspended` turns the widget off; over-quota soft-blocks with a fallback message;
      model tiers + remove-branding + domain count enforced by plan
- [x] Billing dashboard with upgrade/cancel buttons + status banners

**To go live with billing:** add `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` (+ `PAYPAL_ENV`) to `.env`,
run `npm run paypal:setup`, paste the printed plan IDs, then create a webhook in the PayPal
dashboard → `/api/webhooks/paypal` and set `PAYPAL_WEBHOOK_ID`.

## ✅ Stage 3 — Lead capture (generalized quote forms) — DONE

Your InsureGroup quote form, made configurable for any business.
- [x] Form builder: drag-free field editor per tenant (label / type / required / dropdown options)
- [x] Lead submission endpoint `/api/v1/widget/lead` + storage, with honeypot + rate limiting
- [x] Widget renders the form (button → form view → success), per-field validation
- [x] Email notifications via Resend (`src/lib/email.ts`) — logs to console in dev if no key
- [x] Leads inbox + CSV export in the dashboard
- [x] InsureGroup quote form reproduced on the demo tenant

**To enable real emails:** add `RESEND_API_KEY` + `EMAIL_FROM` to `.env` (get a key at resend.com).
Without it, notifications print to the server console so dev still works.

## ✅ Stage 4 — Live chat / human takeover — DONE

Ported the plugin's polling-based live console into the dashboard (Pro+ feature).
- [x] `/api/v1/widget/request-human` + `/api/v1/widget/poll` (visitor side)
- [x] Agent console `/dashboard/live`: list active chats (waiting badge), take over, reply,
      hand back, close — polls every 3–5s
- [x] Agent endpoints: `/api/tenant/live` (list), `/live/thread`, `/live/reply`, `/live/status`
- [x] Widget: "talk to a person" button, status banner, polling for agent/system messages,
      resume after refresh
- [x] Email alert to the team on a human request (with a deep link to the conversation)
- [x] Gated to Pro/Business plans (Free/Starter see an upgrade prompt)

## ✅ Stage 5 — Auto-setup & distribution — DONE

The "auto setup for different websites" magic + more install channels.
- [x] URL → auto-fill: `src/lib/scrape.ts` fetches the site + key pages, extracts company
      name, theme color and a draft knowledge base. `/api/tenant/autofill` + an "✨ Auto-fill
      from your website" button in the assistant editor. (Tested live against insuregroup.com.au.)
- [x] Thin **WordPress plugin** (`integrations/wordpress/moo-chat/`) — injects the embed with
      your public key; one settings page. Zip the folder to distribute.
- [x] **Shopify** (`integrations/shopify/`) — a theme app extension app-embed block + docs for
      both the immediate manual install and packaging into a real Shopify app later.

Note: a full Shopify *App Store* app (OAuth + hosting + Shopify billing) is a separate project;
the embed block (its core) is done and the manual install works today.

## ✅ Stage 6 — Super-admin console — DONE

Your control room + the hybrid onboarding you asked for.
- [x] Super-admin console `/admin` (gated to `isSuperAdmin`): all tenants, owner, plan, status,
      usage, conversation + lead counts; platform stats (tenants, paying, MRR, messages)
- [x] Override a tenant's plan + suspend/activate (`/api/admin/tenant`)
- [x] **Impersonate** / "jump in to help" — act as a tenant with a banner + exit
      (`/api/admin/impersonate`), the hybrid-onboarding half you wanted
- [ ] (Future) Analytics dashboards (deflection rate, top questions)
- [ ] (Future) Production hardening: move the in-memory rate limiter to Vercel KV / Upstash

## ✅ Security & correctness hardening — DONE

A multi-agent review (7 dimensions, adversarially verified) found **25 confirmed issues**;
all fixed, then a second workflow **verified 45 fixes with 0 incomplete**. Highlights:
- 🔴 PayPal webhook fail-open (forge-a-free-upgrade) → fails closed + re-fetches authoritative subscription
- 🔴 Widget stored XSS (linkifier escape bypass) → safe tokenized linkifier
- 🔴 Auto-fill SSRF (cloud-metadata/internal reachable) → DNS+IP allowlisting, manual redirect re-validation, IPv6 `::` block
- 🟠 Origin allowlist fails closed in prod · atomic quota reserve/refund · live-chat transcript survives refresh ·
  keyset message cursor · login timing/rate-limit · rate-limiter memory bound · webhook plan-state correctness
- Remaining residual (low, documented): in-memory rate limiter on serverless (→ Vercel KV), DNS-rebinding TOCTOU
  (→ egress policy). See `DEPLOY.md` §8.

All criticals runtime-verified (webhook→401, no-Origin→403, SSRF blocked, XSS neutralized, live-chat regression-tested).

## 🚀 Deploy (when ready)

Not a build stage — the runbook to go live:
1. Create a free Postgres DB at neon.tech, copy the connection string.
2. `prisma/schema.prisma`: `provider = "postgresql"`; set `DATABASE_URL`.
3. Set Vercel env: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`,
   PayPal vars, `RESEND_API_KEY`.
4. `npx prisma migrate deploy` (or `db push`) then seed.
5. Deploy to Vercel; point your domain (e.g. app.heyitsmoo.com) at it.
6. Swap the in-memory rate limiter (`src/lib/tenant.ts`) for Vercel KV/Upstash for multi-region.

---

### Notes / decisions locked in
- **Model:** central Anthropic key, metered per tenant → enables monthly subscriptions.
- **Stack:** Next.js on Vercel + Neon Postgres + Stripe + Resend + Anthropic.
- **Targets:** universal script tag first (covers any site), then WordPress + Shopify.
- **Onboarding:** hybrid — self-serve signup, with super-admin assist (Stage 6).
- **Product name:** "ChatMOO" (a HeyItsMOO product) — change in `src/lib/brand.ts`.
