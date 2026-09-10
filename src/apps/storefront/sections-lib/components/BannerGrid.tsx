/**
 * banner-grid — promotional image tiles from `banner` blocks with an optional title/subtitle/CTA
 * overlay. Layouts: two · three · four across, mosaic (one large + two small) or a single wide band.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect } from '../schema';
import { aspectClass, gridStyle, num, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { LibGrid, LibImage, LibSection } from '../primitives';

const BANNER_FIELDS = [
  fields.image('image', 'Image', ''),
  fields.text('eyebrow', 'Eyebrow', ''),
  fields.text('title', 'Title', ''),
  fields.text('subtitle', 'Subtitle', ''),
  fields.text('cta_label', 'Button label', ''),
  fields.url('link', 'Link', '/shop'),
  fields.select('align', 'Text position', [{ value: 'start', label: 'Bottom start' }, { value: 'center', label: 'Center' }, { value: 'end', label: 'Bottom end' }], 'start'),
] as const;

export const bannerBlock = defineBlock({ type: 'banner', label: 'Banner', icon: 'HiOutlinePhoto', settings: BANNER_FIELDS, limit: 8 });

export const BANNER_LAYOUTS = variants('layout', [
  { value: 'two', label: 'Two across', description: 'Two equal tiles per row.', icon: 'HiOutlineViewColumns' },
  { value: 'three', label: 'Three across', description: 'Three equal tiles per row.', icon: 'HiOutlineSquares2X2' },
  { value: 'mosaic', label: 'Mosaic', description: 'One tall tile beside two stacked tiles.', icon: 'HiOutlineRectangleGroup' },
  { value: 'four', label: 'Four across', description: 'Four compact tiles per row.', icon: 'HiOutlineSquares2X2' },
  { value: 'single-wide', label: 'Single wide', description: 'One banner spanning the full width.', icon: 'HiOutlineRectangleStack' },
], { columns: { '1': 'single-wide', '2': 'two', '3': 'three', '4': 'four' } });

const COLS: Readonly<Record<string, number>> = { two: 2, three: 3, mosaic: 2, four: 4, 'single-wide': 1 };

export const bannerGridSchema = defineSection({
  type: 'banner-grid',
  label: 'Banner grid',
  description: 'Promotional image tiles with a title and link.',
  category: 'marketing',
  icon: 'HiOutlineViewColumns',
  variants: BANNER_LAYOUTS,
  blocks: { types: [bannerBlock], max: 8, legacy: 'banners' },
  settings: [
    fields.text('title', 'Title', ''),
    variantSelect(BANNER_LAYOUTS, 'two'),
    fields.list(
      'banners',
      'Banners',
      BANNER_FIELDS,
      [
        { image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&h=800&q=80', eyebrow: tr('جديد', 'New'), title: tr('تشكيلة الرجال', 'Men’s edit'), subtitle: '', cta_label: tr('تسوق', 'Shop'), link: '/shop', align: 'start' },
        { image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&h=800&q=80', eyebrow: tr('الأكثر طلباً', 'Most wanted'), title: tr('تشكيلة النساء', 'Women’s edit'), subtitle: '', cta_label: tr('تسوق', 'Shop'), link: '/shop', align: 'start' },
        { image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&h=800&q=80', eyebrow: tr('إكسسوارات', 'Accessories'), title: tr('اللمسة الأخيرة', 'The finishing touch'), subtitle: '', cta_label: tr('تسوق', 'Shop'), link: '/shop', align: 'start' },
      ],
      8,
    ),
    fields.select('aspect', 'Image ratio', OPTIONS.aspect, 'landscape'),
    fields.range('overlay', 'Overlay darkness', 25, 0, 80, 5),
    fields.select('style', 'Style', [{ value: 'overlay', label: 'Text over image' }, { value: 'below', label: 'Text below image' }], 'overlay'),
    ...spacingFields(48),
  ],
});

export function BannerGrid(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(bannerGridSchema, props.settings);
  const layout = useVariant(bannerGridSchema, props.settings);
  const banners = useSectionBlocks(bannerGridSchema, s).filter((b) => str(b.settings, 'image') || str(b.settings, 'title'));
  if (banners.length === 0) return null;
  const overlay = num(s, 'overlay', 25) / 100;
  const below = str(s, 'style') === 'below';
  const columns = COLS[layout] ?? 2;
  const shown = layout === 'single-wide' ? banners.slice(0, 1) : layout === 'mosaic' ? banners.slice(0, 3) : layout === 'two' ? banners.slice(0, 2) : banners;
  const aspect = layout === 'single-wide' ? 'wide' : str(s, 'aspect', 'landscape');
  return (
    <LibSection title={str(s, 'title')} style={spacingStyle(s)}>
      <LibGrid
        style={{ ...gridStyle(columns, layout === 'four' ? 2 : 1), '--lib-overlay': String(overlay) } as CSSProperties}
        className={cn(aspectClass(aspect), `lib-banners--${layout}`)}
      >
        {shown.map((block, i) => {
          const b = block.settings;
          const link = str(b, 'link', '/shop');
          const title = str(b, 'title');
          return (
            <a key={block.id} href={link} className={cn('lib-banner', `lib-banner--${str(b, 'align', 'start')}`, below && 'lib-banner--below')}>
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
