'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';

const inputClass =
  'mt-1 w-full rounded-xl border-2 border-cow-black px-3 py-2.5 text-sm font-semibold outline-none focus:border-pasture-deep focus:ring-2 focus:ring-pasture';

const REF_KEY = 'chatmoo_ref';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', websiteUrl: '' });
  const [ref, setRef] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Capture a referral code from ?ref= (or a previously stored one) on mount.
  // Reading window.location avoids needing a useSearchParams Suspense boundary.
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('ref') || '';
      const code = (fromUrl || window.localStorage.getItem(REF_KEY) || '').trim();
      if (code) {
        setRef(code);
        window.localStorage.setItem(REF_KEY, code);
      }
    } catch {
      /* ignore storage/availability errors */
    }
  }, []);

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
        body: JSON.stringify({ ...form, ref }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      try {
        window.localStorage.removeItem(REF_KEY);
      } catch {
        /* ignore */
      }
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md card-moo p-8">
      <h1 className="font-heading text-2xl font-bold text-cow-black">Create your assistant 🐄</h1>
      <p className="mt-1 text-sm font-bold text-ink-soft">Free to start · 5-day Growth trial · no credit card.</p>

      {ref && (
        <p className="mt-3 rounded-lg bg-pasture-light px-3 py-2 text-sm font-bold text-cow-black">
          🎁 You were referred — code <span className="font-mono">{ref.toUpperCase()}</span> applied.
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Your name" value={form.name} onChange={(v) => set('name', v)} placeholder="Jane Smith" />
        <Field label="Work email" type="email" required value={form.email} onChange={(v) => set('email', v)} placeholder="jane@store.com" />
        <Field label="Password" type="password" required value={form.password} onChange={(v) => set('password', v)} placeholder="At least 8 characters" />
        <Field label="Business name" required value={form.businessName} onChange={(v) => set('businessName', v)} placeholder="Acme Co" />
        <Field label="Website (optional)" value={form.websiteUrl} onChange={(v) => set('websiteUrl', v)} placeholder="https://acme.com" />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-moo w-full disabled:opacity-50">
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-bold text-ink-soft">
        Already have an account?{' '}
        <Link href="/login" className="text-pasture-deep underline underline-offset-2 hover:text-cow-black">Log in</Link>
      </p>
    </div>
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
      <span className="text-sm font-bold text-ink-soft">{props.label}</span>
      <input
        type={props.type || 'text'}
        required={props.required}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}
