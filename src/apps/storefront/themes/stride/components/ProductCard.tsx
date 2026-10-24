/**
 * Stride product card — the library card's markup (`lib-card` keeps the shared purchase behaviour,
 * variant picker and the merchant's card toggles) re-cut for sport retail: a flat image tile, stacked
 * badges (new · −% · low stock / sold out), colour dots from the product's colour options and a
 * heavy price line. Theme settings gate the dots, the "new" highlight and the low-stock badge.
 */
import { useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { useThemeSettings } from '../../../theme-engine/context';
import { CardVariantPicker, useCardPurchase } from '../../../foundation/components/CardVariantPicker';
import { useWishlist } from '../../../state/wishlist';
import { LibImage, LibPrice, LibRating, useLibT, useLocaleCode } from '../../../sections-lib';
import { cardSwatches, isNewProduct, lowStockCount } from './card-model';
import { stText } from './i18n';

export interface StProductCardProps {
  product: ProductCardModel;
  showBadges?: boolean;
  showRatings?: boolean;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  eager?: boolean;
  /** `card` (grid), `list` (horizontal), `feature` (large first tile). */
  variant?: 'card' | 'list' | 'feature';
  sizes?: string;
}

const MAX_DOTS = 5;

export function StProductCard(props: StProductCardProps): ReactElement {
  const { product, showBadges = true, showRatings = true, showQuickAdd = true, showWishlist = true, eager, variant = 'card', sizes } = props;
  const t = useLibT();
  const locale = useLocaleCode();
  const settings = useThemeSettings();
  const purchase = useCardPurchase(product);
  const wishlist = useWishlist();
  const [added, setAdded] = useState(false);

  const onSale = typeof purchase.compareAt === 'number' && purchase.compareAt > purchase.price;
  const discount = onSale && purchase.compareAt ? Math.round((1 - purchase.price / purchase.compareAt) * 100) : 0;
  const wished = wishlist.has(product.id);
  const isNew = settings['show_new_badge'] !== false && isNewProduct(product);
  const threshold = typeof settings['low_stock_threshold'] === 'number' ? settings['low_stock_threshold'] : 5;
  const low = settings['show_low_stock'] !== false ? lowStockCount(product, threshold) : null;
  const swatches = settings['show_swatches'] !== false ? cardSwatches(product) : [];
  const extraDots = Math.max(0, swatches.length - MAX_DOTS);
  // The free-text badge is shown unless it is the "new" label we already highlight, or a "Save x%"
  // label the computed discount badge already says.
  const plainBadge = product.badge && !isNewProduct(product) && !(discount > 0 && /\d+\s*%/.test(product.badge)) ? product.badge : '';

  const quickAdd = (): void => {
    if (!purchase.add()) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const imageSizes = sizes ?? product.image?.sizes ?? (variant === 'feature' ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1280px) 22vw, (min-width: 640px) 33vw, 50vw');

  return (
    <article className={cn('lib-card', 'lib-card--card', 'st-card', `st-card--${variant}`, variant === 'list' && 'lib-card--list', product.soldOut && 'lib-card--soldout', onSale && 'st-card--sale')}>
      <a href={product.url} className="lib-card__media st-card__media" tabIndex={-1} aria-hidden>
        <LibImage src={product.image?.src} srcSet={product.image?.srcSet} sizes={imageSizes} alt="" eager={eager} className="lib-card__img" monogram={product.title.charAt(0)} />
        {product.hoverImage ? <LibImage src={product.hoverImage.src} alt="" sizes={imageSizes} className="lib-card__img lib-card__img--hover" /> : null}
      </a>
      {showBadges ? (
        <div className="lib-card__badges st-card__badges">
          {product.soldOut ? <span className="st-badge st-badge--muted">{t('soldOut')}</span> : null}
          {!product.soldOut && isNew ? <span className="st-badge st-badge--new">{stText(locale, 'newBadge')}</span> : null}
          {!product.soldOut && discount > 0 ? <span className="st-badge st-badge--sale">−{discount}%</span> : null}
          {plainBadge ? <span className="st-badge st-badge--plain">{plainBadge}</span> : null}
          {low !== null ? <span className="st-badge st-badge--low">{stText(locale, 'lowStock', { n: low })}</span> : null}
        </div>
      ) : null}
      {showWishlist ? (
        <button
          type="button"
          className={cn('lib-card__wish', 'st-card__wish', wished && 'is-active')}
          aria-pressed={wished}
          aria-label={wished ? t('removeFromWishlist') : t('addToWishlist')}
          onClick={() => wishlist.toggle(product.id)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 21s-7-4.6-9.3-9.2C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.2 2.4C11.6 6.1 13 5 15 5c3.6 0 5.4 3.6 3.9 6.8C19 16.4 12 21 12 21z" />
          </svg>
        </button>
      ) : null}
      <div className="lib-card__body st-card__body">
        {product.vendor || product.categoryName ? <span className="lib-card__vendor st-card__kicker">{product.vendor || product.categoryName}</span> : null}
        <h3 className="lib-card__name st-card__name">
          <a href={product.url} className="lib-card__link">{product.title}</a>
        </h3>
        {swatches.length > 0 ? (
          <span className="st-dots" role="img" aria-label={`${stText(locale, 'colours')}: ${swatches.map((s) => s.label).join(locale.startsWith('ar') ? '، ' : ', ')}`}>
            {swatches.slice(0, MAX_DOTS).map((s) => (
              <span key={s.label} className={cn('st-dot', !s.available && 'is-out')} style={{ background: s.color }} title={s.label} />
            ))}
            {extraDots > 0 ? <span className="st-dots__more">{stText(locale, 'moreColours', { n: extraDots })}</span> : null}
          </span>
        ) : null}
        {showRatings && typeof product.rating === 'number' ? <LibRating value={product.rating} count={product.reviewCount} showCount /> : null}
        {variant !== 'card' && product.description ? <p className="lib-card__desc">{product.description}</p> : null}
        <div className="lib-card__row st-card__row">
          <LibPrice amount={purchase.price} compareAt={purchase.compareAt} currency={product.currency} className="st-card__price" />
        </div>
        {showQuickAdd && !product.soldOut ? (
          <>
            <CardVariantPicker product={product} value={purchase.variantId} onChange={purchase.choose} atLimit={purchase.input !== null && !purchase.canAdd} />
            <button type="button" disabled={!purchase.canAdd} className={cn('lib-card__add', 'st-card__add', added && 'is-added')} onClick={quickAdd} aria-live="polite">
              {added ? t('added') : t('addToCart')}
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}
