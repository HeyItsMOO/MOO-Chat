'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PromoRedeem({ initialError = '' }: { initialError?: string }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState(initialError);

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not redeem that code.');
        setBusy(false);
        return;
      }
      setMsg(data.message || 'Code applied.');
      setCode('');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-bold">Have a promo code?</h3>
      <form onSubmit={redeem} className="mt-2 flex flex-wrap gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="MOO30"
          className="min-w-[160px] flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase tracking-wide outline-none focus:border-brand-600"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? 'Applying…' : 'Apply code'}
        </button>
      </form>
      {msg && <p className="mt-2 text-sm font-semibold text-green-600">{msg}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
