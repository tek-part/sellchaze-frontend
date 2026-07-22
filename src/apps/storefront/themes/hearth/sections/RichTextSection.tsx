/**
 * rich-text — freeform editorial/legal content block (docs/themes/theme-03/06 §B15). Renders a
 * small serif label + heading + body. `content` is treated as plain paragraphs here; the richtext
 * trust-boundary sanitiser is wired in the API/hardening phase before any HTML is injected.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Heading, SectionLabel, Text } from '../components/Typography';
import { lines, option, text } from './section-settings';

export function RichTextSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const label = text(settings, 'label');
  const heading = text(settings, 'heading');
  const body = lines(settings, 'content');
  const width = option(settings, 'width', ['narrow', 'default', 'wide'] as const, 'narrow');
  const align = option(settings, 'align', ['start', 'center'] as const, 'start');

  if (!heading && body.length === 0) return null;

  return (
    <Section bg="oat">
      <Container narrow={width === 'narrow'} wide={width === 'wide'}>
        <div className={cn('hh-richtext', `hh-richtext--${align}`)}>
          {label ? <SectionLabel>{label}</SectionLabel> : null}
          {heading ? (
            <Heading as="h2" size="2xl" className="hh-richtext__title">
              {heading}
            </Heading>
          ) : null}
          {body.map((para, i) => (
            <Text key={i} size="md" className="hh-richtext__p">
              {para}
            </Text>
          ))}
        </div>
      </Container>
    </Section>
  );
}
