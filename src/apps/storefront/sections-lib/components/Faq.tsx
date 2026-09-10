/**
 * faq — `question` blocks as a native <details> accordion (works without JS, keyboard accessible),
 * as two accordion columns, or as an always-open list. Falls back to the store's FAQ content page
 * when there are no blocks.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, spacingFields, tr, variants, variantSelect } from '../schema';
import { bool, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { useSectionData } from '../data';
import { LibSection } from '../primitives';
import { RichHtml } from './RichText';

const QUESTION_FIELDS = [fields.text('question', 'Question', ''), fields.richtext('answer', 'Answer', '')] as const;

export const questionBlock = defineBlock({ type: 'question', label: 'Question', icon: 'HiOutlineQuestionMarkCircle', settings: QUESTION_FIELDS, limit: 20 });

export const FAQ_LAYOUTS = variants('layout', [
  { value: 'accordion', label: 'Accordion', description: 'One column of expandable questions.', icon: 'HiOutlineBars3' },
  { value: 'two-columns', label: 'Two columns', description: 'Expandable questions in two columns.', icon: 'HiOutlineViewColumns' },
  { value: 'list-open', label: 'Open list', description: 'All answers visible, no toggles.', icon: 'HiOutlineListBullet' },
], { layout: { columns: 'two-columns' } });

export const faqSchema = defineSection({
  type: 'faq',
  label: 'FAQ',
  description: 'Expandable questions and answers.',
  category: 'content',
  icon: 'HiOutlineQuestionMarkCircle',
  variants: FAQ_LAYOUTS,
  blocks: { types: [questionBlock], max: 20, legacy: 'items' },
  settings: [
    fields.text('title', 'Title', tr('الأسئلة الشائعة', 'Frequently asked questions')),
    fields.text('subtitle', 'Subtitle', ''),
    variantSelect(FAQ_LAYOUTS, 'accordion'),
    fields.list(
      'items',
      'Questions',
      QUESTION_FIELDS,
      [
        { question: tr('كم يستغرق الشحن؟', 'How long does shipping take?'), answer: tr('عادةً من ٢ إلى ٥ أيام عمل داخل المملكة.', 'Usually 2–5 business days domestically.') },
        { question: tr('هل يمكنني إرجاع المنتج؟', 'Can I return a product?'), answer: tr('نعم، خلال ١٤ يوماً من الاستلام بشرط أن يكون بحالته الأصلية.', 'Yes — within 14 days of delivery, in its original condition.') },
        { question: tr('ما طرق الدفع المتاحة؟', 'Which payment methods do you accept?'), answer: tr('مدى، فيزا، ماستركارد، أبل باي والدفع عند الاستلام في مدن مختارة.', 'Mada, Visa, Mastercard, Apple Pay and cash on delivery in selected cities.') },
      ],
      20,
    ),
    fields.toggle('use_store_faq', 'Use the store FAQ page when the list is empty', true),
    fields.toggle('open_first', 'Open the first question', true),
    ...spacingFields(),
  ],
});

const isHtml = (v: string): boolean => /<[a-z][\s\S]*>/i.test(v);

export function Faq(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(faqSchema, props.settings);
  const layout = useVariant(faqSchema, props.settings);
  const data = useSectionData(props.context);
  let items = useSectionBlocks(faqSchema, s).map((b) => ({ id: b.id, q: str(b.settings, 'question'), a: str(b.settings, 'answer') })).filter((i) => i.q && i.a);
  if (items.length === 0 && bool(s, 'use_store_faq', true)) items = data.faq().map((f, i) => ({ id: `store-${i}`, q: f.question, a: f.answer }));
  if (items.length === 0) return null;
  const columns = layout === 'two-columns';
  const open = layout === 'list-open';
  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" narrow={!columns} style={spacingStyle(s)}>
      {open ? (
        <dl className="lib-faq lib-faq--open">
          {items.map((item) => (
            <div key={item.id} className="lib-faq__item lib-faq__item--open">
              <dt className="lib-faq__q">{item.q}</dt>
              <dd className="lib-faq__a">{isHtml(item.a) ? <RichHtml html={item.a} className="lib-prose" /> : <p>{item.a}</p>}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className={cn('lib-faq', columns && 'lib-faq--columns')}>
          {items.map((item, i) => (
            <details key={item.id} className="lib-faq__item" open={i === 0 && bool(s, 'open_first', true)}>
              <summary className="lib-faq__q">
                <span>{item.q}</span>
                <span className="lib-faq__chev" aria-hidden>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                </span>
              </summary>
              <div className="lib-faq__a">{isHtml(item.a) ? <RichHtml html={item.a} className="lib-prose" /> : <p>{item.a}</p>}</div>
            </details>
          ))}
        </div>
      )}
    </LibSection>
  );
}
