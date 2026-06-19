/**
 * Seed: a platform super-admin, a demo login, and the InsureGroup assistant
 * reproduced as a demo tenant (fixed public key for the landing-page live demo).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_KEY = 'moo_demo_insuregroup';

const INSUREGROUP_PERSONA =
  "You are the InsureGroup virtual assistant, embedded on the InsureGroup website. You help visitors with questions about InsureGroup's insurance broking services. InsureGroup specialises in insurance for transport, earthmoving, civil construction and machinery businesses across Australia — operators who rely on trucks and heavy equipment.\n\n" +
  "STYLE: Warm, professional, and plain-English (jargon-free), matching InsureGroup's brand. Use Australian English and AUD. Keep answers short — usually 2 to 4 sentences. Use a short bullet list only when it genuinely helps. When a topic maps to a specific page in the knowledge base, include that page's URL so the visitor can read more.";

const INSUREGROUP_GUARDRAILS =
  "1. You provide GENERAL INFORMATION ONLY. You are NOT able to give personal financial product advice, and you must NOT state that a specific policy is suitable for someone's particular circumstances. For anything specific, recommend they speak with a licensed InsureGroup broker.\n" +
  "2. You CANNOT provide a binding quote, premium, or price. If asked how much something costs, explain that a broker prepares a tailored quote, and invite them to use the quote request form or to call 1300 983 940.\n" +
  "3. NEVER invent premiums, prices, coverage limits, policy wordings, inclusions, exclusions, or terms. If unsure, say so and point to the relevant page.\n" +
  "4. Do NOT ask for or record sensitive personal details in the chat (date of birth, driver licence numbers, payment or card details).\n" +
  "5. For claims, complaints, or anything about an existing policy, give the contact details (1300 983 940 / the contact page).\n" +
  "6. Stay on topic. If asked something unrelated to InsureGroup or insurance, briefly and politely steer back.";

const INSUREGROUP_KB = `# About InsureGroup
InsureGroup (legal entity: Insure Group Pty Ltd) is a specialist Australian insurance broking business established in 2014. We arrange insurance for businesses in the transport, construction, earthmoving and machinery industries — particularly operators who rely on trucks and heavy equipment.

# How to contact us
- Phone: 1300 983 940
- Email: hello@insuregroup.com.au
- Office: 18/333 Ann Street, Brisbane City QLD 4000
- Online quote form: https://insuregroup.com.au/online-quote/

# Getting a quote
Premiums are not quoted in this chat. The fastest ways to get a tailored quote are:
1. Complete the Online Quote form: https://insuregroup.com.au/online-quote/
2. Call 1300 983 940
3. Email hello@insuregroup.com.au

# Products & services (with page links)
- Truck Insurance — https://insuregroup.com.au/truck-insurance-australia/
- Fleet Insurance — https://insuregroup.com.au/fleet-insurance/
- Earthmoving Insurance — https://insuregroup.com.au/earthmoving-insurance/
- Public Liability Insurance — https://insuregroup.com.au/public-liability-insurance/
- Business Insurance — https://insuregroup.com.au/commercial-business-insurance/

# Frequently asked
- "How much will it cost?" Premiums depend on the business, equipment, claims history and cover required, so a broker prepares a tailored quote — use the Online Quote form or call 1300 983 940.
- "Are you Australia-wide?" Yes, we arrange cover for businesses across Australia. The office is in Brisbane.`;

// ── ChatMOO's own product assistant (always-on on the marketing site) ──
const SITE_KEY = 'chatmoo_site';

const CHATMOO_PERSONA =
  "You are the ChatMOO assistant, embedded on ChatMOO's own website. ChatMOO is an AI chat assistant that any business adds to its website to answer customer questions, capture leads, and hand off to a human. You help visitors understand what ChatMOO does, its pricing, how to install it, and how to get started.\n\n" +
  "STYLE: Friendly, upbeat, plain-English and lightly playful ('no bull') but professional. Use Australian English and AUD. Keep answers short — usually 2 to 4 sentences. When relevant, point visitors to a page: /pricing, /features, /docs, /integrations, /contact, or /signup.";

const CHATMOO_GUARDRAILS =
  "1. Only answer questions about ChatMOO and how to use it. If asked something unrelated, politely steer back.\n" +
  "2. Pricing is in AUD: Free (A$0, 50 replies/mo), Starter (A$49, 2,000), Growth (A$129, 8,000 — most popular), Business (A$349, 30,000). New accounts get a 5-day free trial of Growth, no credit card. Don't invent other prices.\n" +
  "3. Don't promise features that aren't in the knowledge base. If unsure, point them to /docs or /contact.\n" +
  "4. Encourage signing up at /signup, and offer the enquiry form for anyone who wants a human to follow up.\n" +
  "5. Never ask for passwords or payment/card details in chat.";

const CHATMOO_KB = `# What is ChatMOO?
ChatMOO is an AI chat assistant for any website — a HeyItsMOO product. It answers customer questions from your own content, captures leads, and hands off to your team when needed. Install it with one line of code on WordPress, Shopify, or any site. Live in about 5 minutes.

# Pricing (AUD, per month)
- Free — A$0 — 50 AI replies/month, lead capture. No credit card.
- Starter — A$49 — 2,000 replies/month, 1 extra domain.
- Growth — A$129 — 8,000 replies/month, live chat handoff, remove branding, 3 extra domains. Most popular.
- Business — A$349 — 30,000 replies/month, all features, 25 extra domains.
New accounts get a 5-day free trial of Growth (no credit card); the trial always ends on a Monday. Full details: /pricing

# How to install
1. Sign up at /signup and build your assistant (add your knowledge, or paste your URL to auto-fill it).
2. Copy your one-line snippet from the dashboard Install page.
3. Paste it before </body> on your site. There are also WordPress and Shopify installs — see /docs and /integrations.

# Key features
- Answers from your own knowledge base (it doesn't make things up).
- Lead capture form with email notifications, an inbox, and CSV export.
- Live human handoff (Growth and Business plans).
- On-brand theming — colours, position, welcome message, suggested questions.
- Guardrails, domain allowlist, rate limits, and monthly usage metering.

# Contact & help
- Docs: /docs · Pricing: /pricing · Features: /features · Integrations: /integrations
- Questions or a demo: /contact, or email hello@heyitsmoo.com`;

function appHost(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').host.replace(/^www\./, '');
  } catch {
    return 'localhost';
  }
}

async function main() {
  const pw = await bcrypt.hash('demo12345', 10);
  const adminPw = await bcrypt.hash('admin12345', 10);

  // Platform super-admin (you).
  const admin = await prisma.user.upsert({
    where: { email: 'admin@moochat.app' },
    update: {},
    create: { email: 'admin@moochat.app', name: 'Platform Admin', passwordHash: adminPw, isSuperAdmin: true },
  });

  // Demo customer.
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@moochat.app' },
    update: {},
    create: { email: 'demo@moochat.app', name: 'Demo Owner', passwordHash: pw },
  });

  // Demo tenant: InsureGroup, on the Pro plan so all features are visible.
  const existing = await prisma.tenant.findUnique({ where: { publicKey: DEMO_KEY } });
  if (!existing) {
    const tenant = await prisma.tenant.create({
      data: {
        name: 'InsureGroup (Demo)',
        slug: 'insuregroup-demo',
        websiteUrl: 'https://insuregroup.com.au',
        publicKey: DEMO_KEY,
        plan: 'pro',
        status: 'active',
        assistant: {
          create: {
            enabled: true,
            companyName: 'InsureGroup',
            headerTitle: 'InsureGroup Assistant',
            headerSubtitle: 'Specialist insurance brokers',
            welcomeMessage:
              "G'day! I'm the InsureGroup assistant. Ask me about truck, fleet, earthmoving, machinery or business insurance — or request a quote whenever you're ready.",
            suggestedQuestions:
              'What insurance do you offer for trucks?\nDo you cover earthmoving equipment?\nHow do I get a quote?\nHow do I make a claim?',
            primaryColor: '#0e3a5f',
            accentColor: '#f0a818',
            position: 'right',
            launcherLabel: 'Chat with us',
            disclaimer: 'General information only — not financial advice. For a tailored quote, speak with our team.',
            showPoweredBy: true,
            phone: '1300 983 940',
            contactEmail: 'hello@insuregroup.com.au',
            model: 'claude-haiku-4-5-20251001',
            maxTokens: 800,
            persona: INSUREGROUP_PERSONA,
            knowledgeBase: INSUREGROUP_KB,
            guardrails: INSUREGROUP_GUARDRAILS,
            rateLimitPerHour: 30,
          },
        },
        memberships: { create: { userId: demoUser.id, role: 'owner' } },
      },
    });

    // Allow the demo to run on insuregroup.com.au AND on this app's own domain
    // (so the live demo on the landing page works in production too).
    const domains = Array.from(new Set(['insuregroup.com.au', appHost(), 'localhost']));
    for (const domain of domains) {
      await prisma.allowedDomain.create({ data: { tenantId: tenant.id, domain } });
    }
    console.log('Seeded demo tenant:', tenant.name, '(key', DEMO_KEY + ')');
  } else {
    console.log('Demo tenant already present — skipping.');
  }

  // Ensure the demo has the InsureGroup quote form configured (idempotent).
  const demoTenant = await prisma.tenant.findUnique({ where: { publicKey: DEMO_KEY }, include: { assistant: true } });
  if (demoTenant?.assistant) {
    await prisma.assistant.update({
      where: { id: demoTenant.assistant.id },
      data: {
        leadFormEnabled: true,
        leadFormTitle: 'Request a quote',
        leadFormIntro: 'Answer a few questions and our team will prepare a tailored quote. It takes about a minute.',
        leadFormButtonLabel: 'Request a Quote',
        leadFormSuccess: "Thanks — your request has been sent to our team and we'll be in touch shortly.",
        leadNotifyEmail: 'hello@insuregroup.com.au',
        leadFormFields: JSON.stringify([
          { key: 'first', label: 'First name', type: 'text', required: true },
          { key: 'last', label: 'Last name', type: 'text', required: true },
          { key: 'phone', label: 'Phone', type: 'tel', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'occupation', label: 'Business / occupation', type: 'text', required: true },
          { key: 'items', label: 'What do you need insured?', type: 'textarea', required: true },
          { key: 'urgency', label: 'How soon do you need cover?', type: 'select', required: true, options: ['ASAP', 'This week', 'This month', 'Just researching'] },
        ]),
      },
    });
  }

  // ── ChatMOO's own always-on assistant (answers about ChatMOO on the site) ──
  const siteExists = await prisma.tenant.findUnique({ where: { publicKey: SITE_KEY }, include: { assistant: true } });
  if (!siteExists) {
    const site = await prisma.tenant.create({
      data: {
        name: 'ChatMOO',
        slug: 'chatmoo-site',
        websiteUrl: process.env.NEXT_PUBLIC_APP_URL || '',
        publicKey: SITE_KEY,
        plan: 'business',
        status: 'active',
        assistant: {
          create: {
            enabled: true,
            companyName: 'ChatMOO',
            headerTitle: 'ChatMOO Assistant',
            headerSubtitle: 'Ask me anything about ChatMOO',
            welcomeMessage: "G'day! 🐄 I'm the ChatMOO assistant. Ask me about pricing, install, or features — or I can grab your details for a human.",
            suggestedQuestions: 'What is ChatMOO?\nHow much does it cost?\nHow do I install it?\nDoes it work on Shopify?',
            primaryColor: '#16a34a',
            accentColor: '#facc15',
            position: 'right',
            launcherLabel: 'Chat with us 🐄',
            showPoweredBy: false,
            contactEmail: 'hello@heyitsmoo.com',
            model: 'claude-haiku-4-5-20251001',
            maxTokens: 800,
            persona: CHATMOO_PERSONA,
            knowledgeBase: CHATMOO_KB,
            guardrails: CHATMOO_GUARDRAILS,
            rateLimitPerHour: 60,
            leadFormEnabled: true,
            leadFormTitle: 'Talk to a human',
            leadFormIntro: 'Leave your details and the ChatMOO team will get back to you.',
            leadFormButtonLabel: 'Send',
            leadNotifyEmail: 'hello@heyitsmoo.com',
            leadFormFields: JSON.stringify([
              { key: 'name', label: 'Name', type: 'text', required: true },
              { key: 'email', label: 'Email', type: 'email', required: true },
              { key: 'message', label: 'How can we help?', type: 'textarea', required: true },
            ]),
          },
        },
        memberships: { create: { userId: admin.id, role: 'owner' } },
      },
    });
    for (const domain of Array.from(new Set([appHost(), 'localhost']))) {
      await prisma.allowedDomain.create({ data: { tenantId: site.id, domain } });
    }
    console.log('Seeded ChatMOO site assistant (key', SITE_KEY + ')');
  } else if (siteExists.assistant) {
    // Keep the product knowledge fresh on re-seed.
    await prisma.assistant.update({
      where: { id: siteExists.assistant.id },
      data: { persona: CHATMOO_PERSONA, knowledgeBase: CHATMOO_KB, guardrails: CHATMOO_GUARDRAILS },
    });
    console.log('ChatMOO site assistant already present — refreshed knowledge.');
  }

  console.log('\nLogins:');
  console.log('  Customer demo : demo@moochat.app / demo12345');
  console.log('  Super admin   : admin@moochat.app / admin12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
