/** Voltage faq — an accordion of `question | answer` lines. Self-hides when nothing is configured. */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { Accordion, type AccordionItem } from '../components/Accordion';
import { lines, text } from './section-settings';

export function FaqSection(props: SectionRenderProps): ReactElement | null {
  const items: AccordionItem[] = lines(props.settings, 'items')
    .map((raw) => raw.split('|').map((p) => p.trim()))
    .filter((parts) => parts[0] && parts[1])
    .map((parts) => ({ question: parts[0] ?? '', answer: parts[1] ?? '' }));
  if (items.length === 0) return null;
  const title = text(props.settings, 'title') || 'FAQ';

  return (
    <Section reveal>
      <Container narrow>
        <SectionHead title={title} className="vlt-section__head-wrap" />
        <Accordion items={items} defaultOpen={0} />
      </Container>
    </Section>
  );
}
