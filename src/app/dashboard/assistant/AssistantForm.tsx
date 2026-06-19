'use client';

import { useState } from 'react';
import type { Assistant } from '@prisma/client';
import { parseFields, FIELD_TYPES, slugifyKey, type LeadField } from '@/lib/leadform';

const MODEL_LABELS: Record<string, string> = {
  'claude-haiku-4-5-20251001': 'Fast & economical (recommended)',
  'claude-sonnet-4-6': 'Balanced — stronger reasoning',
  'claude-opus-4-8': 'Advanced — most capable',
};

type Tab = 'appearance' | 'knowledge' | 'behaviour' | 'leadform';

export default function AssistantForm({
  assistant,
  allowedModels,
  canRemoveBranding,
  planName,
  websiteUrl,
}: {
  assistant: Assistant;
  allowedModels: string[];
  canRemoveBranding: boolean;
  planName: string;
  websiteUrl: string;
}) {
  const [tab, setTab] = useState<Tab>('appearance');
  const [form, setForm] = useState({
    enabled: assistant.enabled,
    companyName: assistant.companyName,
    headerTitle: assistant.headerTitle,
    headerSubtitle: assistant.headerSubtitle,
    welcomeMessage: assistant.welcomeMessage,
    suggestedQuestions: assistant.suggestedQuestions,
    primaryColor: assistant.primaryColor,
    accentColor: assistant.accentColor,
    position: assistant.position as 'left' | 'right',
    launcherLabel: assistant.launcherLabel,
    disclaimer: assistant.disclaimer,
    showPoweredBy: assistant.showPoweredBy,
    phone: assistant.phone,
    contactEmail: assistant.contactEmail,
    model: assistant.model,
    maxTokens: assistant.maxTokens,
    persona: assistant.persona,
    knowledgeBase: assistant.knowledgeBase,
    guardrails: assistant.guardrails,
    rateLimitPerHour: assistant.rateLimitPerHour,
    leadFormEnabled: assistant.leadFormEnabled,
    leadFormTitle: assistant.leadFormTitle,
    leadFormIntro: assistant.leadFormIntro,
    leadFormButtonLabel: assistant.leadFormButtonLabel,
    leadFormSuccess: assistant.leadFormSuccess,
    leadNotifyEmail: assistant.leadNotifyEmail,
  });
  const [leadFields, setLeadFields] = useState<LeadField[]>(parseFields(assistant.leadFormFields));
  const [autofillUrl, setAutofillUrl] = useState(websiteUrl || '');
  const [autofilling, setAutofilling] = useState(false);
  const [autofillMsg, setAutofillMsg] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setStatus('idle');
  }

  // ── lead field builder helpers ──
  function addField() {
    const keys = leadFields.map((f) => f.key);
    setLeadFields((fs) => [...fs, { key: slugifyKey('field', keys), label: 'New field', type: 'text', required: false }]);
    setStatus('idle');
  }
  function updateField(i: number, patch: Partial<LeadField>) {
    setLeadFields((fs) => fs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
    setStatus('idle');
  }
  function removeField(i: number) {
    setLeadFields((fs) => fs.filter((_, idx) => idx !== i));
    setStatus('idle');
  }
  function moveField(i: number, dir: -1 | 1) {
    setLeadFields((fs) => {
      const j = i + dir;
      if (j < 0 || j >= fs.length) return fs;
      const copy = [...fs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
    setStatus('idle');
  }

  async function autofill() {
    if (!autofillUrl.trim()) return;
    setAutofilling(true);
    setAutofillMsg('');
    try {
      const res = await fetch('/api/tenant/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: autofillUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAutofillMsg(data.error || 'Could not read that site.');
        return;
      }
      setForm((f) => ({
        ...f,
        knowledgeBase: data.knowledgeBase || f.knowledgeBase,
        companyName: data.companyName || f.companyName,
        ...(data.themeColor ? { primaryColor: data.themeColor } : {}),
      }));
      setAutofillMsg(`Filled from ${data.pagesFetched.length} page(s). Review the text below, then Save.`);
      setStatus('idle');
    } catch {
      setAutofillMsg('Network error.');
    } finally {
      setAutofilling(false);
    }
  }

  async function save() {
    setStatus('saving');
    setError('');
    try {
      const res = await fetch('/api/tenant/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, leadFormFields: leadFields }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save.');
        setStatus('error');
        return;
      }
      setStatus('saved');
    } catch {
      setError('Network error.');
      setStatus('error');
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 p-2">
        {(['appearance', 'knowledge', 'behaviour', 'leadform'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-slate-50'
            }`}
          >
            {t === 'leadform' ? 'Lead form' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-5 p-6">
        {tab === 'appearance' && (
          <>
            <Toggle label="Assistant enabled" checked={form.enabled} onChange={(v) => set('enabled', v)} hint="Turn the widget on or off across your site." />
            <Text label="Business name" value={form.companyName} onChange={(v) => set('companyName', v)} />
            <Text label="Header title" value={form.headerTitle} onChange={(v) => set('headerTitle', v)} />
            <Text label="Header subtitle" value={form.headerSubtitle} onChange={(v) => set('headerSubtitle', v)} />
            <Text label="Launcher button label" value={form.launcherLabel} onChange={(v) => set('launcherLabel', v)} />
            <Area label="Welcome message" rows={3} value={form.welcomeMessage} onChange={(v) => set('welcomeMessage', v)} />
            <Area label="Suggested questions (one per line)" rows={4} value={form.suggestedQuestions} onChange={(v) => set('suggestedQuestions', v)} />
            <Area label="Footer disclaimer" rows={2} value={form.disclaimer} onChange={(v) => set('disclaimer', v)} />
            <div className="grid grid-cols-2 gap-4">
              <Color label="Primary colour" value={form.primaryColor} onChange={(v) => set('primaryColor', v)} />
              <Color label="Accent colour" value={form.accentColor} onChange={(v) => set('accentColor', v)} />
            </div>
            <div>
              <Label>Position</Label>
              <div className="mt-1 flex gap-3">
                {(['right', 'left'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => set('position', p)}
                    className={`rounded-lg border px-4 py-2 text-sm capitalize ${
                      form.position === p ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300'
                    }`}
                  >
                    Bottom {p}
                  </button>
                ))}
              </div>
            </div>
            <Toggle
              label="Show “Powered by” credit"
              checked={form.showPoweredBy}
              onChange={(v) => set('showPoweredBy', v)}
              disabled={!canRemoveBranding}
              hint={canRemoveBranding ? undefined : `Upgrade from ${planName} to hide the credit.`}
            />
          </>
        )}

        {tab === 'knowledge' && (
          <>
            <p className="text-sm text-ink-soft">
              This is the assistant&apos;s brain. Add your products, FAQs, hours, policies, and links. The bot answers
              <strong> only</strong> from this plus general knowledge — it won&apos;t invent specifics.
            </p>

            {/* Auto-setup from a website */}
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
              <div className="text-sm font-semibold text-brand-700">✨ Auto-fill from your website</div>
              <p className="mt-1 text-xs text-ink-soft">We&apos;ll read your site and draft a knowledge base for you.</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={autofillUrl}
                  onChange={(e) => setAutofillUrl(e.target.value)}
                  placeholder="https://yourstore.com"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
                />
                <button
                  onClick={autofill}
                  disabled={autofilling || !autofillUrl.trim()}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {autofilling ? 'Reading…' : 'Auto-fill'}
                </button>
              </div>
              {autofillMsg && <p className="mt-2 text-xs text-ink-soft">{autofillMsg}</p>}
            </div>

            <Area
              label="Knowledge base"
              rows={20}
              mono
              value={form.knowledgeBase}
              onChange={(v) => set('knowledgeBase', v)}
              placeholder={'# About us\nWe sell…\n\n# Hours\nMon–Fri 9–5\n\n# Contact\nPhone: …'}
            />
          </>
        )}

        {tab === 'behaviour' && (
          <>
            <Area
              label="Persona / instructions (optional)"
              rows={5}
              value={form.persona}
              onChange={(v) => set('persona', v)}
              placeholder="You are the friendly assistant for… Keep answers short and plain-English."
            />
            <Area
              label="Extra rules / guardrails (optional)"
              rows={4}
              value={form.guardrails}
              onChange={(v) => set('guardrails', v)}
              placeholder="e.g. Never quote prices. Always recommend booking a call for anything specific."
            />
            <div>
              <Label>AI model</Label>
              <select
                value={form.model}
                onChange={(e) => set('model', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                {allowedModels.map((m) => (
                  <option key={m} value={m}>{MODEL_LABELS[m] || m}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-mute">{planName} plan includes {allowedModels.length} model tier(s).</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Num label="Max reply length (tokens)" min={100} max={4096} step={50} value={form.maxTokens} onChange={(v) => set('maxTokens', v)} />
              <Num label="Rate limit (msgs/visitor/hour, 0 = ∞)" min={0} max={1000} step={1} value={form.rateLimitPerHour} onChange={(v) => set('rateLimitPerHour', v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Text label="Phone (for fallbacks)" value={form.phone} onChange={(v) => set('phone', v)} />
              <Text label="Contact email" value={form.contactEmail} onChange={(v) => set('contactEmail', v)} />
            </div>
          </>
        )}

        {tab === 'leadform' && (
          <>
            <p className="text-sm text-ink-soft">
              A built-in form that turns chats into leads (this is your InsureGroup quote form, generalized).
              Submissions are emailed to you and saved in <strong>Leads</strong>.
            </p>
            <Toggle label="Lead form enabled" checked={form.leadFormEnabled} onChange={(v) => set('leadFormEnabled', v)} hint="Shows a button in the chat widget." />
            <div className="grid grid-cols-2 gap-4">
              <Text label="Form title" value={form.leadFormTitle} onChange={(v) => set('leadFormTitle', v)} />
              <Text label="Button label" value={form.leadFormButtonLabel} onChange={(v) => set('leadFormButtonLabel', v)} />
            </div>
            <Area label="Intro text" rows={2} value={form.leadFormIntro} onChange={(v) => set('leadFormIntro', v)} />
            <Area label="Success message" rows={2} value={form.leadFormSuccess} onChange={(v) => set('leadFormSuccess', v)} />
            <Text label="Send notifications to (blank = your account email)" value={form.leadNotifyEmail} onChange={(v) => set('leadNotifyEmail', v)} />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Form fields</Label>
                <button onClick={addField} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">+ Add field</button>
              </div>
              <div className="space-y-3">
                {leadFields.length === 0 && <p className="text-sm text-ink-mute">No fields yet — add at least a name and email.</p>}
                {leadFields.map((f, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={f.label}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        placeholder="Field label"
                        className="min-w-[140px] flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-600"
                      />
                      <select
                        value={f.type}
                        onChange={(e) => updateField(i, { type: e.target.value as LeadField['type'] })}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-ink-soft">
                        <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                        Required
                      </label>
                      <div className="ml-auto flex items-center gap-1 text-ink-mute">
                        <button onClick={() => moveField(i, -1)} className="px-1.5 hover:text-ink" title="Move up">↑</button>
                        <button onClick={() => moveField(i, 1)} className="px-1.5 hover:text-ink" title="Move down">↓</button>
                        <button onClick={() => removeField(i)} className="px-1.5 hover:text-red-600" title="Remove">✕</button>
                      </div>
                    </div>
                    {f.type === 'select' && (
                      <input
                        value={(f.options || []).join(', ')}
                        onChange={(e) => updateField(i, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })}
                        placeholder="Options, comma separated (e.g. Yes, No, Maybe)"
                        className="mt-2 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-600"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
        <span className="text-sm">
          {status === 'saved' && <span className="text-green-600">Saved ✓</span>}
          {status === 'error' && <span className="text-red-600">{error}</span>}
        </span>
        <button
          onClick={save}
          disabled={status === 'saving'}
          className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

// ── field primitives ──
function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-ink-soft">{children}</span>;
}
function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600" />
    </label>
  );
}
function Area({ label, value, onChange, rows = 3, mono, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; mono?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 ${mono ? 'font-mono text-xs' : ''}`}
      />
    </label>
  );
}
function Num({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600" />
    </label>
  );
}
function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-slate-300" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600" />
      </div>
    </label>
  );
}
function Toggle({ label, checked, onChange, hint, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label>{label}</Label>
        {hint && <p className="text-xs text-ink-mute">{hint}</p>}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`mt-1 h-6 w-11 flex-none rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'} ${disabled ? 'opacity-50' : ''}`}
      >
        <span className={`block h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
