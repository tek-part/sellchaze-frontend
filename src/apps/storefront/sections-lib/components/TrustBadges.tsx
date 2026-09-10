/**
 * trust-badges — compact `badge` blocks (icon + short text): secure checkout, payment methods,
 * guarantees. A single row or a wrapped grid, usually just above the footer or under the hero.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect, type RawBlock } from '../schema';
import { bandClass, gridStyle, num, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { LibGrid, LibImage, LibSection } from '../primitives';
import { ICON_OPTIONS, LibIcon } from './Features';

const BADGE_FIELDS = [
  fields.select('icon', 'Icon', ICON_OPTIONS, 'shield'),
  fields.image('image', 'Image (replaces the icon)', ''),
  fields.text('text', 'Text', ''),
  fields.text('caption', 'Caption', ''),
] as const;

export const badgeBlock = defineBlock({ type: 'badge', label: 'Badge', icon: 'HiOutlineShieldCheck', settings: BADGE_FIELDS, limit: 8 });

export const BADGE_LAYOUTS = variants('layout', [
  { value: 'row', label: 'Row', description: 'One centred line of badges.', icon: 'HiOutlineMinus' },
  { value: 'grid', label: 'Grid', description: 'Badges wrapped into equal tiles.', icon: 'HiOutlineSquares2X2' },
]);

const DEMO_BADGES: ReadonlyArray<RawBlock> = [
  { id: 'demo-1', type: 'badge', settings: { icon: 'lock', image: '', text: tr('دفع آمن ١٠٠٪', '100% secure checkout'), caption: tr('تشفير SSL', 'SSL encrypted') } },
  { id: 'demo-2', type: 'badge', settings: { icon: 'medal', image: '', text: tr('ضمان الجودة', 'Quality guarantee'), caption: tr('منتجات أصلية', 'Genuine products') } },
  { id: 'demo-3', type: 'badge', settings: { icon: 'refresh', image: '', text: tr('إرجاع خلال ١٤ يوماً', '14-day returns'), caption: tr('بدون أسئلة', 'No questions asked') } },
  { id: 'demo-4', type: 'badge', settings: { icon: 'headset', image: '', text: tr('دعم ٧ أيام', 'Support 7 days a week'), caption: tr('واتساب وبريد', 'WhatsApp & email') } },
];

export const trustBadgesSchema = defineSection({
  type: 'trust-badges',
  label: 'Trust badges',
  description: 'Small icons with guarantees and payment reassurance.',
  category: 'marketing',
  icon: 'HiOutlineShieldCheck',
  variants: BADGE_LAYOUTS,
  blocks: { types: [badgeBlock], max: 8 },
  settings: [
    fields.text('title', 'Title', ''),
    variantSelect(BADGE_LAYOUTS, 'row'),
    fields.select('columns', 'Columns (Grid)', OPTIONS.columns(2, 6), '4'),
    fields.select('background', 'Background', OPTIONS.background, 'surface'),
    ...spacingFields(32),
  ],
  presets: [{ label: 'Store guarantees', settings: { blocks: DEMO_BADGES } }],
});

export function TrustBadges(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(trustBadgesSchema, props.settings);
  const layout = useVariant(trustBadgesSchema, props.settings);
  const badges = useSectionBlocks(trustBadgesSchema, s, undefined, DEMO_BADGES).filter((b) => str(b.settings, 'text'));
  if (badges.length === 0) return null;
  const tiles = badges.map((block) => {
    const b = block.settings;
    return (
      <div key={block.id} className="lib-badge-tile">
        <span className="lib-badge-tile__icon">
          {str(b, 'image') ? <LibImage src={str(b, 'image')} alt="" className="lib-badge-tile__img" /> : <LibIcon name={str(b, 'icon', 'shield')} size={22} />}
        </span>
        <span className="lib-badge-tile__text">
          <span className="lib-badge-tile__title">{str(b, 'text')}</span>
          {str(b, 'caption') ? <span className="lib-badge-tile__caption">{str(b, 'caption')}</span> : null}
        </span>
      </div>
    );
  });
  return (
    <LibSection title={str(s, 'title')} align="center" className={cn('lib-badges', `lib-badges--${layout}`, bandClass(str(s, 'background', 'surface')))} style={spacingStyle(s)}>
      {layout === 'grid' ? <LibGrid style={gridStyle(num(s, 'columns', 4), 2)}>{tiles}</LibGrid> : <div className="lib-badges__row">{tiles}</div>}
    </LibSection>
  );
}
