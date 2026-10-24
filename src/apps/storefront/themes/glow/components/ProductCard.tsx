/**
 * Glow product card — portrait (or square) image on a soft tile, brand eyebrow, serif name, a meta
 * line with size/volume and a compact rating, price, and a round quick-add button that sits on the
 * image (label expands on hover; always visible on touch). Variant products keep the platform's
 * card variant picker so the quick add knows which size to put in the bag.
 */
import { useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { useThemeSettings } from '../../../theme-engine/context';
import { CardVariantPicker, useCardPurchase } from '../../../foundation/components/CardVariantPicker';
import { useWishlist } from '../../../state/wishlist';
import { LibImage, LibPrice, useLibT, useLocaleCode } from '../../../sections-lib';
import { IconCheck, IconHeart, IconPlus } from '../chrome/icons';
import { glText } from './i18n';
import { sizeLabel } from './size';

export interface GlProductCardProps {
  product: ProductCardModel;
  showBadges?: boolean;
  showRatings?: boolean;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  eager?: boolean;
  sizes?: string;
  className?: string;
}

export function formatCount(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
}

export function formatRating(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
  } catch {
    return n.toFixed(1);
  }
}

export function GlProductCard(props: GlProductCardProps): ReactElement {
  const { product, showBadges = true, showRatings = true, showQuickAdd = true, showWishlist = true, eager, sizes, className } = props;
  const t = useLibT();
  const locale = useLocaleCode();
  const settings = useThemeSettings();
  const purchase = useCardPurchase(product);
  const wishlist = useWishlist();
  const [added, setAdded] = useState(false);

  const onSale = typeof purchase.compareAt === 'number' && purchase.compareAt > purchase.price;
  const discount = onSale && purchase.compareAt ? Math.round((1 - purchase.price / purchase.compareAt) * 100) : 0;
  const wished = wishlist.has(product.id);
  const size = settings['show_size'] !== false ? sizeLabel(product, locale) : '';
  const vendor = settings['show_vendor'] !== false ? product.vendor : '';
  const ratings = showRatings && settings['show_ratings'] !== false && typeof product.rating === 'number' && product.rating > 0;
  const quick = showQuickAdd && settings['show_quick_add'] !== false && !product.soldOut;
  const needsChoice = Boolean(product.variants?.length) && !purchase.variantId;

  const quickAdd = (): void => {
    if (!purchase.add()) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className={cn('gl-card', product.soldOut && 'is-soldout', className)}>
      <div className="gl-card__media">
        <a href={product.url} className="gl-card__frame" tabIndex={-1} aria-hidden>
          <LibImage src={product.image?.src} srcSet={product.image?.srcSet} sizes={sizes ?? product.image?.sizes ?? '(min-width: 1280px) 22vw, (min-width: 640px) 33vw, 50vw'} alt="" eager={eager} monogram={product.title.charAt(0)} className="gl-card__img" />
          {product.hoverImage ? <LibImage src={product.hoverImage.src} sizes={sizes ?? '(min-width: 1280px) 22vw, (min-width: 640px) 33vw, 50vw'} alt="" className="gl-card__img gl-card__img--hover" /> : null}
        </a>
        {showBadges ? (
          <div className="gl-card__badges">
            {product.soldOut ? <span className="gl-badge gl-badge--muted">{t('soldOut')}</span> : null}
            {!product.soldOut && discount > 0 ? <span className="gl-badge gl-badge--sale"><bdi dir="ltr">−{formatCount(discount, locale)}%</bdi></span> : null}
            {product.badge && !(discount > 0 && /%/.test(product.badge)) ? <span className="gl-badge">{product.badge}</span> : null}
          </div>
        ) : null}
        {showWishlist ? (
          <button
            type="button"
            className={cn('gl-card__wish', wished && 'is-active')}
            aria-pressed={wished}
            aria-label={wished ? t('removeFromWishlist') : t('addToWishlist')}
            onClick={() => wishlist.toggle(product.id)}
          >
            <IconHeart width={18} height={18} fill={wished ? 'currentColor' : 'none'} />
          </button>
        ) : null}
        {quick ? (
          <button
            type="button"
            className={cn('gl-card__quick', added && 'is-added')}
            onClick={quickAdd}
            disabled={!purchase.canAdd}
            aria-label={needsChoice ? `${glText(locale, 'chooseOptions')}: ${product.title}` : `${glText(locale, 'addToBag')}: ${product.title}`}
            title={needsChoice ? glText(locale, 'chooseOptions') : undefined}
          >
            {added ? <IconCheck width={18} height={18} /> : <IconPlus width={18} height={18} />}
            <span className="gl-card__quick-label" aria-hidden>{added ? glText(locale, 'added') : glText(locale, 'quickAdd')}</span>
          </button>
        ) : null}
        {added ? <span className="lib-sr-only" role="status">{glText(locale, 'added')}</span> : null}
      </div>
      <div className="gl-card__body">
        {vendor ? <span className="gl-card__vendor">{vendor}</span> : null}
        <h3 className="gl-card__name">
          <a href={product.url} className="gl-card__link">{product.title}</a>
        </h3>
        {size || ratings ? (
          <p className="gl-card__meta">
            {size ? <span className="gl-card__size"><span className="lib-sr-only">{glText(locale, 'size')}: </span>{size}</span> : null}
            {ratings ? (
              <span className="gl-card__rating" aria-label={glText(locale, 'ratingLabel', { r: formatRating(product.rating!, locale) })}>
                <span aria-hidden className="gl-card__star">★</span>
                <span aria-hidden>{formatRating(product.rating!, locale)}</span>
                {product.reviewCount ? <span aria-hidden className="gl-card__count">({formatCount(product.reviewCount, locale)})</span> : null}
              </span>
            ) : null}
          </p>
        ) : null}
        {quick && product.variants?.length ? (
          <CardVariantPicker product={product} value={purchase.variantId} onChange={purchase.choose} atLimit={purchase.input !== null && !purchase.canAdd} />
        ) : null}
        <LibPrice amount={purchase.price} compareAt={purchase.compareAt} currency={product.currency} className="gl-card__price" />
      </div>
    </article>
  );
}
