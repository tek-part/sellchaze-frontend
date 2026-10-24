/**
 * stride-sport-tiles — shop by sport / activity. Each `sport` block is a tile with a numbered index,
 * a sport glyph, its name and an optional caption; an uploaded image turns the tile into a photo tile.
 * Two layouts: an even grid of tiles, or a snap-scrolling strip of compact chips.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import {
  LibImage, LibSection, defineBlock, defineSection, fields, spacingFields, spacingStyle, str, tr, useLocaleCode, useSectionBlocks,
  useSectionSettings, useVariant, variantSelect, variants, type RawBlock,
} from '../../../sections-lib';
import { SPORT_ICON_OPTIONS, SportIcon } from './sport-icons';

export const sportBlock = defineBlock({
  type: 'sport',
  label: 'Sport',
  icon: 'HiOutlineTrophy',
  limit: 12,
  settings: [
    fields.text('label', 'Name', tr('الجري', 'Running')),
    fields.select('icon', 'Icon', SPORT_ICON_OPTIONS, 'running'),
    fields.text('caption', 'Caption', ''),
    fields.url('url', 'Link', '/shop'),
    fields.image('image', 'Image (optional)', ''),
  ],
});

export const SPORT_LAYOUTS = variants('layout', [
  { value: 'tiles', label: 'Tiles', description: 'Numbered tiles in an even grid.', icon: 'HiOutlineSquares2X2' },
  { value: 'strip', label: 'Strip', description: 'Compact chips in a scrolling strip.', icon: 'HiOutlineArrowsRightLeft' },
]);

const sport = (id: string, ar: string, en: string, icon: string, capAr: string, capEn: string, url: string): RawBlock => ({
  id, type: 'sport', settings: { label: tr(ar, en), icon, caption: tr(capAr, capEn), url },
});

export const DEMO_SPORTS: ReadonlyArray<RawBlock> = [
  sport('demo-run', 'الجري', 'Running', 'running', 'أحذية جري وملابس خفيفة', 'Road & trail shoes, light layers', '/collections/running'),
  sport('demo-gym', 'الجيم والتمرين', 'Gym & training', 'gym', 'تيشيرتات، شورتات وجوانتيات', 'Tees, shorts and gloves', '/collections/training'),
  sport('demo-foot', 'كرة القدم', 'Football', 'football', 'جزم ملاعب وطقوم', 'Boots and kits', '/collections/football'),
  sport('demo-bball', 'كرة السلة', 'Basketball', 'basketball', 'أحذية عالية وشورتات', 'High-tops and shorts', '/collections/basketball'),
  sport('demo-padel', 'بادل وتنس', 'Padel & tennis', 'racket', 'مضارب وأحذية ملاعب', 'Rackets and court shoes', '/collections/padel'),
  sport('demo-fuel', 'المكملات والإكسسوارات', 'Fuel & accessories', 'supplements', 'شيكرات، زجاجات وشنط', 'Shakers, bottles and bags', '/collections/accessories'),
];

export const strideSportTilesSchema = defineSection({
  type: 'stride-sport-tiles',
  label: 'Shop by sport',
  description: 'Numbered sport / activity tiles that link to collections.',
  category: 'categories',
  icon: 'HiOutlineTrophy',
  variants: SPORT_LAYOUTS,
  blocks: { types: [sportBlock], max: 12 },
  settings: [
    variantSelect(SPORT_LAYOUTS, 'tiles'),
    fields.text('eyebrow', 'Eyebrow', tr('اختار رياضتك', 'Pick your game')),
    fields.text('title', 'Title', tr('تسوق حسب الرياضة', 'Shop by sport')),
    fields.text('subtitle', 'Subtitle', ''),
    ...spacingFields(),
  ],
  presets: [{ label: 'Six sports', settings: { blocks: DEMO_SPORTS } }],
});

export function StrideSportTiles(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(strideSportTilesSchema, props.settings);
  const layout = useVariant(strideSportTilesSchema, props.settings);
  const locale = useLocaleCode();
  const blocks = useSectionBlocks(strideSportTilesSchema, s, undefined, DEMO_SPORTS).filter((b) => str(b.settings, 'label'));
  if (blocks.length === 0) return null;
  const fmt = new Intl.NumberFormat(locale.startsWith('ar') ? 'ar-EG' : 'en', { minimumIntegerDigits: 2 });

  return (
    <LibSection eyebrow={str(s, 'eyebrow')} title={str(s, 'title')} subtitle={str(s, 'subtitle')} className={cn('st-sports', `st-sports--${layout}`)} style={spacingStyle(s)}>
      <ul className="st-sports__list" style={{ '--st-count': blocks.length } as CSSProperties}>
        {blocks.map((b, i) => {
          const image = str(b.settings, 'image');
          return (
            <li key={b.id} className="st-sports__item">
              <a href={str(b.settings, 'url', '/shop')} className={cn('st-sport', image && 'has-image')}>
                {image && layout === 'tiles' ? (
                  <span className="st-sport__media" aria-hidden>
                    <LibImage src={image} alt="" sizes="(min-width: 1024px) 25vw, 50vw" className="st-sport__img" />
                  </span>
                ) : null}
                <span className="st-sport__index" aria-hidden>{fmt.format(i + 1)}</span>
                <SportIcon name={str(b.settings, 'icon', 'running')} className="st-sport__icon" />
                <span className="st-sport__text">
                  <span className="st-sport__name">{str(b.settings, 'label')}</span>
                  {str(b.settings, 'caption') && layout === 'tiles' ? <span className="st-sport__caption">{str(b.settings, 'caption')}</span> : null}
                </span>
                <span className="st-sport__arrow" aria-hidden>→</span>
              </a>
            </li>
          );
        })}
      </ul>
    </LibSection>
  );
}
