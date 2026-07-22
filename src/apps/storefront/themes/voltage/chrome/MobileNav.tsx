/**
 * Voltage MobileNav — the small-screen menu in a left Drawer. Top-level nav links (+ one level of
 * children) and a search shortcut. Closes on navigate. Voltage's own chrome.
 */
import type { ReactElement } from 'react';
import type { NavItem } from '../../../types/navigation';
import { Drawer } from '../components/Drawer';
import { IconSearch } from '../components/icons';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: ReadonlyArray<NavItem>;
  onSearchOpen: () => void;
}

export function MobileNav(props: MobileNavProps): ReactElement {
  const { open, onClose, items, onSearchOpen } = props;
  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu" className="vlt-mobilenav-drawer">
      <button
        type="button"
        className="vlt-mobilenav__search"
        onClick={() => { onClose(); onSearchOpen(); }}
      >
        <span aria-hidden><IconSearch /></span>
        Search
      </button>
      <nav aria-label="Mobile" className="vlt-mobilenav__nav">
        {items.map((item) => (
          <div key={item.label} className="vlt-mobilenav__group">
            <a href={item.url} className="vlt-mobilenav__link" onClick={onClose}>{item.label}</a>
            {item.children && item.children.length > 0 ? (
              <div className="vlt-mobilenav__sub">
                {item.children.map((child) => (
                  <a key={child.label} href={child.url} className="vlt-mobilenav__sublink" onClick={onClose}>{child.label}</a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </Drawer>
  );
}
