import { prisma } from './db';
import { generatePublicKey, normalizeHost } from './tenant';
import { DEFAULT_LEAD_FIELDS } from './leadform';
import { computeTrialEnd } from './plans';

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'store'
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
  return slug;
}

/** Sensible generic defaults for a brand-new assistant. */
export function defaultAssistant(companyName: string) {
  return {
    enabled: true,
    companyName,
    headerTitle: `${companyName} Assistant`,
    headerSubtitle: 'Ask us anything',
    welcomeMessage: `Hi! I'm the ${companyName} assistant. How can I help you today?`,
    suggestedQuestions: 'What do you offer?\nWhat are your hours?\nHow do I get in touch?',
    primaryColor: '#4f46e5',
    accentColor: '#22c55e',
    position: 'right',
    launcherLabel: 'Chat with us',
    disclaimer: '',
    showPoweredBy: true,
    phone: '',
    contactEmail: '',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 800,
    persona: '',
    knowledgeBase: '',
    guardrails: '',
    rateLimitPerHour: 30,
    leadFormEnabled: true,
    leadFormTitle: 'Get in touch',
    leadFormIntro: "Leave your details and we'll get back to you.",
    leadFormButtonLabel: 'Get in touch',
    leadFormSuccess: "Thanks — your details have been sent to our team. We'll be in touch shortly.",
    leadFormFields: JSON.stringify(DEFAULT_LEAD_FIELDS),
    leadNotifyEmail: '',
  };
}

interface ProvisionInput {
  userId: string;
  businessName: string;
  websiteUrl?: string;
  publicKey?: string; // override (used by the demo seed)
}

/** Create a tenant + assistant + membership for a user. */
export async function provisionTenant(input: ProvisionInput) {
  const slug = await uniqueSlug(input.businessName);
  const host = normalizeHost(input.websiteUrl || '');

  const tenant = await prisma.tenant.create({
    data: {
      name: input.businessName,
      slug,
      websiteUrl: input.websiteUrl || '',
      publicKey: input.publicKey || generatePublicKey(),
      plan: 'free',
      status: 'trialing',
      // No-card trial of the top plan; always ends on a Monday (>= 5 days).
      trialEndsAt: computeTrialEnd(),
      assistant: { create: defaultAssistant(input.businessName) },
      memberships: { create: { userId: input.userId, role: 'owner' } },
      allowedDomains: host ? { create: { domain: host } } : undefined,
    },
    include: { assistant: true },
  });

  return tenant;
}
