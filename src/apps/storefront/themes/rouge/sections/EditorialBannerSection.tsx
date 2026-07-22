/**
 * Rouge editorial-banner — a split media/text feature over an optional aura glow. Settings: eyebrow,
 * heading, body, cta_label, cta_url, image, media_side (left/right/stacked).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ButtonLink } from '../components/ButtonLink';
import { Eyebrow } from '../components/Typography';
import { StoreImage } from '../components/Image';
import { option, text } from './section-settings';

export function EditorialBannerSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const eyebrow = text(settings, 'eyebrow');
  const heading = text(settings, 'heading');
  const body = text(settings, 'body');
  const ctaLabel = text(settings, 'cta_label');
  const ctaUrl = text(settings, 'cta_url', '#');
  const image = text(settings, 'image');
  const side = option(settings, 'media_side', ['left', 'right', 'stacked'] as const, 'left');
  if (!heading && !image) return null;

  return (
    <Section>
      <Container>
        <div className={cn('rge-editorial', `rge-editorial--${side}`)}>
          <div className="rge-editorial__media">
            <div className="rge-aura rge-editorial__aura" aria-hidden />
            <StoreImage className="rge-editorial__img" src={image} alt="" />
          </div>
          <div className="rge-editorial__text">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? <h2 className="rge-editorial__title">{heading}</h2> : null}
            {body ? <p className="rge-editorial__body">{body}</p> : null}
            {ctaLabel ? <ButtonLink href={ctaUrl}>{ctaLabel}</ButtonLink> : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
