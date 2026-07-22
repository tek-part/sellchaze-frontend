/**
 * Navigation — desktop primary nav. Leaf items are links with the gold underline-wipe; items with
 * children open an accessible dropdown of sub-links. Keyboard- and hover-navigable. §32.6/§32.8.
 */
import type { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { DropdownMenu } from '../components/DropdownMenu';
import type { NavItem } from '../../../types/navigation';

export interface NavigationProps {
  items: ReadonlyArray<NavItem>;
}

export function Navigation(props: NavigationProps): ReactElement {
  const { items } = props;
  const { pathname } = useLocation();
  const isActive = (url: string): boolean => url !== '/' && pathname.startsWith(url);

  return (
    <nav className="sf-header__nav" aria-label="Primary">
      {items.map((item) =>
        item.children && item.children.length > 0 ? (
          <DropdownMenu
            key={item.label}
            label={item.label}
            trigger={
              <button type="button" className="sf-nav-link">
                {item.label}
              </button>
            }
            items={item.children.map((child) => ({ id: child.url, label: child.label, href: child.url }))}
          />
        ) : (
          <a key={item.label} href={item.url} className="sf-nav-link" aria-current={isActive(item.url) ? 'page' : undefined}>
            {item.label}
          </a>
        ),
      )}
    </nav>
  );
}
