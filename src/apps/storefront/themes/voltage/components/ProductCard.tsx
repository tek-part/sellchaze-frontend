/**
 * Voltage ProductCard — spec-led tile: surface panel, 16px radius, cyan border-glow on hover, mono
 * vendor line, grotesque name + tabular price, mono badges. Reads the shared ProductCardModel.
 */
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { Badge } from './Badge';
import { Price } from './Price';
import { StoreImage } from './Image';
import { IconStar, IconSearch } from './icons';
import { CompareButton } from './CompareButton';
import { QuickView } from './QuickView';
import { useCompare } from '../state/compare-context';

export interface ProductCardProps {
  product: ProductCardModel;
  locale?: string;
  headingLevel?: 'h2' | 'h3';
  /** Hide the hover quick-view + compare affordances (e.g. dense rails). */
  actions?: boolean;
  className?: string;
}

export function ProductCard(props: ProductCardProps): ReactElement {
  const { product, locale, headingLevel: Heading = 'h3', actions = true, className } = props;
  const { t } = useTranslation();
  const onSale = typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price;
  const compare = useCompare();
  const [quickOpen, setQuickOpen] = useState(false);
  const inCompare = compare.has(product.id);

  return (
    <article className={cn('vlt-card', className)}>
      <div className="vlt-card__media">
        <StoreImage className="vlt-card__img" src={product.image?.src} alt={product.image?.alt ?? product.title} />
        <div className="vlt-card__badges">
          {product.badge ? <Badge variant="new">{product.badge}</Badge> : null}
          {onSale ? <Badge variant="sale">{t('product.sale')}</Badge> : null}
        </div>
        {product.soldOut ? (
          <div className="vlt-card__soldout">
            <Badge variant="outline">{t('product.soldOut')}</Badge>
          </div>
        ) : null}
        {actions ? (
          <div className="vlt-card__actions">
            <button type="button" className="vlt-icon-btn vlt-card__quick" aria-label={t('product.quickViewFor', { title: product.title })} title={t('product.quickView')} onClick={() => setQuickOpen(true)}>
              <span aria-hidden><IconSearch /></span>
            </button>
            <CompareButton active={inCompare} disabled={compare.isFull} onToggle={() => compare.toggle(product)} className="vlt-card__compare" />
          </div>
        ) : null}
      </div>
      <div className="vlt-card__body">
        {product.vendor ? <span className="vlt-card__vendor">{product.vendor}</span> : null}
        <Heading className="vlt-card__name">
          <a href={product.url} className="vlt-card__link">
            {product.title}
          </a>
        </Heading>
        <div className="vlt-card__foot">
          <Price
            amount={product.price}
            {...(product.compareAtPrice ? { compareAt: product.compareAtPrice } : {})}
            currency={product.currency}
            locale={locale}
          />
          {typeof product.rating === 'number' ? (
            <span className="vlt-card__rating vlt-num" aria-label={t('product.ratedOfMax', { value: product.rating, max: 5 })}>
              <IconStar width={14} height={14} style={{ color: 'var(--accent)' }} />
              {product.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
      {actions ? <QuickView product={quickOpen ? product : null} open={quickOpen} onClose={() => setQuickOpen(false)} /> : null}
    </article>
  );
}
