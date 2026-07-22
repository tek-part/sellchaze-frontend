/**
 * Portal — renders children into `document.body` so overlays escape ancestor overflow/stacking.
 * SSR-safe: renders nothing until mounted on the client. Theme tokens still resolve because they
 * live on `<html>`; the panel restates font/colour for the same reason.
 */
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Portal({ children }: { children: ReactNode }): ReactElement | null {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
