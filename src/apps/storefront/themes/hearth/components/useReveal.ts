/**
 * useReveal — a gentle "settle in on scroll" hook. Returns a ref + a `revealed` flag driven by an
 * IntersectionObserver (one-shot). Honours `prefers-reduced-motion`: reduced-motion users start
 * revealed with no animation. Motion has weight, like real objects (docs/themes/theme-03/02 §P6).
 */
import { useEffect, useRef, useState, type RefObject } from 'react';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

export function useReveal<T extends HTMLElement>(): { ref: RefObject<T | null>; revealed: boolean } {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (revealed) return undefined;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  return { ref, revealed };
}
