/**
 * collage — a mosaic of `tile` blocks. Each tile is small or large and shows an image, a looping
 * video, a product card or a category; large tiles span two columns and two rows on desktop.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { prefersReducedMotion } from '../../../../shared/env/media';
import { defineBlock, defineSection, fields, spacingFields, tr, variants, variantSelect, type RawBlock } from '../schema';
import { num, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { useSectionData } from '../data';
import { LibCategoryCard, LibImage, LibProductCard, LibSection } from '../primitives';

const TILE_FIELDS = [
  fields.select('size', 'Size', [{ value: 'small', label: 'Small' }, { value: 'large', label: 'Large (2×2)' }], 'small'),
  fields.select('kind', 'Content', [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }, { value: 'product', label: 'Product' }, { value: 'collection', label: 'Category' }], 'image'),
  fields.image('image', 'Image', ''),
  fields.url('video', 'Video (MP4 / WebM)', ''),
  fields.product('product', 'Product'),
  fields.category('collection', 'Category'),
  fields.text('heading', 'Heading', ''),
  fields.text('text', 'Text', ''),
  fields.url('url', 'Link', ''),
] as const;

export const tileBlock = defineBlock({ type: 'tile', label: 'Tile', icon: 'HiOutlineSquare2Stack', settings: TILE_FIELDS, limit: 8 });

export const COLLAGE_LAYOUTS = variants('layout', [
  { value: 'left', label: 'Large first', description: 'The large tile leads on the start side.', icon: 'HiOutlineRectangleGroup' },
  { value: 'right', label: 'Large last', description: 'The large tile sits on the end side.', icon: 'HiOutlineRectangleGroup' },
]);

const u = (id: string, w = 1200, h = 1200): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
const DEMO_TILES: ReadonlyArray<RawBlock> = [
  { id: 'demo-1', type: 'tile', settings: { size: 'large', kind: 'image', image: u('photo-1441986300917-64674bd600d8'), heading: tr('تشكيلة الموسم', 'The season edit'), text: tr('قطع مختارة لكل يوم', 'Hand-picked pieces for every day'), url: '/shop' } },
  { id: 'demo-2', type: 'tile', settings: { size: 'small', kind: 'product', product: '' } },
  { id: 'demo-3', type: 'tile', settings: { size: 'small', kind: 'collection', collection: '' } },
  { id: 'demo-4', type: 'tile', settings: { size: 'small', kind: 'image', image: u('photo-1523381210434-271e8be1f52b', 900, 900), heading: tr('وصل حديثاً', 'Just in'), url: '/collections/new-arrivals' } },
  { id: 'demo-5', type: 'tile', settings: { size: 'small', kind: 'image', image: u('photo-1490481651871-ab68de25d43d', 900, 900), heading: tr('الأكثر مبيعاً', 'Best sellers'), url: '/collections/best-sellers' } },
];

export const collageSchema = defineSection({
  type: 'collage',
  label: 'Collage',
  description: 'A mosaic of images, video, a product and a category.',
  category: 'marketing',
  icon: 'HiOutlineRectangleGroup',
  variants: COLLAGE_LAYOUTS,
  blocks: { types: [tileBlock], max: 8 },
  settings: [
    fields.text('title', 'Title', ''),
    variantSelect(COLLAGE_LAYOUTS, 'left'),
    fields.range('overlay', 'Overlay darkness', 30, 0, 80, 5),
    ...spacingFields(),
  ],
  presets: [{ label: 'Season collage', settings: { blocks: DEMO_TILES } }],
});

const VIDEO_RE = /\.(mp4|webm|ogg)(\?|$)/i;

export function Collage(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(collageSchema, props.settings);
  const layout = useVariant(collageSchema, props.settings);
  const data = useSectionData(props.context);
  const tiles = useSectionBlocks(collageSchema, s, undefined, DEMO_TILES);
  if (tiles.length === 0) return null;
  const still = prefersReducedMotion();
  return (
    <LibSection title={str(s, 'title')} style={spacingStyle(s)}>
      <div className={cn('lib-collage', `lib-collage--${layout}`)} style={{ '--lib-overlay': String(num(s, 'overlay', 30) / 100) } as CSSProperties}>
        {tiles.map((block, i) => {
          const b = block.settings;
          const large = str(b, 'size', 'small') === 'large';
          const kind = str(b, 'kind', 'image');
          const cls = cn('lib-collage__tile', large && 'lib-collage__tile--large', `lib-collage__tile--${kind}`);
          if (kind === 'product') {
            const product = data.product(str(b, 'product')) ?? data.products('featured', 1)[0];
            return product ? <div key={block.id} className={cls}><LibProductCard product={product} eager={i < 2} /></div> : null;
          }
          if (kind === 'collection') {
            const category = data.category(str(b, 'collection')) ?? data.categories(1)[0];
            return category ? <div key={block.id} className={cls}><LibCategoryCard category={category} variant="overlay" eager={i < 2} /></div> : null;
          }
          const video = str(b, 'video');
          const image = str(b, 'image');
          const heading = str(b, 'heading');
          const url = str(b, 'url');
          const media = kind === 'video' && video && VIDEO_RE.test(video) && !still ? (
            <video className="lib-collage__video" src={video} poster={image || undefined} autoPlay muted loop playsInline aria-hidden />
          ) : (
            <LibImage src={image} alt={heading} className="lib-collage__img" eager={i < 2} monogram="·" />
          );
          const inner = (
            <>
              <span className="lib-collage__media">{media}</span>
              {heading || str(b, 'text') ? (
                <span className="lib-collage__text">
                  {heading ? <span className="lib-collage__heading">{heading}</span> : null}
                  {str(b, 'text') ? <span className="lib-collage__sub">{str(b, 'text')}</span> : null}
                </span>
              ) : null}
            </>
          );
          return url ? <a key={block.id} href={url} className={cls}>{inner}</a> : <div key={block.id} className={cls}>{inner}</div>;
        })}
      </div>
    </LibSection>
  );
}
