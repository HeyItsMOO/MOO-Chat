import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentContext } from '@/lib/auth';
import { getPlan } from '@/lib/plans';

export const runtime = 'nodejs';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const leadFieldSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select']),
  required: z.boolean(),
  options: z.array(z.string().max(120)).max(30).optional(),
  placeholder: z.string().max(120).optional(),
});

const schema = z.object({
  enabled: z.boolean().optional(),
  companyName: z.string().max(120).optional(),
  headerTitle: z.string().max(120).optional(),
  headerSubtitle: z.string().max(160).optional(),
  welcomeMessage: z.string().max(1000).optional(),
  suggestedQuestions: z.string().max(2000).optional(),
  primaryColor: hex.optional(),
  accentColor: hex.optional(),
  position: z.enum(['left', 'right']).optional(),
  launcherLabel: z.string().max(60).optional(),
  disclaimer: z.string().max(500).optional(),
  showPoweredBy: z.boolean().optional(),
  phone: z.string().max(60).optional(),
  contactEmail: z.string().max(160).optional(),
  model: z.string().max(80).optional(),
  maxTokens: z.number().int().min(100).max(4096).optional(),
  persona: z.string().max(8000).optional(),
  knowledgeBase: z.string().max(60000).optional(),
  guardrails: z.string().max(8000).optional(),
  rateLimitPerHour: z.number().int().min(0).max(1000).optional(),
  leadFormEnabled: z.boolean().optional(),
  leadFormTitle: z.string().max(120).optional(),
  leadFormIntro: z.string().max(500).optional(),
  leadFormButtonLabel: z.string().max(60).optional(),
  leadFormSuccess: z.string().max(500).optional(),
  leadNotifyEmail: z.string().max(160).optional(),
  leadFormFields: z.array(leadFieldSchema).max(30).optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let data;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : 'Invalid input';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Enforce that the chosen model is allowed on this plan.
  if (data.model) {
    const plan = getPlan(ctx.tenant.plan);
    if (!plan.models.includes(data.model)) {
      return NextResponse.json(
        { error: `The ${data.model} model isn't available on the ${plan.name} plan.` },
        { status: 403 },
      );
    }
  }

  // Free plan can't remove branding.
  if (data.showPoweredBy === false && !getPlan(ctx.tenant.plan).features.removeBranding) {
    data.showPoweredBy = true;
  }

  // The DB stores fields as a JSON string; serialize the array if provided.
  const { leadFormFields, ...rest } = data;
  await prisma.assistant.update({
    where: { tenantId: ctx.tenant.id },
    data: {
      ...rest,
      ...(leadFormFields !== undefined ? { leadFormFields: JSON.stringify(leadFormFields) } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
