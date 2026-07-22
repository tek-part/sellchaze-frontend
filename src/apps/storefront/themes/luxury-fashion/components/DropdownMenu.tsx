/**
 * DropdownMenu — a Popover whose content is an ARIA menu: roving arrow-key focus, Home/End, and
 * activation closes the menu. Items can be actions (onSelect) or links (href). See §32.6.
 */
import {
  cloneElement,
  useEffect,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { Popover, type FloatingPlacement } from './Popover';

export interface DropdownItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  selected?: boolean;
}

export interface DropdownMenuProps {
  trigger: ReactElement<HTMLAttributes<HTMLElement>>;
  items: ReadonlyArray<DropdownItem>;
  placement?: FloatingPlacement;
  label?: string;
}

function MenuList(props: { items: ReadonlyArray<DropdownItem>; label?: string; close: () => void }): ReactElement {
  const { items, label, close } = props;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const nodes = Array.from(
      ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [],
    );
    if (nodes.length === 0) return;
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (event.key === 'ArrowDown') next = (index + 1) % nodes.length;
    else if (event.key === 'ArrowUp') next = (index - 1 + nodes.length) % nodes.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = nodes.length - 1;
    if (next === null) return;
    event.preventDefault();
    nodes[next]?.focus();
  };

  return (
    <div ref={ref} role="menu" aria-label={label} className="sf-menu" onKeyDown={onKeyDown}>
      {items.map((item) => {
        const className = cn('sf-menu__item', item.selected && 'sf-menu__item--selected');
        const glyph = item.icon ? (
          <span className="sf-menu__icon" aria-hidden>
            {item.icon}
          </span>
        ) : null;

        if (item.href) {
          return (
            <a key={item.id} role="menuitem" tabIndex={-1} href={item.href} className={className} onClick={close}>
              {glyph}
              {item.label}
            </a>
          );
        }
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            tabIndex={-1}
            aria-disabled={item.disabled || undefined}
            disabled={item.disabled}
            className={className}
            onClick={() => {
              item.onSelect?.();
              close();
            }}
          >
            {glyph}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function DropdownMenu(props: DropdownMenuProps): ReactElement {
  const { trigger, items, placement = 'bottom-start', label } = props;
  const menuTrigger = cloneElement(trigger, { 'aria-haspopup': 'menu' });
  return (
    <Popover trigger={menuTrigger} placement={placement} role="none">
      {(close) => <MenuList items={items} label={label} close={close} />}
    </Popover>
  );
}
