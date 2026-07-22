/**
 * useScrollLock — freezes body scroll while an overlay is open, compensating for the scrollbar
 * width so the page doesn't shift. Restores the previous style on cleanup. Idempotent-safe.
 */
import { useEffect } from 'react';

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    const { body, documentElement } = document;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingInlineEnd;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingInlineEnd = `${scrollbar}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingInlineEnd = prevPad;
    };
  }, [active]);
}
