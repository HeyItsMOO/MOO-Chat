import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { LogoutButton } from '@/app/dashboard/_components';

/** Top header for the portal (dashboard + admin) — gives the app real chrome. */
export function PortalHeader({
  email,
  planLabel,
  admin = false,
}: {
  email: string;
  planLabel?: string;
  admin?: boolean;
}) {
  return (
    <header className="border-b-4 border-pasture bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <Link href={admin ? '/admin' : '/dashboard'} className="flex items-center gap-2 font-heading text-xl font-bold text-cow-black">
            <span>{BRAND.emoji}</span> {BRAND.name}
          </Link>
          {admin && (
            <span className="rounded-md border-2 border-cow-black bg-accent px-2 py-0.5 text-xs font-bold text-cow-black">Admin</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {admin && <Link href="/admin" className="hidden font-semibold text-ink-soft hover:text-cow-black sm:inline">Tenants</Link>}
          <Link href="/" className="hidden font-semibold text-ink-soft hover:text-cow-black sm:inline">View site ↗</Link>
          {planLabel && (
            <span className="hidden rounded-full border-2 border-cow-black bg-pasture-light px-3 py-1 text-xs font-bold text-cow-black sm:inline">
              {planLabel}
            </span>
          )}
          <span className="hidden max-w-[160px] truncate text-ink-mute md:inline">{email}</span>
          <span className="h-6 w-px bg-slate-200" />
          <LogoutButton compact />
        </div>
      </div>
    </header>
  );
}

/** Slim portal footer. */
export function PortalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs font-semibold text-ink-mute sm:flex-row">
        <span>© {new Date().getFullYear()} {BRAND.name} — a {BRAND.parent} product.</span>
        <span className="flex items-center gap-4">
          <Link href="/" className="hover:text-cow-black">Home</Link>
          <Link href="/docs" className="hover:text-cow-black">Docs</Link>
          <Link href="/contact" className="hover:text-cow-black">Support</Link>
          <Link href="/legal/privacy" className="hover:text-cow-black">Privacy</Link>
        </span>
      </div>
    </footer>
  );
}
