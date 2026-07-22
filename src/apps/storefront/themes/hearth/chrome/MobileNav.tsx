/**
 * MobileNav — the off-canvas navigation drawer for small screens. Room list (with nested children
 * as native <details> accordions, keyboard- and no-JS-friendly) plus utility links. Focus-trapped,
 * scroll-locked, Escape-to-close.
 */
import type { ReactElement } from 'react';
import type { NavItem } from '../../../types/navigation';
import { Portal } from '../components/overlay/Portal';
import { useOverlay } from '../components/overlay/useOverlay';
import { IconButton } from '../components/IconButton';
import { CloseIcon } from '../components/icons';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: ReadonlyArray<NavItem>;
  onSearchOpen?: () => void;
}

export function MobileNav(props: MobileNavProps): ReactElement | null {
  const { open, onClose, items, onSearchOpen } = props;
  const ref = useOverlay<HTMLDivElement>(open, onClose);
  if (!open) return null;

  return (
    <Portal>
      <div className="hh-mobilenav" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="hh-mobilenav__scrim" onClick={onClose} />
        <div className="hh-mobilenav__panel" ref={ref}>
          <div className="hh-mobilenav__head">
            <span className="hh-mobilenav__title">Menu</span>
            <IconButton label="Close menu" icon={<CloseIcon />} onClick={onClose} />
          </div>

          {onSearchOpen ? (
            <button
              type="button"
              className="hh-mobilenav__search"
              onClick={() => {
                onClose();
                onSearchOpen();
              }}
            >
              Search…
            </button>
          ) : null}

          <nav className="hh-mobilenav__nav" aria-label="Primary">
            <ul className="hh-mobilenav__list">
              {items.map((item) =>
                item.children && item.children.length > 0 ? (
                  <li key={item.url}>
                    <details className="hh-mobilenav__group">
                      <summary className="hh-mobilenav__summary">{item.label}</summary>
                      <ul className="hh-mobilenav__sublist">
                        {item.children.map((child) => (
                          <li key={child.url}>
                            <a href={child.url} className="hh-mobilenav__sublink">
                              {child.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ) : (
                  <li key={item.url}>
                    <a href={item.url} className="hh-mobilenav__link">
                      {item.label}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="hh-mobilenav__utility">
            <a href="/account">Account</a>
            <a href="/wishlist">Saved</a>
            <a href="/cart">Bag</a>
          </div>
        </div>
      </div>
    </Portal>
  );
}
