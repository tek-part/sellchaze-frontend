/**
 * brand-logos — a row of brand marks. `source: store` reads the store's brands (logo or wordmark);
 * `custom` uses the merchant's list of image + link.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, spacingFields, tr } from '../schema';
import { bool, list, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibCarousel, LibImage, LibSection } from '../primitives';

interface Logo {
  name: string;
  image: string;
  url: string;
}

export const brandLogosSchema = defineSection({
  type: 'brand-logos',
  label: 'Brand logos',
  description: 'A row of the brands you carry.',
  category: 'social',
  icon: 'HiOutlineBuildingStorefront',
  settings: [
    fields.text('title', 'Title', tr('علاماتنا التجارية', 'Brands we carry')),
    fields.select('source', 'Source', [{ value: 'store', label: 'Store brands' }, { value: 'custom', label: 'Custom list' }], 'store'),
    fields.list('items', 'Custom logos', [fields.image('image', 'Logo', ''), fields.text('name', 'Name', ''), fields.url('url', 'Link', '')], [], 16),
    fields.range('limit', 'Max logos', 10, 2, 24),
    fields.toggle('grayscale', 'Grayscale until hover', true),
    fields.select('layout', 'Layout', [{ value: 'row', label: 'Scrolling row' }, { value: 'wrap', label: 'Wrap' }], 'row'),
    ...spacingFields(40),
  ],
});

export function BrandLogos(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(brandLogosSchema, props.settings);
  const data = useSectionData(props.context);
  const limit = num(s, 'limit', 10);
  let logos: Logo[] = [];
  if (str(s, 'source', 'store') === 'custom') {
    logos = list(s, 'items').map((i) => ({ name: str(i, 'name'), image: str(i, 'image'), url: str(i, 'url') })).filter((l) => l.image || l.name);
  }
  if (logos.length === 0) logos = data.brands().map((b) => ({ name: b.name, image: b.logo ?? '', url: b.url }));
  logos = logos.slice(0, limit);
  if (logos.length === 0) return null;

  const tiles = logos.map((l, i) => {
    const inner = l.image ? <LibImage src={l.image} alt={l.name} className="lib-logo__img" /> : <span className="lib-logo__word">{l.name}</span>;
    return l.url ? <a key={i} href={l.url} className="lib-logo" title={l.name}>{inner}</a> : <div key={i} className="lib-logo" title={l.name}>{inner}</div>;
  });

  return (
    <LibSection title={str(s, 'title')} align="center" className={cn('lib-logos', bool(s, 'grayscale', true) && 'lib-logos--gray')} style={spacingStyle(s)}>
      {str(s, 'layout', 'row') === 'row' ? (
        <LibCarousel ariaLabel={str(s, 'title') || 'Brands'} itemSize="logo" showArrows={false}>{tiles}</LibCarousel>
      ) : (
        <div className="lib-logos__wrap">{tiles}</div>
      )}
    </LibSection>
  );
}
