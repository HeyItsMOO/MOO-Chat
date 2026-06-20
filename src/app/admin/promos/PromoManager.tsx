'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type PromoRow = {
  id: string;
  code: string;
  description: string;
  benefit: string;
  summary: string;
  redemptionCount: number;
  maxRedemptions: number;
  expiresAt: string | null;
  active: boolean;
};

const PLAN_OPTIONS = [
  { value: '', label: 'Extend trial (no plan)' },
  { value: 'starter', label: 'Comp Starter' },
  { value: 'pro', label: 'Comp Growth' },
  { value: 'business', label: 'Comp Business' },
  { value: 'custom', label: 'Comp Custom' },
];

export function PromoManager({ codes }: { codes: PromoRow[] }) {
  const router = useRouter();
  const [benefit, setBenefit] = useState<'free_days' | 'percent_off' | 'credit'>('free_days');
  const [form, setForm] = useState({
    code: '',
    description: '',
    planId: '',
    days: 30,
    percentOff: 20,
    durationMonths: 3,
    amount: 25,
    maxRedemptions: 0,
    expiresAt: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setOk('');
    try {
      const res = await fetch('/api/admin/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          benefit,
          planId: form.planId,
          days: Number(form.days),
          percentOff: Number(form.percentOff),
          durationMonths: Number(form.durationMonths),
          amount: Number(form.amount),
          maxRedemptions: Number(form.maxRedemptions),
          expiresAt: form.expiresAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not create code.');
        setBusy(false);
        return;
      }
      setOk('Code created.');
      setForm((f) => ({ ...f, code: '', description: '' }));
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    await fetch('/api/admin/promo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active }),
    });
    router.refresh();
  }

  async function remove(id: string, code: string) {
    if (!confirm(`Delete promo code ${code}? This also removes its redemption history.`)) return;
    await fetch('/api/admin/promo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  const input = 'rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600';

  return (
    <div className="space-y-6">
      {/* Create */}
      <form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">New promo code</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-ink-mute">Code</span>
            <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="MOO30" className={`${input} mt-1 w-full uppercase tracking-wide`} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-mute">Type</span>
            <select value={benefit} onChange={(e) => setBenefit(e.target.value as typeof benefit)} className={`${input} mt-1 w-full`}>
              <option value="free_days">Free time (trial / comp)</option>
              <option value="percent_off">Percent off</option>
              <option value="credit">Account credit</option>
            </select>
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-semibold text-ink-mute">Description (internal)</span>
          <input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Launch promo" className={`${input} mt-1 w-full`} />
        </label>

        {/* Benefit-specific */}
        {benefit === 'free_days' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink-mute">Applies to</span>
              <select value={form.planId} onChange={(e) => set('planId', e.target.value)} className={`${input} mt-1 w-full`}>
                {PLAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-mute">Days free</span>
              <input type="number" min={1} max={3650} value={form.days} onChange={(e) => set('days', Number(e.target.value))} className={`${input} mt-1 w-full`} />
            </label>
          </div>
        )}
        {benefit === 'percent_off' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink-mute">Percent off (1–100)</span>
              <input type="number" min={1} max={100} value={form.percentOff} onChange={(e) => set('percentOff', Number(e.target.value))} className={`${input} mt-1 w-full`} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-mute">For how many months</span>
              <input type="number" min={1} max={60} value={form.durationMonths} onChange={(e) => set('durationMonths', Number(e.target.value))} className={`${input} mt-1 w-full`} />
            </label>
          </div>
        )}
        {benefit === 'credit' && (
          <label className="mt-3 block sm:w-1/2">
            <span className="text-xs font-semibold text-ink-mute">Credit amount (AUD)</span>
            <input type="number" min={1} step="0.01" value={form.amount} onChange={(e) => set('amount', Number(e.target.value))} className={`${input} mt-1 w-full`} />
          </label>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-ink-mute">Max redemptions (0 = unlimited)</span>
            <input type="number" min={0} value={form.maxRedemptions} onChange={(e) => set('maxRedemptions', Number(e.target.value))} className={`${input} mt-1 w-full`} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-mute">Expires (optional)</span>
            <input type="date" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} className={`${input} mt-1 w-full`} />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={busy} className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {busy ? 'Creating…' : 'Create code'}
          </button>
          {ok && <span className="text-sm font-semibold text-green-600">{ok}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {/* List */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-ink-mute">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Benefit</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {codes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-mute">No promo codes yet.</td></tr>
            )}
            {codes.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <div className="font-mono font-bold">{c.code}</div>
                  {c.description && <div className="text-xs text-ink-mute">{c.description}</div>}
                </td>
                <td className="px-4 py-3">{c.summary}</td>
                <td className="px-4 py-3">{c.redemptionCount}{c.maxRedemptions > 0 ? ` / ${c.maxRedemptions}` : ''}</td>
                <td className="px-4 py-3">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${c.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-ink-mute'}`}>
                    {c.active ? 'Active' : 'Off'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggle(c.id, !c.active)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50">
                      {c.active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => remove(c.id, c.code)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
