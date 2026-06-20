'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ReferralRow {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  date: string;
  status: string;
  amount: string;
}

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700',
  earned: 'bg-green-100 text-green-700',
  paid: 'bg-slate-200 text-slate-700',
  void: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  earned: 'Payable',
  paid: 'Paid',
  void: 'Void',
};

export function AdminReferralRow({ row }: { row: ReferralRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: 'paid' | 'void' | 'earned') {
    setBusy(true);
    await fetch('/api/admin/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralId: row.id, action }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="font-medium text-cow-black">{row.referrerName}</div>
        <div className="text-xs text-ink-mute">{row.referrerEmail}</div>
      </td>
      <td className="px-4 py-3 text-ink-soft">{row.referredName}</td>
      <td className="px-4 py-3 text-ink-soft">{row.date}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_PILL[row.status] || ''}`}>
          {STATUS_LABEL[row.status] || row.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-semibold text-cow-black">{row.amount}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          {row.status === 'earned' && (
            <button
              onClick={() => act('paid')}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Mark paid
            </button>
          )}
          {row.status === 'paid' && (
            <button
              onClick={() => act('earned')}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Undo paid
            </button>
          )}
          {row.status !== 'void' ? (
            <button
              onClick={() => act('void')}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Void
            </button>
          ) : (
            <button
              onClick={() => act('earned')}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Restore
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
