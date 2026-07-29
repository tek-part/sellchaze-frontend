/**
 * WishlistButton — save-to-wishlist toggle wired to the shared wishlist state (real, persistent).
 * Heart fills + warms when saved; `aria-pressed` + a labelled action carry the state to assistive
 * tech (never colour-only). Used on cards and the PDP.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { useWishlist } from '../../../state/wishlist';
import { HeartIcon } from './icons';

export interface WishlistButtonProps {
  productId: string;
  title: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function WishlistButton(props: WishlistButtonProps): ReactElement {
  const { productId, title, size = 'md', className } = props;
  const { t } = useTranslation();
  const wishlist = useWishlist();
  const saved = wishlist.has(productId);

  return (
    <button
      type="button"
      className={cn('hh-wishlist-btn', `hh-wishlist-btn--${size}`, saved && 'hh-wishlist-btn--saved', className)}
      aria-pressed={saved}
      aria-label={saved ? t('product.removeFromWishlistNamed', { title }) : t('product.saveToWishlist', { title })}
      onClick={() => wishlist.toggle(productId)}
    >
      <span className="hh-wishlist-btn__glyph" aria-hidden>
        <HeartIcon />
      </span>
    </button>
  );
}
