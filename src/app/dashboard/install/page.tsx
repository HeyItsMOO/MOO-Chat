import { getCurrentContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { APP_URL } from '@/lib/brand';
import { CopyButton } from '../_components';
import DomainsManager from './DomainsManager';

export default async function InstallPage() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return null;
  const tenant = ctx.tenant;
  const domains = await prisma.allowedDomain.findMany({ where: { tenantId: tenant.id }, orderBy: { domain: 'asc' } });
  const snippet = `<script src="${APP_URL}/embed.js" data-key="${tenant.publicKey}" async></script>`;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Install on your site</h1>
        <p className="text-ink-soft">One snippet works everywhere. Pick your platform below.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Universal snippet</h2>
          <CopyButton text={snippet} label="Copy" />
        </div>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">{snippet}</pre>
        <p className="mt-2 text-xs text-ink-mute">Add it just before the closing <code>&lt;/body&gt;</code> tag.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Platform title="WordPress" steps={['Appearance → Theme File Editor, or use a “header & footer scripts” plugin', 'Paste the snippet into the footer', 'Save']} />
        <Platform title="Shopify" steps={['Online Store → Themes → Edit code', 'Open theme.liquid', 'Paste before </body> and save']} />
        <Platform title="Wix / Squarespace / other" steps={['Find “custom code” / “embed” settings', 'Add the snippet to the site footer', 'Publish']} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Allowed domains</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The widget only runs on these domains (and their subdomains). This stops anyone copying your snippet
          onto another site and using your AI budget.
        </p>
        <DomainsManager initial={domains.map((d) => ({ id: d.id, domain: d.domain }))} />
      </div>
    </div>
  );
}

function Platform({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold">{title}</h3>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-ink-soft">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
