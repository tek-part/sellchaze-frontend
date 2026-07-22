/**
 * useReveal — reveals an element once as it scrolls into view (a slow fade-up, the theme's
 * documented entrance motion). Uses IntersectionObserver; sets data-revealed="true" once and stops
 * observing. Reduced-motion (or no IO) reveals immediately with no animation. Returns a ref to attach.
 */
import { useEffect, useRef, type RefObject } from 'react';
import { prefersReducedMotion } from '../../../../../shared/env/media';

export function useReveal<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      element.setAttribute('data-revealed', 'true');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.setAttribute('data-revealed', 'true');
            observer.disconnect();
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}
