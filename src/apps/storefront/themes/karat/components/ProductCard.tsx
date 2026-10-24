/**
 * Karat product card — a vitrine card: a tall image that slowly cross-fades to the second frame on
 * hover, a quiet wishlist mark, the maker in small caps, the name in the display serif, the jewellery
 * spec line (karat · metal · weight, only when the product carries them) and the price. "Add to bag"
 * is a discreet text button. Theme settings gate the spec line, maker, ratings and quick add.
 */
import { useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { useThemeSettings } from '../../../theme-engine/context';
import { CardVariantPicker, useCardPurchase } from '../../../foundation/components/CardVariantPicker';
import { useWishlist } from '../../../state/wishlist';
import { LibImage, LibPrice, LibRating, useLibT, useLocaleCode } from '../../../sections-lib';
import { jewelSpecs, specLine } from './specs';
import { krText } from './i18n';

export interface KaratProductCardProps {
  product: ProductCardModel;
  showBadges?: boolean;
  showRatings?: boolean;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  eager?: boolean;
  sizes?: string;
}

export function KaratProductCard(props: KaratProductCardProps): ReactElement {
  const { product, showBadges = true, showRatings = true, showQuickAdd = true, showWishlist = true, eager, sizes } = props;
  const t = useLibT();
  const locale = useLocaleCode();
  const settings = useThemeSettings();
  const purchase = useCardPurchase(product);
  const wishlist = useWishlist();
  const [added, setAdded] = useState(false);

  const onSale = typeof purchase.compareAt === 'number' && purchase.compareAt > purchase.price;
  const discount = onSale && purchase.compareAt ? Math.round((1 - purchase.price / purchase.compareAt) * 100) : 0;
  const wished = wishlist.has(product.id);
  const specs = settings['show_specs'] !== false ? specLine(jewelSpecs(product)) : [];
  const vendor = settings['show_vendor'] !== false ? product.vendor : undefined;
  const ratings = showRatings && settings['show_ratings'] === true && typeof product.rating === 'number';
  const quickAdd = showQuickAdd && settings['show_quick_add'] !== false && !product.soldOut;

  const add = (): void => {
    if (!purchase.add()) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className={cn('kr-card', product.soldOut && 'kr-card--soldout', product.hoverImage && 'kr-card--has-hover')}>
      <div className="kr-card__frame">
        <a href={product.url} className="kr-card__media" tabIndex={-1} aria-hidden>
          <LibImage
            src={product.image?.src}
            srcSet={product.image?.srcSet}
            sizes={sizes ?? product.image?.sizes ?? '(min-width: 1280px) 300px, (min-width: 768px) 30vw, 50vw'}
            alt=""
            eager={eager}
            monogram={product.title.charAt(0)}
            className="kr-card__img"
          />
          {product.hoverImage ? <LibImage src={product.hoverImage.src} alt="" sizes="(min-width: 1280px) 300px, (min-width: 768px) 30vw, 50vw" className="kr-card__img kr-card__img--hover" /> : null}
        </a>
        {showBadges ? (
          <div className="kr-card__badges">
            {product.soldOut ? <span className="kr-badge kr-badge--muted">{t('soldOut')}</span> : null}
            {!product.soldOut && discount > 0 ? <span className="kr-badge kr-badge--sale">−{discount}%</span> : null}
            {!product.soldOut && product.badge && discount === 0 ? <span className="kr-badge">{product.badge}</span> : null}
          </div>
        ) : null}
        {showWishlist ? (
          <button
            type="button"
            className={cn('kr-card__wish', wished && 'is-active')}
            aria-pressed={wished}
            aria-label={`${wished ? t('removeFromWishlist') : t('addToWishlist')}: ${product.title}`}
            onClick={() => wishlist.toggle(product.id)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" aria-hidden>
              <path d="M12 20.5s-7.2-4.5-9.1-9C1.6 8.3 3.4 5 6.8 5c2 0 3.5 1.1 5.2 3 1.7-1.9 3.2-3 5.2-3 3.4 0 5.2 3.3 3.9 6.5-1.9 4.5-9.1 9-9.1 9z" />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="kr-card__body">
        {vendor ? <span className="kr-card__vendor">{vendor}</span> : null}
        <h3 className="kr-card__name">
          <a href={product.url} className="kr-card__link">{product.title}</a>
        </h3>
        {specs.length > 0 ? (
          <p className="kr-card__specs">
            <span className="lib-sr-only">{krText(locale, 'specs')}: </span>
            {specs.map((s, i) => (
              <span key={s} className="kr-card__spec">{i > 0 ? <span className="kr-card__dot" aria-hidden>·</span> : null}<bdi>{s}</bdi></span>
            ))}
          </p>
        ) : null}
        {ratings ? <LibRating value={product.rating!} count={product.reviewCount} showCount /> : null}
        <LibPrice amount={purchase.price} compareAt={purchase.compareAt} currency={product.currency} className="kr-card__price" />
        {quickAdd ? (
          <div className="kr-card__buy">
            <CardVariantPicker product={product} value={purchase.variantId} onChange={purchase.choose} atLimit={purchase.input !== null && !purchase.canAdd} />
            <button type="button" disabled={!purchase.canAdd} className={cn('kr-card__add', added && 'is-added')} onClick={add} aria-live="polite">
              <span>{added ? krText(locale, 'addedToBag') : krText(locale, 'addToBag')}</span>
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
