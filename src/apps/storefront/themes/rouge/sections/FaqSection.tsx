/**
 * Rouge faq — a centered head over an Accordion. Settings: eyebrow, title, items (newline-separated
 * "Question | Answer" rows). Self-hides with no items.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { Accordion, type AccordionItem } from '../components/Accordion';
import { lines, text } from './section-settings';
import { faqFrom, faqHeadingFrom } from '../../../content/home-data';

export function FaqSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const eyebrow = text(settings, 'eyebrow', 'Good to know');
  const title = faqHeadingFrom(context) || text(settings, 'title', 'Frequently asked');
  const fromData = faqFrom(context);
  const items: AccordionItem[] = [];
  if (fromData.length) {
    fromData.forEach((f, i) => items.push({ id: `faq-${i}`, title: f.question, content: f.answer }));
  } else {
    lines(settings, 'items').forEach((row, i) => {
      const [q, a] = row.split('|').map((s) => s.trim());
      if (q) items.push({ id: `faq-${i}`, title: q, content: a ?? '' });
    });
  }

  if (items.length === 0) return null;

  return (
    <Section>
      <Container narrow>
        <SectionHead align="center" eyebrow={eyebrow} title={title} className="rge-section__head-wrap" />
        <Accordion items={items} />
      </Container>
    </Section>
  );
}
