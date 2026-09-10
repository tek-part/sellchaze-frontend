/**
 * features — "why shop with us" USPs from `feature` blocks (icon + title + text). Layouts: icons-row
 * (plain centred columns), cards, list (icon beside text, two columns) and strip (one compact line).
 * Icons are a small built-in set (no icon font) chosen by key.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect } from '../schema';
import { bandClass, gridStyle, num, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { LibGrid, LibSection } from '../primitives';

const ICONS: Record<string, string> = {
  truck: 'M3 7h11v8H3zM14 10h4l3 3v2h-7zM6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  shield: 'M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z',
  refresh: 'M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5',
  headset: 'M4 13a8 8 0 0 1 16 0M4 13v4a2 2 0 0 0 2 2h1v-6H4zm16 0v4a2 2 0 0 1-2 2h-1v-6h3zM12 21h3',
  card: 'M3 7h18v10H3zM3 11h18M7 15h3',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  gift: 'M4 11h16v10H4zM2 7h20v4H2zM12 7v14M12 7c-2-4-6-3-6-1s3 1 6 1zm0 0c2-4 6-3 6-1s-3 1-6 1z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  check: 'M20 6L9 17l-5-5',
  tag: 'M3 12V3h9l9 9-9 9zM7.5 7.5h.01',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  leaf: 'M5 20c0-8 4-13 14-14-1 10-6 14-14 14zM5 20l8-8',
  heart: 'M12 21s-7-4.6-9.3-9.2C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.2 2.4C11.6 6.1 13 5 15 5c3.6 0 5.4 3.6 3.9 6.8C19 16.4 12 21 12 21z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  chat: 'M4 5h16v11H9l-5 4z',
  box: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
  medal: 'M8 3h8l-2 6h-4zM12 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  none: '',
};

export const ICON_OPTIONS = Object.keys(ICONS).map((k) => ({ value: k, label: k === 'none' ? 'No icon' : k.charAt(0).toUpperCase() + k.slice(1) }));

export function LibIcon(props: { name: string; className?: string; size?: number }): ReactElement | null {
  if (props.name === 'none') return null;
  const d = ICONS[props.name] ?? ICONS['star']!;
  const size = props.size ?? 28;
  return (
    <svg className={props.className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const FEATURE_FIELDS = [
  fields.select('icon', 'Icon', ICON_OPTIONS, 'truck'),
  fields.text('title', 'Title', ''),
  fields.text('text', 'Text', ''),
  fields.url('url', 'Link', ''),
] as const;

export const featureBlock = defineBlock({ type: 'feature', label: 'Feature', icon: 'HiOutlineSparkles', settings: FEATURE_FIELDS, limit: 8 });

export const FEATURE_LAYOUTS = variants('layout', [
  { value: 'icons-row', label: 'Icons row', description: 'Centred icon, title and text per column.', icon: 'HiOutlineSparkles' },
  { value: 'cards', label: 'Cards', description: 'Each feature on its own card.', icon: 'HiOutlineSquares2X2' },
  { value: 'list', label: 'List', description: 'Icon beside text, two columns.', icon: 'HiOutlineListBullet' },
  { value: 'strip', label: 'Strip', description: 'One compact line, divided by rules.', icon: 'HiOutlineMinus' },
], { style: { plain: 'icons-row', cards: 'cards', inline: 'strip' } });

export const featuresSchema = defineSection({
  type: 'features',
  label: 'Store features',
  description: 'Icons with short reasons to shop with you.',
  category: 'marketing',
  icon: 'HiOutlineSparkles',
  variants: FEATURE_LAYOUTS,
  blocks: { types: [featureBlock], max: 8, legacy: 'items' },
  settings: [
    fields.text('title', 'Title', ''),
    fields.text('subtitle', 'Subtitle', ''),
    variantSelect(FEATURE_LAYOUTS, 'cards'),
    fields.list(
      'items',
      'Features',
      FEATURE_FIELDS,
      [
        { icon: 'truck', title: tr('شحن سريع', 'Fast shipping'), text: tr('توصيل خلال ٢-٥ أيام عمل', 'Delivered in 2–5 business days'), url: '' },
        { icon: 'refresh', title: tr('إرجاع سهل', 'Easy returns'), text: tr('خلال ١٤ يوماً بدون أسئلة', '14 days, no questions asked'), url: '' },
        { icon: 'shield', title: tr('دفع آمن', 'Secure payment'), text: tr('مدى، فيزا، ماستركارد وأبل باي', 'Mada, Visa, Mastercard & Apple Pay'), url: '' },
        { icon: 'headset', title: tr('دعم متواصل', 'Always-on support'), text: tr('فريقنا جاهز لمساعدتك', 'Our team is ready to help'), url: '' },
      ],
      8,
    ),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.select('align', 'Alignment', OPTIONS.align, 'center'),
    fields.select('background', 'Background', OPTIONS.background, 'none'),
    ...spacingFields(48),
  ],
});

export function Features(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(featuresSchema, props.settings);
  const layout = useVariant(featuresSchema, props.settings);
  const items = useSectionBlocks(featuresSchema, s).filter((b) => str(b.settings, 'title'));
  if (items.length === 0) return null;
  const columns = layout === 'list' ? 2 : num(s, 'columns', 4);
  const align = layout === 'list' || layout === 'strip' ? 'start' : str(s, 'align', 'center');
  const tiles = items.map((block) => {
    const item = block.settings;
    const url = str(item, 'url');
    const inner = (
      <>
        {str(item, 'icon', 'star') !== 'none' ? <span className="lib-feature__icon"><LibIcon name={str(item, 'icon', 'star')} size={layout === 'strip' ? 22 : 28} /></span> : null}
        <span className="lib-feature__text">
          <span className="lib-feature__title">{str(item, 'title')}</span>
          {str(item, 'text') && layout !== 'strip' ? <span className="lib-feature__desc">{str(item, 'text')}</span> : null}
        </span>
      </>
    );
    return url ? <a key={block.id} href={url} className="lib-feature">{inner}</a> : <div key={block.id} className="lib-feature">{inner}</div>;
  });
  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" className={bandClass(str(s, 'background', 'none'))} style={spacingStyle(s)}>
      {layout === 'strip' ? (
        <div className={cn('lib-features', 'lib-features--strip')}>{tiles}</div>
      ) : (
        <LibGrid style={gridStyle(columns, layout === 'list' ? 1 : 2)} className={cn('lib-features', `lib-features--${layout}`, `lib-features--${align}`)}>{tiles}</LibGrid>
      )}
    </LibSection>
  );
}
