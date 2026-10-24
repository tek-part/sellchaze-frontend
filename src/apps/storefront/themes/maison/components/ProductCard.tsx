/**
 * Maison product card — a soft, rounded portrait frame (ratio from `card_ratio`), an always-visible
 * wishlist heart, small pill badges, then vendor, title, the "material · dimensions" line (when the
 * product carries one), rating, price and a quiet quick-add. Keeps the `lib-card` hooks so shared
 * styles (sold-out, hover image, variant picker) and the merchant's card toggles keep working.
 */
import { useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { CardVariantPicker, useCardPurchase } from '../../../foundation/components/CardVariantPicker';
import { useWishlist } from '../../../state/wishlist';
import { LibImage, LibPrice, LibRating, useLibT } from '../../../sections-lib';
import { cardMetaLine } from './card-meta';
import { IconPlus } from '../chrome/icons';

export interface MaisonCardProps {
  product: ProductCardModel;
  showBadges?: boolean;
  showRatings?: boolean;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  eager?: boolean;
  /** `sizes` hint for the image (defaults to a 4-up grid). */
  sizes?: string;
}

export function MaisonCard(props: MaisonCardProps): ReactElement {
  const { product, showBadges = true, showRatings = true, showQuickAdd = true, showWishlist = true, eager, sizes } = props;
  const t = useLibT();
  const purchase = useCardPurchase(product);
  const wishlist = useWishlist();
  const [added, setAdded] = useState(false);

  const onSale = typeof purchase.compareAt === 'number' && purchase.compareAt > purchase.price;
  const discount = onSale && purchase.compareAt ? Math.round((1 - purchase.price / purchase.compareAt) * 100) : 0;
  const wished = wishlist.has(product.id);
  const meta = cardMetaLine(product);

  const quickAdd = (): void => {
    if (!purchase.add()) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className={cn('lib-card', 'lib-card--plain', 'mai-card', product.soldOut && 'lib-card--soldout')}>
      <div className="mai-card__frame">
        <a href={product.url} className="lib-card__media mai-card__media" tabIndex={-1} aria-hidden>
          <LibImage
            src={product.image?.src}
            srcSet={product.image?.srcSet}
            sizes={sizes ?? product.image?.sizes ?? '(min-width: 1280px) 300px, (min-width: 768px) 30vw, 46vw'}
            alt=""
            eager={eager}
            className="lib-card__img"
            monogram={product.title.charAt(0)}
          />
          {product.hoverImage ? <LibImage src={product.hoverImage.src} alt="" sizes="(min-width: 1280px) 300px, (min-width: 768px) 30vw, 46vw" className="lib-card__img lib-card__img--hover" /> : null}
        </a>
        {showBadges ? (
          <div className="lib-card__badges mai-card__badges">
            {product.soldOut ? <span className="lib-badge lib-badge--muted">{t('soldOut')}</span> : null}
            {!product.soldOut && discount > 0 ? <span className="lib-badge lib-badge--sale">-{discount}%</span> : null}
            {product.badge ? <span className="lib-badge">{product.badge}</span> : null}
          </div>
        ) : null}
        {showWishlist ? (
          <button
            type="button"
            className={cn('mai-card__wish', wished && 'is-active')}
            aria-pressed={wished}
            aria-label={`${wished ? t('removeFromWishlist') : t('addToWishlist')}: ${product.title}`}
            onClick={() => wishlist.toggle(product.id)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden focusable="false">
              <path d="M12 20s-7-4.4-8.6-8.8C2.3 8 4.2 5 7.3 5c1.9 0 3.3 1 4.7 2.8C13.4 6 14.8 5 16.7 5c3.1 0 5 3 3.9 6.2C19 15.6 12 20 12 20z" />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="lib-card__body mai-card__body">
        {product.vendor ? <span className="lib-card__vendor mai-card__vendor">{product.vendor}</span> : null}
        <h3 className="lib-card__name mai-card__name">
          <a href={product.url} className="lib-card__link">{product.title}</a>
        </h3>
        {meta ? <p className="mai-card__meta">{meta}</p> : null}
        {showRatings && typeof product.rating === 'number' ? <LibRating value={product.rating} count={product.reviewCount} showCount /> : null}
        <div className="lib-card__row mai-card__row">
          <LibPrice amount={purchase.price} compareAt={purchase.compareAt} currency={product.currency} className="mai-card__price" />
        </div>
        {showQuickAdd && !product.soldOut ? (
          <>
            <CardVariantPicker product={product} value={purchase.variantId} onChange={purchase.choose} atLimit={purchase.input !== null && !purchase.canAdd} />
            <button type="button" disabled={!purchase.canAdd} className={cn('lib-card__add', 'mai-card__add', added && 'is-added')} onClick={quickAdd} aria-live="polite">
              <span>{added ? t('added') : t('addToCart')}</span>
              {added ? null : <IconPlus width={14} height={14} />}
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}
