'use client';

import { useEffect, useRef, useState } from 'react';

type State = 'init' | 'static' | 'hidden' | 'shown';

/**
 * Fades + lifts children into view on scroll using IntersectionObserver.
 *
 * Progressive enhancement: the server renders with no animation classes (content
 * visible), so it's safe without JS and for reduced-motion users. Content that
 * is already in (or above) the viewport at mount is shown immediately with NO
 * animation — otherwise above-the-fold content flashes hidden then re-animates
 * on every load, which reads as the page "jumping" on first paint / scroll.
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
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setState('static');
      return;
    }

    // Already visible (or scrolled past) at mount → no entrance animation.
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (el.getBoundingClientRect().top < vh * 0.92) {
      setState('static');
      return;
    }

    // Below the fold → hide, then reveal once scrolled into view.
    setState('hidden');
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
