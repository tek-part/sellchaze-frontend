/**
 * WishlistButton — save / unsave a product. Outline heart at rest; filled `--sale` with a gentle
 * 1.15 pop when active (the one duotone icon the theme allows). Toggle is optimistic — the caller
 * updates `active` immediately and reconciles on the server response. See §32.3.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { IconHeart } from './icons';
import { Spinner } from './Spinner';

export interface WishlistButtonProps {
  active: boolean;
  onToggle: () => void;
  loading?: boolean;
  /** Optional visible label (defaults to icon-only). */
  labelledText?: string;
  className?: string;
}

export function WishlistButton(props: WishlistButtonProps): ReactElement {
  const { active, onToggle, loading = false, labelledText, className } = props;
  const { t } = useTranslation();
  const label = active ? t('product.removeFromWishlist') : t('product.addToWishlist');
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={labelledText ? undefined : label}
      title={label}
      disabled={loading}
      className={cn('sf-icon-btn', 'sf-wishlist', active && 'sf-wishlist--active', className)}
      onClick={onToggle}
    >
      <span className="sf-wishlist__glyph" aria-hidden>
        {loading ? <Spinner aria-hidden /> : <IconHeart className="sf-wishlist__heart" filled={active} />}
      </span>
      {labelledText ? <span className="sf-wishlist__text">{labelledText}</span> : null}
    </button>
  );
}
