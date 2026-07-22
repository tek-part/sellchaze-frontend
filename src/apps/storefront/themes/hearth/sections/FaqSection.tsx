/**
 * faq — collapsible Q&A (delivery, returns, care, assembly). Uses native <details>/<summary> so it
 * is fully keyboard- and no-JS-operable. Items are encoded one per line as "question | answer".
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { ChevronRightIcon } from '../components/icons';
import { option, pairs, text } from './section-settings';

export function FaqSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const heading = text(settings, 'heading', 'Frequently asked');
  const label = text(settings, 'label');
  const layout = option(settings, 'layout', ['single', 'two-col'] as const, 'single');
  const items = pairs(settings, 'items').filter((p) => p.term);

  if (items.length === 0) return null;

  return (
    <Section bg="oat">
      <Container narrow={layout === 'single'}>
        <SectionHead {...(label ? { label } : {})} title={heading} align="center" />
        <div className={`hh-faq hh-faq--${layout}`}>
          {items.map((item, i) => (
            <details key={i} className="hh-faq__item" name="hh-faq">
              <summary className="hh-faq__q">
                <span>{item.term}</span>
                <span className="hh-faq__icon" aria-hidden>
                  <ChevronRightIcon />
                </span>
              </summary>
              <div className="hh-faq__a">
                <p>{item.definition}</p>
              </div>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
