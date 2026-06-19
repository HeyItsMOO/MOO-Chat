import { NextRequest } from 'next/server';
import { loadTenantByPublicKey } from '@/lib/tenant';
import { jsonWithCors, preflight } from '@/lib/cors';
import { getPlan } from '@/lib/plans';
import { BRAND } from '@/lib/brand';
import { parseFields } from '@/lib/leadform';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return preflight(req.headers.get('origin'));
}

/**
 * Public, read-only config the widget needs to render. Contains NO secrets —
 * never the Anthropic key, never internal IDs beyond the public key.
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  const key = req.nextUrl.searchParams.get('key') || '';
  const tenant = await loadTenantByPublicKey(key);

  if (!tenant || !tenant.assistant) {
    return jsonWithCors({ ok: false, error: 'unknown_tenant' }, origin, 404);
  }

  const a = tenant.assistant;
  const enabled = a.enabled && tenant.status !== 'suspended';
  const plan = getPlan(tenant.plan);
  const showPoweredBy = a.showPoweredBy || !plan.features.removeBranding;

  const suggested = a.suggestedQuestions
    .split(/\r\n|\r|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return jsonWithCors(
    {
      ok: true,
      enabled,
      config: {
        companyName: a.companyName,
        headerTitle: a.headerTitle,
        headerSubtitle: a.headerSubtitle,
        welcome: a.welcomeMessage,
        suggested,
        primaryColor: a.primaryColor,
        accentColor: a.accentColor,
        position: a.position,
        launcherLabel: a.launcherLabel,
        disclaimer: a.disclaimer,
        phone: a.phone,
        showPoweredBy,
        poweredByText: showPoweredBy ? BRAND.poweredByText : '',
        poweredByUrl: BRAND.poweredByUrl,
        liveChat: plan.features.liveChat,
        leadForm:
          plan.features.leadCapture && a.leadFormEnabled
            ? {
                // success message is delivered by the /lead response, not read here
                enabled: true,
                title: a.leadFormTitle,
                intro: a.leadFormIntro,
                buttonLabel: a.leadFormButtonLabel,
                fields: parseFields(a.leadFormFields),
              }
            : { enabled: false },
      },
    },
    origin,
  );
}
