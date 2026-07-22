/**
 * Rouge rich-text — a centered editorial prose block (brand story, care notes). Settings: eyebrow,
 * heading, body (may contain HTML), align.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Eyebrow } from '../components/Typography';
import { option, text } from './section-settings';

export function RichTextSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const eyebrow = text(settings, 'eyebrow');
  const heading = text(settings, 'heading');
  const body = text(settings, 'body');
  const align = option(settings, 'align', ['start', 'center'] as const, 'center');
  if (!heading && !body) return null;

  return (
    <Section tight>
      <Container narrow>
        <div className={cn('rge-richtext', align === 'center' && 'rge-richtext--center')}>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          {heading ? <h2 className="rge-richtext__title">{heading}</h2> : null}
          {body ? <div className="rge-prose" dangerouslySetInnerHTML={{ __html: body }} /> : null}
        </div>
      </Container>
    </Section>
  );
}
