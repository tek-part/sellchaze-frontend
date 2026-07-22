/**
 * useReveal — Voltage's scroll-reveal primitive. Returns a ref; when the element enters the viewport
 * it flips `data-revealed="true"` (the `.vlt-reveal` CSS animates opacity/translate). Robust by design:
 * reveals immediately for prefers-reduced-motion or when already in view on mount, watches via
 * IntersectionObserver AND a passive scroll/resize fallback (so content is never stuck hidden if IO is
 * throttled), and reveals if IO is unavailable. One-shot — tears everything down after revealing.
 */
import { useEffect, useRef, type RefObject } from 'react';

export function useReveal<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const revealNow = (): void => node.setAttribute('data-revealed', 'true');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const inView = (): boolean => node.getBoundingClientRect().top < (window.innerHeight || 0) * 0.92;

    if (reduce || inView()) {
      revealNow();
      return;
    }

    let done = false;
    let observer: IntersectionObserver | undefined;
    const cleanup = (): void => {
      observer?.disconnect();
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
    const reveal = (): void => {
      if (done) return;
      done = true;
      revealNow();
      cleanup();
    };
    function onScrollOrResize(): void {
      if (inView()) reveal();
    }

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) if (entry.isIntersecting) reveal();
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
      );
      observer.observe(node);
    }
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return cleanup;
  }, []);

  return ref;
}
