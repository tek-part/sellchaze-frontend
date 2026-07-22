/**
 * Rouge Drawer — a slide-in panel (cart, filters) over a scrim. Portalled; traps focus, locks scroll,
 * closes on Escape / scrim click. Mounts only while `open` (the CSS entrance plays on mount).
 */
import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../../shared/utils/cn';
import { Portal } from './Portal';
import { useFocusTrap } from './useFocusTrap';
import { useScrollLock } from './useScrollLock';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'start' | 'end';
  label: string;
  children: ReactNode;
}

export function Drawer(props: DrawerProps): ReactElement | null {
  const { open, onClose, side = 'end', label, children } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal>
      <div className="rge-overlay" role="presentation">
        <div className="rge-overlay__scrim" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          className={cn('rge-drawer', `rge-drawer--${side}`)}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}
