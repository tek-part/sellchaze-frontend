/**
 * Drawer — edge panel (cart, mobile nav, filters). Slides from the inline-end by default (RTL flips
 * automatically); ~420w desktop / near-full mobile. Composes Overlay. See §32.7.
 */
import type { ReactElement, ReactNode, RefObject } from 'react';
import { Overlay } from './overlay/Overlay';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Which edge to slide from (logical). Defaults to `end`. */
  side?: 'end' | 'start';
  title?: ReactNode;
  ariaLabel?: string;
  closeOnScrimClick?: boolean;
  closeOnEsc?: boolean;
  hideClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}

export function Drawer(props: DrawerProps): ReactElement {
  const { side = 'end', ...rest } = props;
  return <Overlay variant={side === 'start' ? 'drawer-start' : 'drawer-end'} {...rest} />;
}
