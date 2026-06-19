'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', websiteUrl: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm text-ink-mute hover:text-ink">← Back</Link>
        <h1 className="mt-4 text-2xl font-bold">Create your assistant</h1>
        <p className="mt-1 text-sm text-ink-soft">Free to start · no credit card.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Your name" value={form.name} onChange={(v) => set('name', v)} placeholder="Jane Smith" />
          <Field label="Work email" type="email" required value={form.email} onChange={(v) => set('email', v)} placeholder="jane@store.com" />
          <Field label="Password" type="password" required value={form.password} onChange={(v) => set('password', v)} placeholder="At least 8 characters" />
          <Field label="Business name" required value={form.businessName} onChange={(v) => set('businessName', v)} placeholder="Acme Co" />
          <Field label="Website (optional)" value={form.websiteUrl} onChange={(v) => set('websiteUrl', v)} placeholder="https://acme.com" />

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-soft">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft">{props.label}</span>
      <input
        type={props.type || 'text'}
        required={props.required}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
      />
    </label>
  );
}
