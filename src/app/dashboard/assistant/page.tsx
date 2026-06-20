import { getCurrentContext } from '@/lib/auth';
import { effectivePlan } from '@/lib/plans';
import AssistantForm from './AssistantForm';

export default async function AssistantPage() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant?.assistant) return null;
  const plan = effectivePlan(ctx.tenant);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your assistant</h1>
        <p className="text-ink-soft">Everything the bot knows and how it looks. Changes go live the moment you save.</p>
      </div>
      <AssistantForm
        assistant={ctx.tenant.assistant}
        allowedModels={plan.models}
        canRemoveBranding={plan.features.removeBranding}
        canCustomScripts={plan.features.customScripts}
        planName={plan.name}
        websiteUrl={ctx.tenant.websiteUrl}
      />
    </div>
  );
}
