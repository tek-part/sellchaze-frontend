/**
 * Fresh product card — the library card's markup (`lib-card` classes, so every library skin rule
 * still applies) with the grocery affordances: a unit label under the name and a big pill quick-add
 * button that turns into a quantity stepper once the item is in the basket. The stepper is bound to
 * the shared cart store (`<id>:default` line, the same convention the library card uses), so the
 * header basket, the cart drawer and every other card stay in sync.
 */
import { type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { useThemeSettings } from '../../../theme-engine/context';
import { LibImage, LibPrice, LibRating, useLibT, useLocaleCode } from '../../../sections-lib';
import { frText } from '../chrome/text';
import { IconMinus, IconPlus } from '../chrome/icons';

export interface FreshProductCardProps {
  product: ProductCardModel;
  showBadges?: boolean;
  showRatings?: boolean;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  eager?: boolean;
}

/** Optional unit copy a catalogue mapper may attach (`unit` / `unitLabel`); not part of the base model. */
function productUnit(product: ProductCardModel): string {
  const p = product as ProductCardModel & { unit?: unknown; unitLabel?: unknown };
  if (typeof p.unitLabel === 'string' && p.unitLabel.trim()) return p.unitLabel.trim();
  if (typeof p.unit === 'string' && p.unit.trim()) return p.unit.trim();
  return '';
}

export function FreshProductCard(props: FreshProductCardProps): ReactElement {
  const { product, showBadges = true, showRatings = true, showQuickAdd = true, showWishlist = true, eager } = props;
  const t = useLibT();
  const locale = useLocaleCode();
  const settings = useThemeSettings();
  const cart = useCart();
  const wishlist = useWishlist();

  const themeQuickAdd = settings['show_quick_add'] !== false;
  const themeRatings = settings['show_ratings'] !== false;
  const showUnit = settings['show_unit_label'] !== false;
  const defaultUnit = typeof settings['default_unit_label'] === 'string' ? settings['default_unit_label'] : '';
  const unit = showUnit ? productUnit(product) || defaultUnit : '';

  const lineId = `${product.id}:default`;
  const line = cart.lines.find((l) => l.id === lineId);
  const qty = line?.quantity ?? 0;
  const onSale = typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price;
  const discount = onSale && product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  const wished = wishlist.has(product.id);

  const add = (): void => {
    cart.add({
      id: lineId,
      productId: product.id,
      title: product.title,
      url: product.url,
      ...(product.image ? { image: product.image.src } : {}),
      price: product.price,
      currency: product.currency,
      quantity: 1,
    });
  };
  const dec = (): void => cart.updateQuantity(lineId, qty - 1);

  return (
    <article className={cn('lib-card', 'lib-card--card', 'fr-card', product.soldOut && 'lib-card--soldout', qty > 0 && 'fr-card--in-basket')}>
      <a href={product.url} className="lib-card__media fr-card__media" tabIndex={-1} aria-hidden>
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
      {showWishlist ? (
        <button
          type="button"
          className={cn('lib-card__wish', wished && 'is-active')}
          aria-pressed={wished}
          aria-label={wished ? t('removeFromWishlist') : t('addToWishlist')}
          onClick={() => wishlist.toggle(product.id)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M12 21s-7-4.6-9.3-9.2C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.2 2.4C11.6 6.1 13 5 15 5c3.6 0 5.4 3.6 3.9 6.8C19 16.4 12 21 12 21z" />
          </svg>
        </button>
      ) : null}
      <div className="lib-card__body fr-card__body">
        {product.vendor ? <span className="lib-card__vendor">{product.vendor}</span> : null}
        <h3 className="lib-card__name fr-card__name">
          <a href={product.url} className="lib-card__link">{product.title}</a>
        </h3>
        {unit ? <span className="fr-card__unit">{unit}</span> : null}
        {showRatings && themeRatings && typeof product.rating === 'number' ? <LibRating value={product.rating} count={product.reviewCount} showCount /> : null}
        <div className="lib-card__row fr-card__row">
          <LibPrice amount={product.price} compareAt={product.compareAtPrice} currency={product.currency} />
        </div>
        {showQuickAdd && themeQuickAdd && !product.soldOut ? (
          qty > 0 ? (
            <div className="fr-card__qty fr-qty" role="group" aria-label={frText(locale, 'quantity')}>
              <button type="button" className="fr-qty__btn" aria-label={frText(locale, 'decrease')} onClick={dec}><IconMinus /></button>
              <span className="fr-qty__value" aria-live="polite">{qty}</span>
              <button type="button" className="fr-qty__btn" aria-label={frText(locale, 'increase')} onClick={add}><IconPlus /></button>
            </div>
          ) : (
            <button type="button" className="fr-card__add" onClick={add} aria-label={`${t('addToCart')}: ${product.title}`}>
              <IconPlus width={18} height={18} />
              <span>{frText(locale, 'add')}</span>
            </button>
          )
        ) : null}
      </div>
    </article>
  );
}
