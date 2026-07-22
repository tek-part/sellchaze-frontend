/**
 * editorial-banner — story + CTA; lifestyle split. Media + eyebrow → serif headline → sentence →
 * ghost link, via EditorialCard. Settings: image, heading, body, cta_label, cta_url, media_side,
 * eyebrow. Self-hides with no heading/image. §08 editorial-banner.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { EditorialCard } from '../components/EditorialCard';
import { Section } from '../components/Section';
import { option, text } from './section-settings';

export function EditorialBannerSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const image = text(settings, 'image');
  const heading = text(settings, 'heading');
  const body = text(settings, 'body');
  const eyebrow = text(settings, 'eyebrow');
  const ctaLabel = text(settings, 'cta_label');
  const ctaUrl = text(settings, 'cta_url', '#');
  const side = option(settings, 'media_side', ['left', 'right'] as const, 'left');

  if (!heading && !image) return null;

  return (
    <Section>
      <Container>
        <EditorialCard
          variant={side === 'right' ? 'media-right' : 'media-left'}
          title={heading}
          headingLevel="h2"
          {...(eyebrow ? { eyebrow } : {})}
          {...(body ? { text: body } : {})}
          {...(image ? { image: { src: image } } : {})}
          {...(ctaLabel ? { href: ctaUrl, cta: ctaLabel } : {})}
        />
      </Container>
    </Section>
  );
}
