/**
 * stride-hero — the kinetic hero: an oversized two-line headline (second line in the accent),
 * a slogan sticker and up to two buttons, set beside (split), over (overlay) or without (type) an
 * image. With no image every layout falls back to a typographic speed-line composition, so a new
 * store never shows an empty frame.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { LibImage, defineSection, fields, num, str, tr, useLibId, useSectionSettings, useVariant, variantSelect, variants } from '../../../sections-lib';

export const HERO_LAYOUTS = variants('layout', [
  { value: 'split', label: 'Split', description: 'Headline on one side, image on the other.', icon: 'HiOutlineViewColumns' },
  { value: 'overlay', label: 'Full-bleed', description: 'Headline over a full-width image.', icon: 'HiOutlinePhoto' },
  { value: 'type', label: 'Type only', description: 'A pure typographic hero with speed lines.', icon: 'HiOutlineLanguage' },
]);

export const strideHeroSchema = defineSection({
  type: 'stride-hero',
  label: 'Kinetic hero',
  description: 'Oversized two-line headline with buttons, a slogan sticker and an optional image.',
  category: 'hero',
  icon: 'HiOutlineBolt',
  variants: HERO_LAYOUTS,
  settings: [
    variantSelect(HERO_LAYOUTS, 'split'),
    fields.text('eyebrow', 'Eyebrow', tr('موسم ٢٠٢٦ · تشكيلة الجري', 'Season 26 · Run collection')),
    fields.text('heading', 'Headline — line 1', tr('اجرِ أبعد', 'Run further')),
    fields.text('heading_accent', 'Headline — line 2 (accent)', tr('أسرع من امبارح', 'Faster than yesterday')),
    fields.textarea('text', 'Text', tr('أحذية جري وملابس تمرين مصممة للحركة — مقاسات كاملة واستبدال المقاس مجاناً.', 'Running shoes and training wear built for motion — full size runs and free size exchanges.')),
    fields.text('cta_label', 'Primary button', tr('تسوق الجديد', 'Shop new drops')),
    fields.url('cta_url', 'Primary link', '/collections/new-arrivals'),
    fields.text('cta2_label', 'Secondary button', tr('اعرف مقاسك', 'Find your size')),
    fields.url('cta2_url', 'Secondary link', '#size'),
    fields.text('sticker', 'Sticker text', tr('موسم جديد ·', 'New season ·'), { hint: 'Short repeated slogan around the round sticker. Leave empty to hide.' }),
    fields.image('image', 'Image', '', 'Portrait or square works best. Without an image the hero uses its typographic composition.'),
    fields.text('image_alt', 'Image description', ''),
    fields.text('art_text', 'Background numerals (no-image layout)', tr('٢٦', '26')),
    fields.range('overlay', 'Overlay darkness (full-bleed)', 55, 0, 90, 5),
  ],
});

export function StrideHero(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(strideHeroSchema, props.settings);
  const layout = useVariant(strideHeroSchema, props.settings);
  const image = str(s, 'image');
  const hasImage = Boolean(image) && layout !== 'type';
  const sticker = str(s, 'sticker').trim();
  const headingId = useLibId('st-hero');

  const art = (
    <div className="st-hero__art" aria-hidden>
      <span className="st-hero__lines" />
      <span className="st-hero__numerals">{str(s, 'art_text')}</span>
      <span className="st-hero__bar" />
    </div>
  );

  return (
    <section className={cn('st-hero', `st-hero--${layout}`, hasImage ? 'has-image' : 'no-image')} aria-labelledby={headingId} style={{ '--st-overlay': String(num(s, 'overlay', 55) / 100) } as CSSProperties}>
      {layout === 'overlay' ? (
        <div className="st-hero__bg">
          {hasImage ? <LibImage src={image} alt={str(s, 'image_alt')} eager sizes="100vw" className="st-hero__img" /> : art}
          {hasImage ? <span className="st-hero__scrim" aria-hidden /> : null}
        </div>
      ) : null}
      <div className="lib-container st-hero__inner">
        <div className="st-hero__copy">
          {str(s, 'eyebrow') ? <p className="st-eyebrow st-hero__eyebrow"><span className="st-eyebrow__mark" aria-hidden />{str(s, 'eyebrow')}</p> : null}
          <h1 id={headingId} className="st-display st-hero__title">
            <span className="st-hero__line">{str(s, 'heading')}</span>
            {str(s, 'heading_accent') ? <span className="st-hero__line st-hero__line--accent">{str(s, 'heading_accent')}</span> : null}
          </h1>
          {str(s, 'text') ? <p className="st-hero__text">{str(s, 'text')}</p> : null}
          <div className="st-hero__actions">
            {str(s, 'cta_label') ? <a href={str(s, 'cta_url', '/shop')} className="st-btn st-btn--accent st-btn--lg">{str(s, 'cta_label')}<span className="st-btn__arrow" aria-hidden>→</span></a> : null}
            {str(s, 'cta2_label') ? <a href={str(s, 'cta2_url', '/shop')} className="st-btn st-btn--outline st-btn--lg">{str(s, 'cta2_label')}</a> : null}
          </div>
        </div>
        {layout !== 'overlay' ? (
          <div className="st-hero__visual">
            {hasImage ? <LibImage src={image} alt={str(s, 'image_alt')} eager sizes="(min-width: 1024px) 50vw, 100vw" className="st-hero__img" /> : art}
            {sticker ? <Sticker text={sticker} /> : null}
          </div>
        ) : sticker ? <Sticker text={sticker} /> : null}
      </div>
    </section>
  );
}

/** Round slogan sticker — text on a circular path, slowly spinning (static under reduced motion). */
function Sticker(props: { text: string }): ReactElement {
  const pathId = useLibId('st-sticker');
  const repeated = props.text.length < 24 ? `${props.text} ${props.text}` : props.text;
  return (
    <span className="st-sticker" aria-hidden>
      <svg viewBox="0 0 120 120" className="st-sticker__ring">
        <defs>
          <path id={pathId} d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
        </defs>
        <text className="st-sticker__text" direction="ltr">
          <textPath href={`#${pathId}`} textLength="276" lengthAdjust="spacingAndGlyphs">{repeated}</textPath>
        </text>
      </svg>
      <svg viewBox="0 0 24 24" className="st-sticker__bolt"><path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="currentColor" /></svg>
    </span>
  );
}
