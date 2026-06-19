'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DomainsManager({ initial }: { initial: { id: string; domain: string }[] }) {
  const router = useRouter();
  const [domains, setDomains] = useState(initial);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/tenant/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not add domain.');
      } else {
        setInput('');
        router.refresh();
        // Optimistic local add so it shows immediately.
        setDomains((d) => [...d, { id: 'tmp-' + Math.random(), domain: input.replace(/^www\./, '').toLowerCase() }]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch('/api/tenant/domains', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setDomains((d) => d.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="example.com"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
        />
        <button onClick={add} disabled={busy || !input} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          Add
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <ul className="mt-3 divide-y divide-slate-100">
        {domains.length === 0 && <li className="py-3 text-sm text-ink-mute">No domains yet — add the site where you&apos;ll install the widget.</li>}
        {domains.map((d) => (
          <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
            <span className="font-mono">{d.domain}</span>
            <button onClick={() => remove(d.id)} className="text-ink-mute hover:text-red-600">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
