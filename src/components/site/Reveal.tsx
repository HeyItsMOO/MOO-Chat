'use client';

import { useEffect, useRef, useState } from 'react';

type State = 'init' | 'hidden' | 'shown';

/**
 * Fades + lifts children into view on scroll using IntersectionObserver.
 * Progressive enhancement: server renders with no animation classes (content
 * visible), so it's safe without JS and for reduced-motion users.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>('init');

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setState('shown');
      return;
    }
    setState('hidden');
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setState('shown');
            obs.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cls = state === 'hidden' ? 'reveal-hidden' : state === 'shown' ? 'reveal-shown' : '';

  return (
    <div ref={ref} className={`${cls} ${className ?? ''}`} style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
