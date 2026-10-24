/**
 * maison-moodboard — the seasonal edit as a pinned-up mood board: an intro card, up to six photo
 * tiles of varied heights and a palette card of the season's colours. Five tiles get a composed
 * magazine arrangement on desktop; other counts flow in balanced columns. Tiles without a photo
 * are washed in the season's palette (merchant colours), captioned, so the board still reads.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { defineSection, fields, tr, LibImage, list, str, useLocaleCode, useSectionSettings } from '../../../sections-lib';
import { maiText } from '../components/i18n';
import { IconArrow } from '../chrome/icons';

const tile = (caption: ReturnType<typeof tr>, url: string): Record<string, string | ReturnType<typeof tr>> => ({ image: '', caption, url });

export const maisonMoodboardSchema = defineSection({
  type: 'maison-moodboard',
  label: 'Maison · Seasonal edit (mood board)',
  description: 'Mood-board grid of photos, an intro card and the season palette.',
  category: 'content',
  icon: 'HiOutlineSwatch',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('مختارات الموسم', 'The seasonal edit')),
    fields.text('title', 'Heading', tr('طين، كتان وضوء خافت', 'Clay, linen & low light')),
    fields.textarea('text', 'Text', tr('ألوان ترابية وخامات طبيعية لأمسيات أطول في البيت: فخّار بلمسة يدوية، أقمشة مغسولة وإضاءة دافئة.', 'Earthy tones and natural textures for longer evenings in: handmade clay, washed fabrics and warm, low light.')),
    fields.text('cta_label', 'Button label', tr('تسوّق المختارات', 'Shop the edit')),
    fields.url('cta_url', 'Button link', '/shop'),
    fields.text('palette', 'Season palette (hex colours, comma-separated)', '#B0533A, #D8BFA3, #6B7A4B, #EFE6D8, #3B2F2A', { translatable: false, hint: 'Up to six colours, e.g. #B0533A, #D8BFA3.' }),
    fields.list('tiles', 'Tiles', [
      fields.image('image', 'Photo', ''),
      fields.text('caption', 'Caption', ''),
      fields.url('url', 'Link', ''),
    ], [
      tile(tr('ضوء دافئ', 'Warm light'), '/collections/lighting'),
      tile(tr('بطانيات منسوجة', 'Woven throws'), '/collections/textiles'),
      tile(tr('سلال من الجوت', 'Jute baskets'), '/collections/baskets'),
      tile(tr('على السفرة', 'At the table'), '/collections/tableware'),
      tile(tr('سجاد صوف', 'Wool underfoot'), '/collections/rugs'),
    ], 6),
  ],
});

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parsePalette(value: string): ReadonlyArray<string> {
  return value.split(/[\s,،]+/).map((v) => v.trim()).filter((v) => HEX.test(v)).slice(0, 6);
}

export function MaisonMoodboard(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(maisonMoodboardSchema, props.settings);
  const code = useLocaleCode();
  const tiles = list(s, 'tiles');
  const palette = parsePalette(str(s, 'palette'));
  const swatch = (i: number): string | undefined => (palette.length > 0 ? palette[i % palette.length] : undefined);

  return (
    <section className="lib-section mai-mood">
      <div className="lib-container">
        <div className="mai-mood__board" data-count={tiles.length}>
          <div className="mai-mood__intro">
            {str(s, 'eyebrow') ? <p className="mai-eyebrow">{str(s, 'eyebrow')}</p> : null}
            {str(s, 'title') ? <h2 className="mai-mood__title">{str(s, 'title')}</h2> : null}
            {str(s, 'text') ? <p className="mai-mood__text">{str(s, 'text')}</p> : null}
            {str(s, 'cta_label') ? (
              <a href={str(s, 'cta_url', '/shop') || '/shop'} className="mai-textlink">
                <span>{str(s, 'cta_label')}</span>
                <IconArrow />
              </a>
            ) : null}
          </div>
          {tiles.map((t, i) => {
            const image = str(t, 'image');
            const url = str(t, 'url');
            const caption = str(t, 'caption');
            const a = swatch(i);
            const b = swatch(i + 1);
            const style = !image && a ? ({ '--mai-wash-a': a, '--mai-wash-b': b ?? a } as CSSProperties) : undefined;
            const body = (
              <>
                <span className="mai-mood__media" aria-hidden>
                  {image ? <LibImage src={image} alt="" sizes="(min-width: 1024px) 380px, 46vw" className="mai-mood__img" /> : <span className="mai-mood__wash" />}
                </span>
                {caption ? <span className="mai-mood__caption">{caption}</span> : null}
              </>
            );
            return (
              <figure key={i} className={cn('mai-mood__tile', `mai-mood__tile--${i + 1}`, image ? 'has-image' : 'is-wash')} style={style}>
                {url ? <a href={url} className="mai-mood__link">{body}</a> : body}
              </figure>
            );
          })}
          {palette.length > 0 ? (
            <div className="mai-mood__palette">
              <p className="mai-mood__palette-title">{maiText(code, 'swatches')}</p>
              <ul className="mai-mood__swatches">
                {palette.map((c) => (
                  <li key={c} className="mai-mood__swatch">
                    <span className="mai-mood__chip" style={{ background: c }} aria-hidden />
                    <span className="mai-mood__hex" dir="ltr">{c.toUpperCase()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
