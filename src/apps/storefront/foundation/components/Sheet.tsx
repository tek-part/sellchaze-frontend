/**
 * Sheet — bottom sheet for small screens (mobile filters, sort, variant pickers). The mobile-native
 * form of Modal; rounded top corners, slides up. Composes Overlay. See §32.7 (Modal `sheet`).
 */
import type { ReactElement, ReactNode, RefObject } from 'react';
import { Overlay } from './overlay/Overlay';

export interface SheetProps {
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

export function Sheet(props: SheetProps): ReactElement {
  return <Overlay variant="sheet" {...props} />;
}
