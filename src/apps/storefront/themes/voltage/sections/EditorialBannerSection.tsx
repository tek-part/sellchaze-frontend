/**
 * Voltage editorial-banner — a split feature band: media on one side, eyebrow + heading + copy + CTA
 * on the other. `align` (start|end) flips the media side. Self-hides when nothing is configured.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ButtonLink } from '../components/ButtonLink';
import { StoreImage } from '../components/Image';
import { option, text } from './section-settings';

export function EditorialBannerSection(props: SectionRenderProps): ReactElement | null {
  const heading = text(props.settings, 'heading');
  const image = text(props.settings, 'image_url');
  if (!heading && !image) return null;
  const eyebrow = text(props.settings, 'eyebrow');
  const body = text(props.settings, 'text');
  const ctaLabel = text(props.settings, 'cta_label');
  const ctaUrl = text(props.settings, 'cta_url');
  const align = option(props.settings, 'align', ['start', 'end'] as const, 'start');

  return (
    <Section reveal>
      <Container>
        <div className={cn('vlt-editorial', align === 'end' && 'vlt-editorial--flip')}>
          <div className="vlt-editorial__media">
            <StoreImage className="vlt-editorial__img" src={image} alt="" />
          </div>
          <div className="vlt-editorial__body">
            {eyebrow ? <span className="vlt-eyebrow">{eyebrow}</span> : null}
            {heading ? <h2 className="vlt-editorial__title">{heading}</h2> : null}
            {body ? <p className="vlt-editorial__text">{body}</p> : null}
            {ctaLabel && ctaUrl ? <ButtonLink href={ctaUrl} variant="accent" className="vlt-editorial__cta">{ctaLabel}</ButtonLink> : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
