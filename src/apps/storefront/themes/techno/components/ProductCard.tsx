/**
 * Techno product card — the library card's markup (`lib-card` classes keep the shared styling and
 * the merchant's card toggles) plus spec chips under the name and a compare toggle beside the
 * wishlist heart. Theme-level `show_spec_chips` / `show_compare` gate the extras.
 */
import { useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { useThemeSettings } from '../../../theme-engine/context';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { LibImage, LibPrice, LibRating, useLibT, useLocaleCode } from '../../../sections-lib';
import { productSpecs, useCompare } from './compare';
import { tkText } from './i18n';
import { IconCompare } from '../chrome/icons';

export interface TkProductCardProps {
  product: ProductCardModel;
  showBadges?: boolean;
  showRatings?: boolean;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  eager?: boolean;
}

export function TkProductCard(props: TkProductCardProps): ReactElement {
  const { product, showBadges = true, showRatings = true, showQuickAdd = true, showWishlist = true, eager } = props;
  const t = useLibT();
  const locale = useLocaleCode();
  const settings = useThemeSettings();
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const [added, setAdded] = useState(false);

  const onSale = typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price;
  const discount = onSale && product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  const wished = wishlist.has(product.id);
  const compared = compare.has(product.id);
  const compareFull = !compared && compare.count >= compare.max;
  const specs = settings['show_spec_chips'] !== false ? productSpecs(product) : [];
  const showCompare = settings['show_compare'] !== false;

  const quickAdd = (): void => {
    cart.add({
      id: `${product.id}:default`,
      productId: product.id,
      title: product.title,
      url: product.url,
      ...(product.image ? { image: product.image.src } : {}),
      price: product.price,
      currency: product.currency,
      quantity: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className={cn('lib-card', 'lib-card--card', 'tk-card', product.soldOut && 'lib-card--soldout', onSale && 'tk-card--sale')}>
      <a href={product.url} className="lib-card__media" tabIndex={-1} aria-hidden>
        <LibImage src={product.image?.src} srcSet={product.image?.srcSet} sizes={product.image?.sizes ?? '(min-width: 1024px) 20vw, 50vw'} alt="" eager={eager} className="lib-card__img" />
        {product.hoverImage ? <LibImage src={product.hoverImage.src} alt="" className="lib-card__img lib-card__img--hover" /> : null}
      </a>
      {showBadges ? (
        <div className="lib-card__badges">
          {product.soldOut ? <span className="lib-badge lib-badge--muted">{t('soldOut')}</span> : null}
          {!product.soldOut && discount > 0 ? <span className="lib-badge lib-badge--sale">-{discount}%</span> : null}
          {product.badge ? <span className="lib-badge">{product.badge}</span> : null}
        </div>
      ) : null}
      <div className="tk-card__tools">
        {showWishlist ? (
          <button
            type="button"
            className={cn('lib-card__wish', 'tk-card__tool', wished && 'is-active')}
            aria-pressed={wished}
            aria-label={wished ? t('removeFromWishlist') : t('addToWishlist')}
            onClick={() => wishlist.toggle(product.id)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M12 21s-7-4.6-9.3-9.2C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.2 2.4C11.6 6.1 13 5 15 5c3.6 0 5.4 3.6 3.9 6.8C19 16.4 12 21 12 21z" />
            </svg>
          </button>
        ) : null}
        {showCompare ? (
          <button
            type="button"
            className={cn('tk-card__compare', 'tk-card__tool', compared && 'is-active')}
            aria-pressed={compared}
            aria-label={compared ? tkText(locale, 'removeFromCompare') : tkText(locale, 'addToCompare')}
            title={compareFull ? tkText(locale, 'compareFull') : compared ? tkText(locale, 'removeFromCompare') : tkText(locale, 'addToCompare')}
            aria-disabled={compareFull || undefined}
            onClick={() => compare.toggle(product)}
          >
            <IconCompare width={18} height={18} />
          </button>
        ) : null}
      </div>
      <div className="lib-card__body">
        {product.vendor ? <span className="lib-card__vendor">{product.vendor}</span> : null}
        <h3 className="lib-card__name">
          <a href={product.url} className="lib-card__link">{product.title}</a>
        </h3>
        {specs.length > 0 ? (
          <ul className="tk-card__specs" aria-label={tkText(locale, 'specs')}>
            {specs.map((spec) => (
              <li key={spec} className="tk-chip">{spec}</li>
            ))}
          </ul>
        ) : null}
        {showRatings && typeof product.rating === 'number' ? <LibRating value={product.rating} count={product.reviewCount} showCount /> : null}
        <div className="lib-card__row tk-card__row">
          <LibPrice amount={product.price} compareAt={product.compareAtPrice} currency={product.currency} className="tk-card__price" />
        </div>
        {showQuickAdd && !product.soldOut ? (
          <button type="button" className={cn('lib-card__add', added && 'is-added')} onClick={quickAdd} aria-live="polite">
            {added ? t('added') : t('addToCart')}
          </button>
        ) : null}
      </div>
    </article>
  );
}
