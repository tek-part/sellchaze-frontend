/**
 * Portal — renders children into a document-body node so overlays escape ancestor clipping/stacking.
 * SSR-safe: renders nothing until mounted on the client.
 */
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  children: ReactNode;
}

export function Portal(props: PortalProps): ReactElement | null {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(props.children, document.body) as ReactElement;
}
