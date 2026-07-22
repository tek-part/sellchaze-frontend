/**
 * MobileNav — full navigation in a Drawer for small screens. Serif category list; sub-levels use an
 * Accordion. Account / search / wishlist grouped below. Large thumb-reachable targets. §32.8.
 */
import type { ReactElement } from 'react';
import { Drawer } from '../components/Drawer';
import { Accordion, type AccordionItemData } from '../components/Accordion';
import { Button } from '../components/Button';
import type { NavItem } from '../../../types/navigation';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: ReadonlyArray<NavItem>;
  accountUrl?: string;
  onSearchOpen: () => void;
}

export function MobileNav(props: MobileNavProps): ReactElement {
  const { open, onClose, items, accountUrl = '/account', onSearchOpen } = props;

  const accordionItems: AccordionItemData[] = items
    .filter((item) => item.children && item.children.length > 0)
    .map((item) => ({
      id: item.label,
      header: item.label,
      content: (
        <div className="sf-mobilenav__sub">
          {item.children?.map((child) => (
            <a key={child.url} href={child.url} className="sf-mobilenav__link" onClick={onClose}>
              {child.label}
            </a>
          ))}
        </div>
      ),
    }));

  const leaves = items.filter((item) => !item.children || item.children.length === 0);

  return (
    <Drawer open={open} onClose={onClose} side="start" title="Menu">
      <div className="sf-overlay__body">
        <nav className="sf-mobilenav" aria-label="Mobile">
          {leaves.map((item) => (
            <a key={item.url} href={item.url} className="sf-mobilenav__link" onClick={onClose}>
              {item.label}
            </a>
          ))}
          {accordionItems.length > 0 ? <Accordion items={accordionItems} type="multi" /> : null}
        </nav>
        <div className="sf-mobilenav__actions">
          <Button variant="secondary" block onClick={() => { onClose(); onSearchOpen(); }}>
            Search
          </Button>
          <a href={accountUrl} className="sf-btn sf-btn--ghost sf-btn--md" onClick={onClose}>
            <span className="sf-btn__label">Account</span>
          </a>
        </div>
      </div>
    </Drawer>
  );
}
