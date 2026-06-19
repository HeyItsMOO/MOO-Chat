'use client';

import { useState } from 'react';

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
}

const ROLES = ['owner', 'admin', 'agent'];

export function TeamManager({
  initialMembers,
  myUserId,
  myRole,
  canManage,
}: {
  initialMembers: Member[];
  myUserId: string;
  myRole: string;
  canManage: boolean;
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agent');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isOwner = myRole === 'owner';

  async function reload() {
    const res = await fetch('/api/tenant/team');
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const res = await fetch('/api/tenant/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Could not add that person.');
      return;
    }
    setEmail('');
    setRole('agent');
    setNotice('Teammate added.');
    reload();
  }

  async function changeRole(id: string, newRole: string) {
    setError('');
    const res = await fetch('/api/tenant/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipId: id, role: newRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || 'Could not change the role.');
    reload();
  }

  async function remove(id: string) {
    setError('');
    const res = await fetch('/api/tenant/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipId: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || 'Could not remove that person.');
    reload();
  }

  return (
    <div className="space-y-5">
      {canManage && (
        <form onSubmit={invite} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Invite a teammate</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Enter the email of someone who already has a ChatMOO account to add them to this workspace.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@email.com"
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600"
            >
              {ROLES.filter((r) => r !== 'owner' || isOwner).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button type="submit" disabled={busy} className="btn-moo text-sm disabled:opacity-50">
              {busy ? 'Adding…' : 'Add'}
            </button>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {notice && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-ink-mute">
              <th className="px-4 py-3 font-semibold">Member</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              {canManage && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const editable = canManage && (m.role !== 'owner' || isOwner);
              const isMe = m.userId === myUserId;
              return (
                <tr key={m.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{m.name || m.email.split('@')[0]}{isMe && <span className="ml-2 text-xs text-ink-mute">(you)</span>}</div>
                    <div className="text-xs text-ink-mute">{m.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {editable ? (
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.id, e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-600"
                      >
                        {ROLES.filter((r) => r !== 'owner' || isOwner).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-ink-soft">{m.role}</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {editable && (
                        <button onClick={() => remove(m.id)} className="text-sm font-medium text-red-600 hover:underline">
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!canManage && (
        <p className="text-sm text-ink-soft">You have <strong>{myRole}</strong> access. Ask an owner or admin to change roles.</p>
      )}
    </div>
  );
}
