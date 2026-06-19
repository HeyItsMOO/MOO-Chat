'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600';

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '', website: '' });

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch {
      setError('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center">
        <div className="text-3xl">✅</div>
        <h2 className="mt-3 text-xl font-bold text-ink">Thanks — message sent!</h2>
        <p className="mt-2 text-sm text-ink-soft">We&apos;ll get back to you by email shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Name</span>
          <input required value={form.name} onChange={update('name')} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Email</span>
          <input type="email" required value={form.email} onChange={update('email')} className={inputClass} />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-medium text-ink-soft">Company <span className="text-ink-mute">(optional)</span></span>
        <input value={form.company} onChange={update('company')} className={inputClass} />
      </label>
      <label className="mt-4 block">
        <span className="text-sm font-medium text-ink-soft">How can we help?</span>
        <textarea required rows={5} value={form.message} onChange={update('message')} className={inputClass} />
      </label>

      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={update('website')}
        className="hidden"
        aria-hidden="true"
      />

      {status === 'error' && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-5 w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
