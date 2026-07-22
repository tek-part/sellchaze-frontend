/**
 * WishlistPage — /wishlist. Auth-gated: guests see a sign-in prompt; members see their saved
 * products from the storefront wishlist endpoint.
 */
import { useMemo, type CSSProperties, type ReactElement } from 'react';
import {
  ButtonLink,
  Container,
  EmptyState,
  ProductCard,
  Section,
  Spinner,
} from '../themes/luxury-fashion/components';
import { useAuth } from '../state/auth-context';
import { useStore } from '../state/store-context';
import { useAsync } from '../api/useAsync';
import { getWishlist } from '../api/storefront';
import { toProductCard } from '../api/mappers';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { flowContext } from './flow-context';

const GRID: CSSProperties = { '--sf-cols': 4, '--sf-cols-lg': 3, '--sf-cols-md': 2, '--sf-cols-sm': 2 } as CSSProperties;

export function WishlistPage(): ReactElement {
  const { customer, loading: authLoading } = useAuth();
  const { store } = useStore();
  const tpl = useTemplate('wishlist');
  const wishQ = useAsync(() => (customer ? getWishlist() : Promise.resolve({ data: [] })), [customer?.id]);

  const products = useMemo(
    () => (wishQ.data ? wishQ.data.data.map((p) => toProductCard(p, store.currency)) : []),
    [wishQ.data, store.currency],
  );

  if (tpl) {
    return (
      <ThemeRenderer
        page={tpl}
        context={flowContext(store, { loading: authLoading || wishQ.loading, authenticated: !!customer, products })}
      />
    );
  }

  if (authLoading) {
    return (
      <Section>
        <Container>
          <div style={{ display: 'grid', placeItems: 'center', minHeight: '30vh' }}>
            <Spinner label="Loading" />
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container>
        <div className="sf-page-head">
          <h1 className="sf-page-head__title">Wishlist</h1>
        </div>
        {!customer ? (
          <EmptyState
            variant="wishlist"
            title="Sign in to view your wishlist"
            description="Save the pieces you love and find them here."
            actions={<ButtonLink href="/login">Sign in</ButtonLink>}
          />
        ) : products.length === 0 ? (
          <EmptyState
            variant="wishlist"
            title="Your wishlist is empty"
            description="Tap the heart on any piece to save it."
            actions={<ButtonLink href="/collections/new-in">Explore new in</ButtonLink>}
          />
        ) : (
          <div className="sf-grid" style={GRID}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
