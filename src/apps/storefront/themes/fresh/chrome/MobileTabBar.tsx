/**
 * Fresh MobileTabBar — the sticky bottom tab bar on phones/tablets (< 1024px): Home · Categories
 * (opens the menu drawer) · Basket (opens the cart drawer, with a count) · Account. Hidden when the
 * merchant turns `show_mobile_tabbar` off; `theme.css` pads the page bottom so nothing hides
 * behind it.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { useCart } from '../../../state/cart';
import { IconBasket, IconGrid, IconHome, IconUser } from './icons';

export interface MobileTabBarProps {
  onCategoriesOpen: () => void;
  onCartOpen: () => void;
}

function isCurrent(path: string): boolean {
  if (typeof window === 'undefined') return false;
  const here = window.location.pathname.replace(/\/+$/, '') || '/';
  return path === '/' ? here === '/' : here.startsWith(path);
}

export function MobileTabBar(props: MobileTabBarProps): ReactElement {
  const { onCategoriesOpen, onCartOpen } = props;
  const { t } = useTranslation();
  const { totals } = useCart();
  const preview = typeof window !== 'undefined' && window.location.search.includes('preview=1') ? '?preview=1' : '';

  return (
    <nav className="fr-tabbar" aria-label={t('nav.mobileNav')}>
      <a href={`/${preview}`} className={cn('fr-tabbar__item', isCurrent('/') && 'is-current')} aria-current={isCurrent('/') ? 'page' : undefined}>
        <IconHome />
        <span>{t('nav.home')}</span>
      </a>
      <button type="button" className="fr-tabbar__item" onClick={onCategoriesOpen}>
        <IconGrid />
        <span>{t('nav.categories')}</span>
      </button>
      <button type="button" className="fr-tabbar__item fr-tabbar__item--cart" onClick={onCartOpen} aria-label={t('header.cartWithCount', { count: totals.count })}>
        <span className="fr-tabbar__icon">
          <IconBasket />
          {totals.count > 0 ? <span className="fr-tabbar__count" aria-hidden>{totals.count}</span> : null}
        </span>
        <span aria-hidden>{t('header.cart')}</span>
      </button>
      <a href={`/account${preview}`} className={cn('fr-tabbar__item', isCurrent('/account') && 'is-current')} aria-current={isCurrent('/account') ? 'page' : undefined}>
        <IconUser />
        <span>{t('header.account')}</span>
      </a>
    </nav>
  );
}
