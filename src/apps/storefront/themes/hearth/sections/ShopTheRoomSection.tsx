/**
 * shop-the-room — a styled roomset beside the pieces that furnish it (docs/themes/theme-03/06 §B7).
 * Hotspot-on-image mapping is a data gap, so this degrades to a roomset image + a "shop this room"
 * product rail (the accessible, mobile-friendly equivalent) — never fabricated hotspots. Self-hides
 * when there's neither an image nor products.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionLabel, Heading } from '../components/Typography';
import { ButtonLink } from '../components/ButtonLink';
import { ProductCard } from '../components/ProductCard';
import { StoreImage } from '../components/Image';
import { productsFor } from './section-data';
import { option, range, text } from './section-settings';

export function ShopTheRoomSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const heading = text(settings, 'heading', 'Shop this room');
  const label = text(settings, 'label');
  const image = text(settings, 'image');
  const source = text(settings, 'source', 'featured');
  const limit = range(settings, 'limit', 4, 1, 6);
  const ctaUrl = text(settings, 'cta_url');
  const ctaLabel = text(settings, 'cta_label', 'Shop the whole room');
  const bg = option(settings, 'bg', ['oat', 'sand', 'cream'] as const, 'oat');
  const products = productsFor(context, source).slice(0, limit);

  if (!image && products.length === 0) return null;

  return (
    <Section bg={bg}>
      <Container>
        <div className="hh-str">
          <div className="hh-str__media">
            <StoreImage className="hh-str__img" src={image} alt={heading} />
          </div>
          <div className="hh-str__aside">
            {label ? <SectionLabel>{label}</SectionLabel> : null}
            <Heading as="h2" size="2xl" className="hh-str__title">
              {heading}
            </Heading>
            <ul className="hh-str__list">
              {products.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} compact />
                </li>
              ))}
            </ul>
            {ctaUrl ? (
              <div className="hh-str__cta">
                <ButtonLink href={ctaUrl} variant="outline">
                  {ctaLabel}
                </ButtonLink>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
