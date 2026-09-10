/**
 * brand-logos — brand marks as a scrolling row, a wrapped grid or an auto-scrolling marquee.
 * `source: store` reads the store's brands (logo or wordmark); `custom` uses `logo` blocks.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { prefersReducedMotion } from '../../../../shared/env/media';
import { defineBlock, defineSection, fields, spacingFields, tr, variants, variantSelect } from '../schema';
import { bool, num, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { useSectionData } from '../data';
import { LibCarousel, LibImage, LibSection } from '../primitives';

interface Logo {
  id: string;
  name: string;
  image: string;
  url: string;
}

const LOGO_FIELDS = [fields.image('image', 'Logo', ''), fields.text('name', 'Name', ''), fields.url('url', 'Link', '')] as const;

export const logoBlock = defineBlock({ type: 'logo', label: 'Logo', icon: 'HiOutlineBuildingStorefront', settings: LOGO_FIELDS, limit: 16 });

export const LOGO_LAYOUTS = variants('layout', [
  { value: 'row', label: 'Row', description: 'A scrollable single row.', icon: 'HiOutlineArrowsRightLeft' },
  { value: 'grid', label: 'Grid', description: 'Logos wrapped into rows.', icon: 'HiOutlineSquares2X2' },
  { value: 'marquee', label: 'Marquee', description: 'A slow auto-scrolling strip.', icon: 'HiOutlineForward' },
], { layout: { wrap: 'grid' } });

export const brandLogosSchema = defineSection({
  type: 'brand-logos',
  label: 'Brand logos',
  description: 'A row of the brands you carry.',
  category: 'social',
  icon: 'HiOutlineBuildingStorefront',
  variants: LOGO_LAYOUTS,
  blocks: { types: [logoBlock], max: 16, legacy: 'items' },
  settings: [
    fields.text('title', 'Title', tr('علاماتنا التجارية', 'Brands we carry')),
    variantSelect(LOGO_LAYOUTS, 'row'),
    fields.select('source', 'Source', [{ value: 'store', label: 'Store brands' }, { value: 'custom', label: 'Custom logos' }], 'store'),
    fields.list('items', 'Custom logos', LOGO_FIELDS, [], 16),
    fields.range('limit', 'Max logos', 10, 2, 24),
    fields.toggle('grayscale', 'Grayscale until hover', true),
    ...spacingFields(40),
  ],
});

export function BrandLogos(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(brandLogosSchema, props.settings);
  const layout = useVariant(brandLogosSchema, props.settings);
  const data = useSectionData(props.context);
  const custom = useSectionBlocks(brandLogosSchema, s);
  const limit = num(s, 'limit', 10);
  let logos: Logo[] = [];
  if (str(s, 'source', 'store') === 'custom') {
    logos = custom.map((b) => ({ id: b.id, name: str(b.settings, 'name'), image: str(b.settings, 'image'), url: str(b.settings, 'url') })).filter((l) => l.image || l.name);
  }
  if (logos.length === 0) logos = data.brands().map((b) => ({ id: b.id, name: b.name, image: b.logo ?? '', url: b.url }));
  logos = logos.slice(0, limit);
  if (logos.length === 0) return null;

  const tile = (l: Logo, key: string): ReactElement => {
    const inner = l.image ? <LibImage src={l.image} alt={l.name} className="lib-logo__img" /> : <span className="lib-logo__word">{l.name}</span>;
    return l.url ? <a key={key} href={l.url} className="lib-logo" title={l.name}>{inner}</a> : <div key={key} className="lib-logo" title={l.name}>{inner}</div>;
  };
  const tiles = logos.map((l) => tile(l, l.id));
  const marquee = layout === 'marquee' && !prefersReducedMotion();

  return (
    <LibSection title={str(s, 'title')} align="center" className={cn('lib-logos', `lib-logos--${layout}`, bool(s, 'grayscale', true) && 'lib-logos--gray')} style={spacingStyle(s)}>
      {marquee ? (
        <div className="lib-logos__marquee" aria-label={str(s, 'title') || 'Brands'}>
          <div className="lib-logos__track">
            {tiles}
            {logos.map((l) => tile(l, `${l.id}-dup`))}
          </div>
        </div>
      ) : layout === 'row' ? (
        <LibCarousel ariaLabel={str(s, 'title') || 'Brands'} itemSize="logo" showArrows={false}>{tiles}</LibCarousel>
      ) : (
        <div className="lib-logos__wrap">{tiles}</div>
      )}
    </LibSection>
  );
}
