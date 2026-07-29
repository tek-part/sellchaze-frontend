/**
 * Voltage Modal — an accessible centered dialog. role="dialog" aria-modal, focus trapped + restored,
 * scrim + Escape to close, reduced-motion aware. Unmounts when closed. Voltage's own chrome.
 */
import { useRef, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { IconButton } from './IconButton';
import { IconClose } from './icons';
import { useOverlay } from './overlay/useOverlay';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  hideTitle?: boolean;
  children: ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

export function Modal(props: ModalProps): ReactElement | null {
  const { open, onClose, title, hideTitle = false, children, size = 'md', className } = props;
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(open, panelRef, onClose);
  if (!open) return null;

  const titleId = 'vlt-modal-title';
  return (
    <div className="vlt-overlay vlt-overlay--center" role="presentation">
      <div className="vlt-overlay__scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={cn('vlt-modal', `vlt-modal--${size}`, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="vlt-modal__head">
          <h2 id={titleId} className={hideTitle ? 'vlt-visually-hidden' : 'vlt-modal__title'}>{title}</h2>
          <IconButton label={t('common.close')} onClick={onClose} className="vlt-modal__close"><IconClose /></IconButton>
        </header>
        <div className="vlt-modal__body">{children}</div>
      </div>
    </div>
  );
}
