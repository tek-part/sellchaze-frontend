/**
 * Voltage Drawer — an accessible slide-in panel (right / left / top). role="dialog" aria-modal, focus
 * trapped + restored via useOverlay, scrim click + Escape to close, reduced-motion aware. Renders
 * nothing when closed (unmounts content). Voltage's own chrome — no Theme 01 reuse.
 */
import { useRef, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { IconButton } from './IconButton';
import { IconClose } from './icons';
import { useOverlay } from './overlay/useOverlay';

export type DrawerSide = 'right' | 'left' | 'top';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  title: string;
  /** Hide the visual title but keep it as the dialog's accessible name. */
  hideTitle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Drawer(props: DrawerProps): ReactElement | null {
  const { open, onClose, side = 'right', title, hideTitle = false, children, footer, className } = props;
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(open, panelRef, onClose);
  if (!open) return null;

  const titleId = `vlt-drawer-${side}-title`;
  return (
    <div className="vlt-overlay" role="presentation">
      <div className="vlt-overlay__scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={cn('vlt-drawer', `vlt-drawer--${side}`, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="vlt-drawer__head">
          <h2 id={titleId} className={hideTitle ? 'vlt-visually-hidden' : 'vlt-drawer__title'}>{title}</h2>
          <IconButton label={t('common.close')} onClick={onClose} className="vlt-drawer__close"><IconClose /></IconButton>
        </header>
        <div className="vlt-drawer__body">{children}</div>
        {footer ? <footer className="vlt-drawer__foot">{footer}</footer> : null}
      </div>
    </div>
  );
}
