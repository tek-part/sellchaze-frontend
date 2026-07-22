/** Voltage WishlistButton — heart toggle; filled hot-rose + pop when active. */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconHeart } from './icons';

export interface WishlistButtonProps { active: boolean; onToggle: () => void; className?: string; }
export function WishlistButton(props: WishlistButtonProps): ReactElement {
  const { active, onToggle, className } = props;
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      title={active ? 'Remove from wishlist' : 'Add to wishlist'}
      className={cn('vlt-icon-btn', 'vlt-wish', active && 'vlt-wish--active', className)}
      onClick={onToggle}
    >
      <IconHeart className="vlt-wish__heart" filled={active} aria-hidden />
    </button>
  );
}
