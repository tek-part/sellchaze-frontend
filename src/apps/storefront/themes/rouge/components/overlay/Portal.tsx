/** Rouge Portal — renders children into a document-body node (overlays, toasts, drawers). SSR-safe. */
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Portal(props: { children: ReactNode }): ReactElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-rge-portal', '');
    document.body.appendChild(el);
    setHost(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);
  if (!host) return null;
  return createPortal(props.children, host);
}
