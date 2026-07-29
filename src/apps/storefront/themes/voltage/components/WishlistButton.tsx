/** Voltage WishlistButton — heart toggle; filled hot-rose + pop when active. */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { IconHeart } from './icons';

export interface WishlistButtonProps { active: boolean; onToggle: () => void; className?: string; }
export function WishlistButton(props: WishlistButtonProps): ReactElement {
  const { active, onToggle, className } = props;
  const { t } = useTranslation();
  const label = active ? t('product.removeFromWishlist') : t('product.addToWishlist');
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn('vlt-icon-btn', 'vlt-wish', active && 'vlt-wish--active', className)}
      onClick={onToggle}
    >
      <IconHeart className="vlt-wish__heart" filled={active} aria-hidden />
    </button>
  );
}
