/**
 * Voltage wishlist — the saved grid. Auth-gated: guests get a sign-in prompt, members get their saved
 * products (threaded from the shared WishlistPage under context.data). Voltage's own markup.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ButtonLink } from '../components/ButtonLink';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { isLoading, productsFor } from './section-data';

export function WishlistSection(props: SectionRenderProps): ReactElement {
  const { context } = props;
  const loading = isLoading(context);
  const authenticated = context.data.authenticated === true;
  const products = productsFor(context);

  const head = (
    <div className="vlt-flow-head">
      <span className="vlt-eyebrow">// Saved</span>
      <h1 className="vlt-flow-head__title">Wishlist</h1>
    </div>
  );

  if (loading) {
    return (
      <Section>
        <Container>
          {head}
          <div className="vlt-grid" style={{ '--vlt-cols': 4, '--vlt-cols-lg': 3, '--vlt-cols-md': 2, '--vlt-cols-sm': 2 } as CSSProperties}>
            {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </Container>
      </Section>
    );
  }

  if (!authenticated) {
    return (
      <Section>
        <Container>
          {head}
          <div className="vlt-empty vlt-empty--pad">
            <span className="vlt-empty__title">Sign in to view your wishlist</span>
            <span className="vlt-empty__text">Save the gear you want and pick up where you left off.</span>
            <ButtonLink href="/login" className="vlt-empty__cta">Sign in</ButtonLink>
          </div>
        </Container>
      </Section>
    );
  }

  if (products.length === 0) {
    return (
      <Section>
        <Container>
          {head}
          <div className="vlt-empty vlt-empty--pad">
            <span className="vlt-empty__title">Your wishlist is empty</span>
            <span className="vlt-empty__text">Tap the heart on any product to save it here.</span>
            <ButtonLink href="/collections/new-in" className="vlt-empty__cta">Explore new in</ButtonLink>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container>
        {head}
        <div className="vlt-grid" style={{ '--vlt-cols': 4, '--vlt-cols-lg': 3, '--vlt-cols-md': 2, '--vlt-cols-sm': 2 } as CSSProperties}>
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </Container>
    </Section>
  );
}
