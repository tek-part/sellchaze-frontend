/**
 * category-story — an editorial band telling a room/collection story: a big warm image beside serif
 * copy + CTA, with up to three small feature notes ("3-yr warranty", "FSC oak"). Image side is
 * configurable; self-hides when there's neither image nor body.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { Heading, SectionLabel, Text } from '../components/Typography';
import { StoreImage } from '../components/Image';
import { lines, option, text } from './section-settings';
import { editorialFrom } from '../../../content/home-data';

export function CategoryStorySection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const ed = editorialFrom(context);
  const label = ed.eyebrow ?? text(settings, 'label');
  const heading = ed.heading ?? text(settings, 'heading');
  const body = ed.body ?? text(settings, 'body');
  const image = ed.image ?? text(settings, 'image');
  const side = option(settings, 'image_side', ['start', 'end'] as const, 'start');
  const ctaLabel = ed.ctaLabel ?? text(settings, 'cta_label');
  const ctaUrl = ed.ctaUrl ?? text(settings, 'cta_url', '#');
  const notes = lines(settings, 'notes'); // "term | value" per line

  if (!image && !heading && !body) return null;

  return (
    <section className="hh-section hh-section--cream">
      <Container>
        <div className={cn('hh-story', `hh-story--media-${side}`)}>
          <div className="hh-story__media">
            <StoreImage className="hh-story__img" src={image} alt={heading || 'Featured collection'} />
          </div>
          <div className="hh-story__content">
            {label ? <SectionLabel>{label}</SectionLabel> : null}
            {heading ? (
              <Heading as="h2" size="3xl" className="hh-story__title">
                {heading}
              </Heading>
            ) : null}
            {body ? (
              <Text size="md" muted className="hh-story__body">
                {body}
              </Text>
            ) : null}
            {notes.length > 0 ? (
              <ul className="hh-story__notes">
                {notes.map((line, i) => {
                  const [term, ...rest] = line.split('|');
                  return (
                    <li key={i} className="hh-story__note">
                      <span className="hh-story__note-term">{(term ?? '').trim()}</span>
                      {rest.length > 0 ? (
                        <span className="hh-story__note-val">{rest.join('|').trim()}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {ctaLabel ? (
              <div className="hh-story__actions">
                <ButtonLink href={ctaUrl}>{ctaLabel}</ButtonLink>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
