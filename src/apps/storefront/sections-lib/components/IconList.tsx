/**
 * icon-list — `item` blocks of icon + text (+ optional link): what's included, highlights, steps.
 * A vertical list, an inline row of pills, or two columns.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect, type RawBlock } from '../schema';
import { bandClass, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { LibSection } from '../primitives';
import { ICON_OPTIONS, LibIcon } from './Features';

const ITEM_FIELDS = [
  fields.select('icon', 'Icon', ICON_OPTIONS, 'check'),
  fields.text('text', 'Text', ''),
  fields.url('url', 'Link', ''),
] as const;

export const iconItemBlock = defineBlock({ type: 'item', label: 'Item', icon: 'HiOutlineCheckCircle', settings: ITEM_FIELDS, limit: 12 });

export const ICON_LIST_LAYOUTS = variants('layout', [
  { value: 'list', label: 'List', description: 'One item per line.', icon: 'HiOutlineListBullet' },
  { value: 'inline', label: 'Inline', description: 'Items as a row of pills.', icon: 'HiOutlineMinus' },
  { value: 'two-columns', label: 'Two columns', description: 'Items split across two columns.', icon: 'HiOutlineViewColumns' },
]);

const DEMO_ITEMS: ReadonlyArray<RawBlock> = [
  { id: 'demo-1', type: 'item', settings: { icon: 'check', text: tr('شحن مجاني للطلبات فوق ٢٠٠ ر.س', 'Free shipping on orders over 200'), url: '' } },
  { id: 'demo-2', type: 'item', settings: { icon: 'check', text: tr('تغليف هدايا مجاني عند الطلب', 'Complimentary gift wrapping'), url: '' } },
  { id: 'demo-3', type: 'item', settings: { icon: 'check', text: tr('الدفع عند الاستلام في مدن مختارة', 'Cash on delivery in selected cities'), url: '' } },
  { id: 'demo-4', type: 'item', settings: { icon: 'check', text: tr('نقاط ولاء مع كل طلب', 'Loyalty points with every order'), url: '/account' } },
];

export const iconListSchema = defineSection({
  type: 'icon-list',
  label: 'Icon list',
  description: 'Short lines with an icon — perks, steps, highlights.',
  category: 'content',
  icon: 'HiOutlineListBullet',
  variants: ICON_LIST_LAYOUTS,
  blocks: { types: [iconItemBlock], max: 12 },
  settings: [
    fields.text('title', 'Title', tr('ما الذي تحصل عليه', 'What you get')),
    fields.text('subtitle', 'Subtitle', ''),
    variantSelect(ICON_LIST_LAYOUTS, 'list'),
    fields.select('align', 'Alignment', OPTIONS.align, 'start'),
    fields.select('background', 'Background', OPTIONS.background, 'none'),
    ...spacingFields(48),
  ],
  presets: [{ label: 'Perks', settings: { blocks: DEMO_ITEMS } }],
});

export function IconList(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(iconListSchema, props.settings);
  const layout = useVariant(iconListSchema, props.settings);
  const items = useSectionBlocks(iconListSchema, s, undefined, DEMO_ITEMS).filter((b) => str(b.settings, 'text'));
  if (items.length === 0) return null;
  const align = str(s, 'align', 'start');
  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align={align === 'center' ? 'center' : 'start'} narrow={layout !== 'two-columns'} className={bandClass(str(s, 'background', 'none'))} style={spacingStyle(s)}>
      <ul className={cn('lib-iconlist', `lib-iconlist--${layout}`, `lib-iconlist--${align}`)}>
        {items.map((block) => {
          const b = block.settings;
          const url = str(b, 'url');
          const inner = (
            <>
              <span className="lib-iconlist__icon"><LibIcon name={str(b, 'icon', 'check')} size={18} /></span>
              <span className="lib-iconlist__text">{str(b, 'text')}</span>
            </>
          );
          return <li key={block.id} className="lib-iconlist__item">{url ? <a href={url} className="lib-iconlist__link">{inner}</a> : inner}</li>;
        })}
      </ul>
    </LibSection>
  );
}
