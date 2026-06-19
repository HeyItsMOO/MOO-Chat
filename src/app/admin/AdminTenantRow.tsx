'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Row {
  id: string;
  name: string;
  plan: string;
  status: string;
  owner: string;
  usage: number;
  conversations: number;
  leads: number;
}

const PLAN_OPTS = ['free', 'starter', 'pro', 'business'];
const STATUS_PILL: Record<string, string> = {
  trialing: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

export function AdminTenantRow({ row, planLimit }: { row: Row; planLimit: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(body: Record<string, string>) {
    setBusy(true);
    await fetch('/api/admin/tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: row.id, ...body }),
    });
    router.refresh();
    setBusy(false);
  }

  async function impersonate() {
    setBusy(true);
    await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: row.id }),
    });
    router.push('/dashboard');
  }

  const suspended = row.status === 'suspended';

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium">{row.name}</td>
      <td className="px-4 py-3 text-ink-soft">{row.owner}</td>
      <td className="px-4 py-3">
        <select
          value={row.plan}
          disabled={busy}
          onChange={(e) => update({ plan: e.target.value })}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
        >
          {PLAN_OPTS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_PILL[row.status] || ''}`}>{row.status}</span>
      </td>
      <td className="px-4 py-3 text-ink-soft">{row.usage.toLocaleString()} / {planLimit.toLocaleString()}</td>
      <td className="px-4 py-3 text-ink-soft">{row.conversations}</td>
      <td className="px-4 py-3 text-ink-soft">{row.leads}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button onClick={impersonate} disabled={busy} className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            Jump in
          </button>
          <button
            onClick={() => update({ status: suspended ? 'active' : 'suspended' })}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            {suspended ? 'Activate' : 'Suspend'}
          </button>
        </div>
      </td>
    </tr>
  );
}
