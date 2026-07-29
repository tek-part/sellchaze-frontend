/**
 * wishlist — the merchant's saved pieces (docs/themes/theme-03/07 §7). Reads `context.data`
 * ({ products, authenticated, loading }) from the app's WishlistPage. Prompts sign-in for guests,
 * shows a warm empty state otherwise, and a grid of saved products (the heart toggles removal).
 */
import type { CSSProperties, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ProductCardModel } from '../../../types/catalog';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { EmptyState } from '../components/EmptyState';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { Section } from '../components/Section';

function readData(context: SectionRenderProps['context']): {
  products: ReadonlyArray<ProductCardModel>;
  authenticated: boolean;
  loading: boolean;
} {
  const bag = context.data as { products?: unknown; authenticated?: unknown; loading?: unknown };
  return {
    products: Array.isArray(bag.products) ? (bag.products as ReadonlyArray<ProductCardModel>) : [],
    authenticated: bag.authenticated === true,
    loading: bag.loading === true,
  };
}

export function WishlistSection(props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const { context } = props;
  const { products, authenticated, loading } = readData(context);
  const gridStyle = { '--hh-cols': '4' } as CSSProperties;

  return (
    <Section>
      <Container>
        <h1 className="hh-page-title">{t('wishlist.saved')}</h1>

        {loading ? (
          <div className="hh-grid hh-grid--products" style={gridStyle} aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : !authenticated ? (
          <EmptyState
            variant="wishlist"
            title={t('wishlist.signInTitleHearth')}
            description={t('wishlist.signInHintHearth')}
            actions={<ButtonLink href="/account">{t('auth.signIn')}</ButtonLink>}
          />
        ) : products.length === 0 ? (
          <EmptyState
            variant="wishlist"
            title={t('wishlist.emptyTitleHearth')}
            description={t('wishlist.emptyHintHearth')}
            actions={<ButtonLink href="/rooms">{t('hearth.browseRooms')}</ButtonLink>}
          />
        ) : (
          <ul className="hh-grid hh-grid--products" style={gridStyle}>
            {products.map((p) => (
              <li key={p.id} className="hh-grid__item">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
