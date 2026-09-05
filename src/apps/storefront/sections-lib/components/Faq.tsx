/**
 * faq — question/answer accordion (native <details>, so it works without JS and is keyboard
 * accessible). Falls back to the store's FAQ content page when the list is empty.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, spacingFields, tr } from '../schema';
import { bool, list, spacingStyle, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibSection } from '../primitives';
import { RichHtml } from './RichText';

export const faqSchema = defineSection({
  type: 'faq',
  label: 'FAQ',
  description: 'Expandable questions and answers.',
  category: 'content',
  icon: 'HiOutlineQuestionMarkCircle',
  settings: [
    fields.text('title', 'Title', tr('الأسئلة الشائعة', 'Frequently asked questions')),
    fields.text('subtitle', 'Subtitle', ''),
    fields.list(
      'items',
      'Questions',
      [fields.text('question', 'Question', ''), fields.richtext('answer', 'Answer', '')],
      [
        { question: tr('كم يستغرق الشحن؟', 'How long does shipping take?'), answer: tr('عادةً من ٢ إلى ٥ أيام عمل داخل المملكة.', 'Usually 2–5 business days domestically.') },
        { question: tr('هل يمكنني إرجاع المنتج؟', 'Can I return a product?'), answer: tr('نعم، خلال ١٤ يوماً من الاستلام بشرط أن يكون بحالته الأصلية.', 'Yes — within 14 days of delivery, in its original condition.') },
        { question: tr('ما طرق الدفع المتاحة؟', 'Which payment methods do you accept?'), answer: tr('مدى، فيزا، ماستركارد، أبل باي والدفع عند الاستلام في مدن مختارة.', 'Mada, Visa, Mastercard, Apple Pay and cash on delivery in selected cities.') },
      ],
      20,
    ),
    fields.toggle('use_store_faq', 'Use the store FAQ page when the list is empty', true),
    fields.select('layout', 'Layout', [{ value: 'accordion', label: 'Accordion' }, { value: 'columns', label: 'Two columns' }], 'accordion'),
    fields.toggle('open_first', 'Open the first question', true),
    ...spacingFields(),
  ],
});

export function Faq(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(faqSchema, props.settings);
  const data = useSectionData(props.context);
  let items = list(s, 'items').map((i) => ({ q: str(i, 'question'), a: str(i, 'answer') })).filter((i) => i.q && i.a);
  if (items.length === 0 && bool(s, 'use_store_faq', true)) items = data.faq().map((f) => ({ q: f.question, a: f.answer }));
  if (items.length === 0) return null;
  const columns = str(s, 'layout') === 'columns';
  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" narrow={!columns} style={spacingStyle(s)}>
      <div className={cn('lib-faq', columns && 'lib-faq--columns')}>
        {items.map((item, i) => (
          <details key={i} className="lib-faq__item" open={i === 0 && bool(s, 'open_first', true)}>
            <summary className="lib-faq__q">
              <span>{item.q}</span>
              <span className="lib-faq__chev" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </summary>
            <div className="lib-faq__a">
              {/<[a-z][\s\S]*>/i.test(item.a) ? <RichHtml html={item.a} className="lib-prose" /> : <p>{item.a}</p>}
            </div>
          </details>
        ))}
      </div>
    </LibSection>
  );
}
