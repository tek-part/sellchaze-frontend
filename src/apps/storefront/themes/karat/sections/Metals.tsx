/**
 * karat-metals — "shop by metal & stone": editorial tiles (gold, silver, diamonds, pearls by default)
 * that link to filtered collections. Arched tiles step down in a slow rhythm; a tile without a photo
 * becomes a tonal composition — a metallic wash for its tone with a fine line drawing.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { LibImage, LibSection, defineSection, fields, list, str, tr, useSectionSettings } from '../../../sections-lib';
import { cn } from '../../../../../shared/utils/cn';
import { Motif, type MotifKind } from './motifs';

const TONES = [
  { value: 'gold', label: 'Yellow gold' },
  { value: 'rose', label: 'Rose gold' },
  { value: 'silver', label: 'Silver / white gold' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'pearl', label: 'Pearl' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'onyx', label: 'Onyx' },
] as const;

const MOTIFS = [
  { value: 'ring', label: 'Ring' },
  { value: 'chain', label: 'Chain & pendant' },
  { value: 'diamond', label: 'Cut diamond' },
  { value: 'pearl', label: 'Pearl strand' },
  { value: 'gem', label: 'Gemstone' },
  { value: 'watch', label: 'Watch' },
] as const;

export const karatMetalsSchema = defineSection({
  type: 'karat-metals',
  label: 'Karat — shop by metal & stone',
  description: 'Editorial tiles for gold, silver, diamonds, pearls (or any collection) with tonal fallbacks.',
  category: 'categories',
  icon: 'HiOutlineSwatch',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('المعادن والأحجار', 'Metals & stones')),
    fields.text('title', 'Title', tr('بريقٌ يناسب ذوقك', 'Choose your light')),
    fields.text('subtitle', 'Subtitle', tr('من الذهب الأصفر إلى اللؤلؤ الطبيعي — كل خامة بطابعها.', 'From yellow gold to natural pearls — each with a character of its own.')),
    fields.select('layout', 'Layout', [{ value: 'arches', label: 'Arched tiles' }, { value: 'panels', label: 'Tall panels' }], 'arches'),
    fields.list(
      'items',
      'Tiles',
      [
        fields.text('label', 'Name', ''),
        fields.text('caption', 'Detail line', ''),
        fields.image('image', 'Photo', '', 'Optional — without a photo the tile shows a tonal line drawing.'),
        fields.url('url', 'Link', '/shop'),
        fields.select('tone', 'Tone', TONES, 'gold'),
        fields.select('motif', 'Line drawing', MOTIFS, 'ring'),
      ],
      [
        { label: tr('الذهب', 'Gold'), caption: tr('عيار ١٨ · ٢١ · ٢٤', '18K · 21K · 24K'), image: '', url: '/collections/gold', tone: 'gold', motif: 'chain' },
        { label: tr('الفضة والذهب الأبيض', 'Silver & white gold'), caption: tr('فضة ٩٢٥ وذهب أبيض', 'Sterling 925 and white gold'), image: '', url: '/collections/silver', tone: 'silver', motif: 'ring' },
        { label: tr('الألماس', 'Diamonds'), caption: tr('أحجار بشهادات معتمدة', 'Certified stones'), image: '', url: '/collections/diamonds', tone: 'diamond', motif: 'diamond' },
        { label: tr('اللؤلؤ', 'Pearls'), caption: tr('لؤلؤ طبيعي ومستزرع', 'Natural and cultured'), image: '', url: '/collections/pearls', tone: 'pearl', motif: 'pearl' },
      ],
      6,
    ),
    fields.text('cta_label', 'Tile link label', tr('اكتشف', 'Discover')),
  ],
});

export function KaratMetals(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(karatMetalsSchema, props.settings);
  const items = list(s, 'items').filter((item) => str(item, 'label').trim() !== '');
  if (items.length === 0) return null;
  const layout = str(s, 'layout', 'arches') === 'panels' ? 'panels' : 'arches';
  const cta = str(s, 'cta_label');
  return (
    <LibSection eyebrow={str(s, 'eyebrow')} title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" className="kr-metals">
      <ul className={cn('kr-metals__list', `kr-metals__list--${layout}`)} style={{ '--kr-count': Math.min(items.length, 4) } as CSSProperties}>
        {items.map((item, i) => {
          const image = str(item, 'image');
          const label = str(item, 'label');
          const caption = str(item, 'caption');
          return (
            <li key={`${label}-${i}`} className="kr-metals__item">
              <a href={str(item, 'url') || '/shop'} className="kr-metal">
                <span className={cn('kr-metal__frame', `kr-tone--${str(item, 'tone', 'gold')}`, !image && 'kr-metal__frame--empty')}>
                  {image ? (
                    <LibImage src={image} alt="" sizes="(min-width: 1024px) 24vw, 46vw" className="kr-metal__img" />
                  ) : (
                    <Motif kind={str(item, 'motif', 'ring') as MotifKind} className="kr-metal__motif" />
                  )}
                </span>
                <span className="kr-metal__text">
                  <span className="kr-metal__label">{label}</span>
                  {caption ? <span className="kr-metal__caption">{caption}</span> : null}
                  {cta ? <span className="kr-metal__cta" aria-hidden>{cta}<span className="kr-textlink__arrow">→</span></span> : null}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </LibSection>
  );
}
