/**
 * Popover — click-triggered floating panel anchored to a trigger. Closes on outside-click and Esc
 * (returning focus to the trigger). `children` is a render function receiving `close()` so its
 * content (e.g. menu items, a form) can dismiss the popover. See §32.6 (dropdown/popover family).
 */
import {
  cloneElement,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { callAll } from '../../../../../shared/utils/callAll';

export type FloatingPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'bottom-center'
  | 'top-start'
  | 'top-center';

export interface PopoverProps {
  trigger: ReactElement<HTMLAttributes<HTMLElement>>;
  placement?: FloatingPlacement;
  ariaLabel?: string;
  /** Panel role; use 'none' when the content provides its own role (e.g. a menu). */
  role?: 'dialog' | 'none';
  panelClassName?: string;
  /** Panel content, or a render function receiving `close()`. */
  children: ReactNode | ((close: () => void) => ReactNode);
  onOpenChange?: (open: boolean) => void;
}

export function Popover(props: PopoverProps): ReactElement {
  const { trigger, placement = 'bottom-start', ariaLabel, role = 'dialog', panelClassName, children, onOpenChange } = props;
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);

  const setOpenState = (next: boolean): void => {
    setOpen(next);
    onOpenChange?.(next);
  };
  const close = (): void => setOpenState(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent): void => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) setOpenState(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setOpenState(false);
        anchorRef.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const clonedTrigger = cloneElement(trigger, {
    'aria-haspopup': trigger.props['aria-haspopup'] ?? 'dialog',
    'aria-expanded': open,
    onClick: callAll(trigger.props.onClick, () => setOpenState(!open)),
  });

  return (
    <span className="sf-anchor" ref={anchorRef}>
      {clonedTrigger}
      {open ? (
        <div
          className={cn('sf-floating', `sf-floating--${placement}`, 'sf-popover', panelClassName)}
          role={role === 'none' ? undefined : role}
          aria-label={role === 'none' ? undefined : ariaLabel}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      ) : null}
    </span>
  );
}
