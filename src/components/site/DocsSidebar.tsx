'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface DocLink {
  slug: string;
  title: string;
}

export function DocsSidebar({ items }: { items: DocLink[] }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1 text-sm">
      <Link
        href="/docs"
        className={`block rounded-lg px-3 py-2 transition hover:bg-slate-50 ${
          pathname === '/docs' ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-soft'
        }`}
      >
        Overview
      </Link>
      {items.map((it) => {
        const href = `/docs/${it.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={it.slug}
            href={href}
            className={`block rounded-lg px-3 py-2 transition hover:bg-slate-50 ${
              active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-soft'
            }`}
          >
            {it.title}
          </Link>
        );
      })}
    </nav>
  );
}
