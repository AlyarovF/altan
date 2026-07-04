'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

/**
 * Reveals children with a subtle fade+rise the first time they scroll into view.
 * Motion is CSS-driven (see globals.css `[data-reveal]`) and disabled entirely
 * under `prefers-reduced-motion`. `delay` staggers grouped items.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Older engines / non-scrolling renderers without IntersectionObserver: reveal
    // immediately so content is never stuck hidden.
    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-revealed', 'true');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.setAttribute('data-revealed', 'true');
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
