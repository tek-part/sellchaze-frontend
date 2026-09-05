/**
 * features — "why shop with us" USP row: icon + title + text per item, as cards or plain columns.
 * Icons are a small built-in set (no icon font) chosen by key.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { bandClass, gridStyle, list, num, spacingStyle, str, useSectionSettings } from '../use-section';
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
};

const ICON_OPTIONS = Object.keys(ICONS).map((k) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));

export function LibIcon(props: { name: string; className?: string }): ReactElement {
  const d = ICONS[props.name] ?? ICONS['star']!;
  return (
    <svg className={props.className} viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const featuresSchema = defineSection({
  type: 'features',
  label: 'Store features',
  description: 'Icons with short reasons to shop with you.',
  category: 'marketing',
  icon: 'HiOutlineSparkles',
  settings: [
    fields.text('title', 'Title', ''),
    fields.text('subtitle', 'Subtitle', ''),
    fields.list(
      'items',
      'Features',
      [fields.select('icon', 'Icon', ICON_OPTIONS, 'truck'), fields.text('title', 'Title', ''), fields.text('text', 'Text', ''), fields.url('url', 'Link', '')],
      [
        { icon: 'truck', title: tr('شحن سريع', 'Fast shipping'), text: tr('توصيل خلال ٢-٥ أيام عمل', 'Delivered in 2–5 business days'), url: '' },
        { icon: 'refresh', title: tr('إرجاع سهل', 'Easy returns'), text: tr('خلال ١٤ يوماً بدون أسئلة', '14 days, no questions asked'), url: '' },
        { icon: 'shield', title: tr('دفع آمن', 'Secure payment'), text: tr('مدى، فيزا، ماستركارد وأبل باي', 'Mada, Visa, Mastercard & Apple Pay'), url: '' },
        { icon: 'headset', title: tr('دعم متواصل', 'Always-on support'), text: tr('فريقنا جاهز لمساعدتك', 'Our team is ready to help'), url: '' },
      ],
      8,
    ),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.select('style', 'Style', [{ value: 'cards', label: 'Cards' }, { value: 'plain', label: 'Plain' }, { value: 'inline', label: 'Inline row' }], 'cards'),
    fields.select('align', 'Alignment', OPTIONS.align, 'center'),
    fields.select('background', 'Background', OPTIONS.background, 'none'),
    ...spacingFields(48),
  ],
});

export function Features(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(featuresSchema, props.settings);
  const items = list(s, 'items').filter((i) => str(i, 'title'));
  if (items.length === 0) return null;
  const style = str(s, 'style', 'cards');
  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" className={bandClass(str(s, 'background', 'none'))} style={spacingStyle(s)}>
      <LibGrid style={gridStyle(num(s, 'columns', 4), style === 'inline' ? 1 : 2)} className={cn('lib-features', `lib-features--${style}`, `lib-features--${str(s, 'align', 'center')}`)}>
        {items.map((item, i) => {
          const url = str(item, 'url');
          const inner = (
            <>
              <span className="lib-feature__icon"><LibIcon name={str(item, 'icon', 'star')} /></span>
              <span className="lib-feature__text">
                <span className="lib-feature__title">{str(item, 'title')}</span>
                {str(item, 'text') ? <span className="lib-feature__desc">{str(item, 'text')}</span> : null}
              </span>
            </>
          );
          return url ? <a key={i} href={url} className="lib-feature">{inner}</a> : <div key={i} className="lib-feature">{inner}</div>;
        })}
      </LibGrid>
    </LibSection>
  );
}
