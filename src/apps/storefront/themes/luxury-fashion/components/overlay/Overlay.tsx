/**
 * Overlay — the shared dialog surface behind Modal / Drawer / Sheet. Handles portal, scrim, focus
 * trap, body-scroll lock, Esc + scrim-click close, mount/unmount enter-exit animation, and returns
 * focus to the trigger. Floats on --shadow-lg + --scrim (§32.7). Theme-agnostic behaviour; the
 * variant classes carry the motion.
 */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../../../../../../shared/utils/cn';
import { IconButton } from '../IconButton';
import { IconClose } from '../icons';
import { Portal } from './Portal';
import { useFocusTrap } from './useFocusTrap';
import { useScrollLock } from './useScrollLock';

export type OverlayVariant = 'modal' | 'drawer-end' | 'drawer-start' | 'sheet';

export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  variant: OverlayVariant;
  /** Renders the default header (title + close button). Omit to compose your own chrome. */
  title?: ReactNode;
  /** Accessible name when there is no visible `title`. */
  ariaLabel?: string;
  closeOnScrimClick?: boolean;
  closeOnEsc?: boolean;
  hideClose?: boolean;
  /** Element to focus first (defaults to the first focusable in the panel). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  panelClassName?: string;
  children: ReactNode;
}

/** Scrollable body region for overlay content. */
export function OverlayBody(props: { className?: string; children: ReactNode }): ReactElement {
  return <div className={cn('sf-overlay__body', props.className)}>{props.children}</div>;
}

/** Pinned footer region (summary, primary action). */
export function OverlayFooter(props: { className?: string; children: ReactNode }): ReactElement {
  return <div className={cn('sf-overlay__footer', props.className)}>{props.children}</div>;
}

/** Matches --transition-slow (600ms) + headroom, for exit-animation unmount. */
const EXIT_MS = 640;

export function Overlay(props: OverlayProps): ReactElement | null {
  const {
    open,
    onClose,
    variant,
    title,
    ariaLabel,
    closeOnScrimClick = true,
    closeOnEsc = true,
    hideClose = false,
    initialFocusRef,
    className,
    panelClassName,
    children,
  } = props;

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [present, setPresent] = useState(open);
  const [state, setState] = useState<'open' | 'closed'>('closed');

  // Drive enter/exit: mount → next frame opens; close → animate → unmount after EXIT_MS.
  useEffect(() => {
    if (open) {
      setPresent(true);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setState('open'));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setState('closed');
    const timer = setTimeout(() => setPresent(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  // Esc to close.
  useEffect(() => {
    if (!present || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [present, closeOnEsc, onClose]);

  useScrollLock(present);
  useFocusTrap(present && state === 'open', panelRef, initialFocusRef);

  if (!present) return null;

  return (
    <Portal>
      <div className={cn('sf-overlay', `sf-overlay--${variant}`, className)} data-state={state}>
        <div
          className="sf-scrim"
          aria-hidden
          onClick={closeOnScrimClick ? onClose : undefined}
        />
        <div
          ref={panelRef}
          className={cn('sf-overlay__panel', panelClassName)}
          role="dialog"
          aria-modal="true"
          aria-label={title === undefined ? ariaLabel : undefined}
          aria-labelledby={title !== undefined ? titleId : undefined}
          tabIndex={-1}
        >
          {title !== undefined ? (
            <div className="sf-overlay__header">
              <h2 id={titleId} className="sf-overlay__title">
                {title}
              </h2>
              {hideClose ? null : (
                <IconButton label="Close" onClick={onClose}>
                  <IconClose />
                </IconButton>
              )}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </Portal>
  );
}
