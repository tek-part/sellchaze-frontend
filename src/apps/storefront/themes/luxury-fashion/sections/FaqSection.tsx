/**
 * faq — deflect friction + SEO. Accordion + SectionHead. Settings: title, items (one "Question |
 * Answer" per line). Self-hides with no items. FAQ schema.org markup is emitted at the page level
 * (Phase 11). §08 faq.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Accordion, type AccordionItemData } from '../components/Accordion';
import { SectionShell } from './SectionShell';
import { pairs, text } from './section-settings';

export function FaqSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const title = text(settings, 'title', 'Frequently asked');
  const items: AccordionItemData[] = pairs(settings, 'items')
    .filter((p) => p.term)
    .map((p, i) => ({ id: `faq-${i}`, header: p.term, content: p.definition }));

  if (items.length === 0) return null;

  return (
    <SectionShell title={title} narrow>
      <div className="sf-faq">
        <Accordion items={items} type="single" defaultOpen={items[0] ? [items[0].id] : []} />
      </div>
    </SectionShell>
  );
}
