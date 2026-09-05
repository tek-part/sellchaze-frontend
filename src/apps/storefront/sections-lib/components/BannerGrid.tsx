/**
 * banner-grid — promotional image tiles (2–4 per row) with optional title/subtitle/CTA overlay.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { aspectClass, gridStyle, list, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { LibGrid, LibImage, LibSection } from '../primitives';

export const bannerGridSchema = defineSection({
  type: 'banner-grid',
  label: 'Banner grid',
  description: 'Promotional image tiles with a title and link.',
  category: 'marketing',
  icon: 'HiOutlineViewColumns',
  settings: [
    fields.text('title', 'Title', ''),
    fields.list(
      'banners',
      'Banners',
      [
        fields.image('image', 'Image', ''),
        fields.text('eyebrow', 'Eyebrow', ''),
        fields.text('title', 'Title', ''),
        fields.text('subtitle', 'Subtitle', ''),
        fields.text('cta_label', 'Button label', ''),
        fields.url('link', 'Link', '/shop'),
        fields.select('align', 'Text position', [{ value: 'start', label: 'Bottom start' }, { value: 'center', label: 'Center' }, { value: 'end', label: 'Bottom end' }], 'start'),
      ],
      [
        { image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&h=800&q=80', eyebrow: tr('جديد', 'New'), title: tr('تشكيلة الرجال', 'Men’s edit'), subtitle: '', cta_label: tr('تسوق', 'Shop'), link: '/shop', align: 'start' },
        { image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&h=800&q=80', eyebrow: tr('الأكثر طلباً', 'Most wanted'), title: tr('تشكيلة النساء', 'Women’s edit'), subtitle: '', cta_label: tr('تسوق', 'Shop'), link: '/shop', align: 'start' },
      ],
      6,
    ),
    fields.select('columns', 'Columns', OPTIONS.columns(1, 4), '2'),
    fields.select('aspect', 'Image ratio', OPTIONS.aspect, 'landscape'),
    fields.range('overlay', 'Overlay darkness', 25, 0, 80, 5),
    fields.select('style', 'Style', [{ value: 'overlay', label: 'Text over image' }, { value: 'below', label: 'Text below image' }], 'overlay'),
    ...spacingFields(48),
  ],
});

export function BannerGrid(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(bannerGridSchema, props.settings);
  const banners = list(s, 'banners').filter((b) => str(b, 'image') || str(b, 'title'));
  if (banners.length === 0) return null;
  const overlay = num(s, 'overlay', 25) / 100;
  const below = str(s, 'style') === 'below';
  return (
    <LibSection title={str(s, 'title')} style={spacingStyle(s)}>
      <LibGrid style={{ ...gridStyle(num(s, 'columns', 2), 1), '--lib-overlay': String(overlay) } as CSSProperties} className={aspectClass(str(s, 'aspect', 'landscape'))}>
        {banners.map((b, i) => {
          const link = str(b, 'link', '/shop');
          const title = str(b, 'title');
          return (
            <a key={i} href={link} className={cn('lib-banner', `lib-banner--${str(b, 'align', 'start')}`, below && 'lib-banner--below')}>
              <span className="lib-banner__media">
                <LibImage src={str(b, 'image')} alt={title} className="lib-banner__img" eager={i < 2} />
                {!below ? <span className="lib-banner__scrim" aria-hidden /> : null}
              </span>
              {title || str(b, 'eyebrow') || str(b, 'cta_label') ? (
                <span className="lib-banner__text">
                  {str(b, 'eyebrow') ? <span className="lib-banner__eyebrow">{str(b, 'eyebrow')}</span> : null}
                  {title ? <span className="lib-banner__title">{title}</span> : null}
                  {str(b, 'subtitle') ? <span className="lib-banner__sub">{str(b, 'subtitle')}</span> : null}
                  {str(b, 'cta_label') ? <span className="lib-banner__cta">{str(b, 'cta_label')} <span aria-hidden className="lib-link__arrow">→</span></span> : null}
                </span>
              ) : null}
            </a>
          );
        })}
      </LibGrid>
    </LibSection>
  );
}
