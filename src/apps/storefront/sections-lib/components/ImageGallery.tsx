/**
 * image-gallery — `image` blocks (image, caption, link) as an even grid, a masonry flow or a
 * carousel. Lookbooks, store photos, campaign shots.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect, type RawBlock } from '../schema';
import { aspectClass, bool, gridStyle, num, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { LibCarousel, LibGrid, LibImage, LibSection } from '../primitives';

const IMAGE_FIELDS = [
  fields.image('image', 'Image', ''),
  fields.text('caption', 'Caption', ''),
  fields.url('url', 'Link', ''),
] as const;

export const imageBlock = defineBlock({ type: 'image', label: 'Image', icon: 'HiOutlinePhoto', settings: IMAGE_FIELDS, limit: 24 });

export const GALLERY_LAYOUTS = variants('layout', [
  { value: 'grid', label: 'Grid', description: 'Even tiles with one ratio.', icon: 'HiOutlineSquares2X2' },
  { value: 'masonry', label: 'Masonry', description: 'Natural heights flowing in columns.', icon: 'HiOutlineRectangleGroup' },
  { value: 'carousel', label: 'Carousel', description: 'A scrolling rail of images.', icon: 'HiOutlineArrowsRightLeft' },
]);

const u = (id: string, w = 900, h = 900): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
const DEMO_IMAGES: ReadonlyArray<RawBlock> = [
  { id: 'demo-1', type: 'image', settings: { image: u('photo-1523275335684-37898b6baf30'), caption: tr('تفاصيل تصنع الفرق', 'Details that matter'), url: '' } },
  { id: 'demo-2', type: 'image', settings: { image: u('photo-1526170375885-4d8ecf77b99f', 900, 1200), caption: tr('في المتجر', 'In store'), url: '' } },
  { id: 'demo-3', type: 'image', settings: { image: u('photo-1441984904996-e0b6ba687e04'), caption: tr('تشكيلة الموسم', 'This season'), url: '' } },
  { id: 'demo-4', type: 'image', settings: { image: u('photo-1483985988355-763728e1935b', 900, 1200), caption: '', url: '' } },
  { id: 'demo-5', type: 'image', settings: { image: u('photo-1490481651871-ab68de25d43d'), caption: tr('من عملائنا', 'From our customers'), url: '' } },
  { id: 'demo-6', type: 'image', settings: { image: u('photo-1512436991641-6745cdb1723f', 900, 700), caption: '', url: '' } },
];

export const imageGallerySchema = defineSection({
  type: 'image-gallery',
  label: 'Image gallery',
  description: 'A grid, masonry or carousel of images with captions.',
  category: 'content',
  icon: 'HiOutlinePhoto',
  variants: GALLERY_LAYOUTS,
  blocks: { types: [imageBlock], max: 24 },
  settings: [
    fields.text('title', 'Title', tr('من أجوائنا', 'Our world')),
    fields.text('subtitle', 'Subtitle', ''),
    variantSelect(GALLERY_LAYOUTS, 'grid'),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '3'),
    fields.select('aspect', 'Image ratio (Grid)', OPTIONS.aspect, 'square'),
    fields.toggle('show_captions', 'Show captions', true),
    fields.toggle('rounded', 'Rounded corners', true),
    ...spacingFields(),
  ],
  presets: [{ label: 'Lookbook', settings: { blocks: DEMO_IMAGES } }],
});

export function ImageGallery(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(imageGallerySchema, props.settings);
  const layout = useVariant(imageGallerySchema, props.settings);
  const images = useSectionBlocks(imageGallerySchema, s, undefined, DEMO_IMAGES).filter((b) => str(b.settings, 'image'));
  if (images.length === 0) return null;
  const captions = bool(s, 'show_captions', true);
  const columns = num(s, 'columns', 3);
  const tiles = images.map((block, i) => {
    const b = block.settings;
    const caption = str(b, 'caption');
    const url = str(b, 'url');
    const inner = (
      <>
        <span className="lib-gallery__media"><LibImage src={str(b, 'image')} alt={caption} className="lib-gallery__img" eager={i < columns} /></span>
        {captions && caption ? <span className="lib-gallery__caption">{caption}</span> : null}
      </>
    );
    return url ? <a key={block.id} href={url} className="lib-gallery__item">{inner}</a> : <figure key={block.id} className="lib-gallery__item">{inner}</figure>;
  });
  const cls = cn('lib-gallery', `lib-gallery--${layout}`, bool(s, 'rounded', true) && 'lib-gallery--rounded');
  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" style={spacingStyle(s)}>
      {layout === 'carousel' ? (
        <div className={cls}><LibCarousel ariaLabel={str(s, 'title') || 'Gallery'} itemSize="wide">{tiles}</LibCarousel></div>
      ) : layout === 'masonry' ? (
        <div className={cls} style={gridStyle(columns, 2)}>{tiles}</div>
      ) : (
        <LibGrid style={gridStyle(columns, 2)} className={cn(cls, aspectClass(str(s, 'aspect', 'square')))}>{tiles}</LibGrid>
      )}
    </LibSection>
  );
}
