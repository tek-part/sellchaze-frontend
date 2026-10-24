/**
 * glow-concerns — "shop by concern": dryness, breakouts, dullness, fine lines, sensitivity, hair…
 * Each concern is an icon + name + one-line promise linking to a collection or search. Variants:
 * `tiles` (soft cards in a grid) · `chips` (a scrolling row of pills — compact, good above a grid).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { LibSection, defineSection, fields, list, spacingFields, spacingStyle, str, tr, useSectionSettings, useVariant, variantSelect, variants } from '../../../sections-lib';
import { CONCERN_ICON_OPTIONS, ConcernGlyph, IconArrow } from '../chrome/icons';

const CONCERN_LAYOUTS = variants('layout', [
  { value: 'tiles', label: 'Tiles', description: 'Soft cards with an icon and a one-line promise.', icon: 'HiOutlineSquares2X2' },
  { value: 'chips', label: 'Chips', description: 'A compact scrolling row of pills.', icon: 'HiOutlineEllipsisHorizontal' },
]);

export const CONCERN_ITEM_FIELDS = [
  fields.select('icon', 'Icon', CONCERN_ICON_OPTIONS, 'drop'),
  fields.text('label', 'Concern', ''),
  fields.text('text', 'One-line promise', ''),
  fields.url('url', 'Link', '/shop'),
] as const;

export const DEFAULT_CONCERNS = [
  { icon: 'drop', label: tr('جفاف البشرة', 'Dryness'), text: tr('ترطيب عميق يدوم طوال اليوم', 'Layered hydration that lasts'), url: '/collections/skincare' },
  { icon: 'spot', label: tr('الحبوب والشوائب', 'Breakouts'), text: tr('تنظيف لطيف يوازن البشرة', 'Gentle care that rebalances'), url: '/collections/cleansers' },
  { icon: 'sparkle', label: tr('البهتان', 'Dullness'), text: tr('إشراقة ونضارة ولون موحّد', 'Radiance and a more even tone'), url: '/collections/skincare' },
  { icon: 'clock', label: tr('الخطوط الدقيقة', 'Fine lines'), text: tr('دعم المرونة والامتلاء', 'Support for bounce and firmness'), url: '/collections/treatments' },
  { icon: 'feather', label: tr('البشرة الحساسة', 'Sensitivity'), text: tr('تركيبات مهدّئة بلا عطور', 'Calming, fragrance-free formulas'), url: '/collections/skincare' },
  { icon: 'leaf', label: tr('العناية بالشعر', 'Hair care'), text: tr('تغذية من الجذور حتى الأطراف', 'Nourishment from root to tip'), url: '/collections/hair' },
];

export const glowConcernsSchema = defineSection({
  type: 'glow-concerns',
  label: 'Shop by concern',
  description: 'Skin and hair concerns as tiles or chips, each linking to the right products.',
  category: 'categories',
  icon: 'HiOutlineFaceSmile',
  variants: CONCERN_LAYOUTS,
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('ابدئي من احتياج بشرتك', 'Start with your skin')),
    fields.text('title', 'Title', tr('تسوّقي حسب الاحتياج', 'Shop by concern')),
    fields.text('subtitle', 'Subtitle', ''),
    variantSelect(CONCERN_LAYOUTS, 'tiles'),
    fields.list('items', 'Concerns', CONCERN_ITEM_FIELDS, DEFAULT_CONCERNS, 12),
    ...spacingFields(),
  ],
  presets: [
    { label: 'Chip row', settings: { layout: 'chips', eyebrow: '', title: '' } },
  ],
});

export function GlowConcerns(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(glowConcernsSchema, props.settings);
  const layout = useVariant(glowConcernsSchema, props.settings);
  const items = list(s, 'items').filter((item) => str(item, 'label'));
  if (items.length === 0) return null;
  const title = str(s, 'title');

  if (layout === 'chips') {
    return (
      <LibSection eyebrow={str(s, 'eyebrow')} title={title} subtitle={str(s, 'subtitle')} style={spacingStyle(s)} className="gl-concerns gl-concerns--chips">
        <ul className="gl-chips" aria-label={title || undefined}>
          {items.map((item, i) => (
            <li key={`${str(item, 'label')}-${i}`}>
              <a href={str(item, 'url') || '/shop'} className="gl-chip">
                <ConcernGlyph name={str(item, 'icon', 'drop')} width={18} height={18} />
                <span>{str(item, 'label')}</span>
              </a>
            </li>
          ))}
        </ul>
      </LibSection>
    );
  }

  return (
    <LibSection eyebrow={str(s, 'eyebrow')} title={title} subtitle={str(s, 'subtitle')} align="center" style={spacingStyle(s)} className="gl-concerns">
      <ul className={cn('gl-concerns__grid', items.length % 3 === 0 && 'is-thirds', items.length % 4 === 0 && 'is-quarters')}>
        {items.map((item, i) => (
          <li key={`${str(item, 'label')}-${i}`}>
            <a href={str(item, 'url') || '/shop'} className="gl-concern">
              <span className="gl-concern__icon"><ConcernGlyph name={str(item, 'icon', 'drop')} width={26} height={26} /></span>
              <span className="gl-concern__label">{str(item, 'label')}</span>
              {str(item, 'text') ? <span className="gl-concern__text">{str(item, 'text')}</span> : null}
              <IconArrow className="gl-concern__arrow" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </LibSection>
  );
}
