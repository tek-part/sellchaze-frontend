/**
 * Modal — centred focused overlay (quick-view, confirm, size guide). Composes Overlay; traps focus,
 * Esc + scrim-click close, returns focus to the trigger. Max ~960w, `--radius-lg`. See §32.7.
 */
import type { ReactElement, ReactNode, RefObject } from 'react';
import { Overlay } from './overlay/Overlay';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  ariaLabel?: string;
  closeOnScrimClick?: boolean;
  closeOnEsc?: boolean;
  hideClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}

export function Modal(props: ModalProps): ReactElement {
  return <Overlay variant="modal" {...props} />;
}
