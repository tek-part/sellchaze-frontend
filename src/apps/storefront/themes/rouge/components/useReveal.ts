/**
 * useReveal — one-shot IntersectionObserver that flags an element as revealed when it scrolls into
 * view, driving the theme's "bloom" entrance (see `.rge-reveal` in sections.css; reduced motion is
 * handled there). Degrades to immediately-revealed where IntersectionObserver is unavailable.
 *
 * HARDENING: `.rge-reveal` starts at opacity 0, so a reveal that never fires would leave content
 * permanently hidden. A fail-safe timer therefore always reveals after a short delay if the observer
 * hasn't — content is never lost even if IntersectionObserver is broken or throttled.
 */
import { useEffect, useRef, useState, type RefObject } from 'react';

const FAILSAFE_MS = 1400;

export function useReveal<T extends HTMLElement>(): { ref: RefObject<T | null>; revealed: boolean } {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    let done = false;
    const reveal = (): void => {
      if (!done) {
        done = true;
        setRevealed(true);
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    const failsafe = window.setTimeout(reveal, FAILSAFE_MS);
    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [revealed]);

  return { ref, revealed };
}
