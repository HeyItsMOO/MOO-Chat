'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputClass =
  'mt-1 w-full rounded-xl border-2 border-cow-black px-3 py-2.5 text-sm font-semibold outline-none focus:border-pasture-deep focus:ring-2 focus:ring-pasture';

export default function OnboardingForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/tenant/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName, websiteUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      setLoading(false);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-bold text-ink-soft">Business name</span>
        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-ink-soft">Website (optional)</span>
        <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" className={inputClass} />
      </label>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="btn-moo w-full disabled:opacity-50">
        {loading ? 'Creating…' : 'Continue'}
      </button>
    </form>
  );
}
