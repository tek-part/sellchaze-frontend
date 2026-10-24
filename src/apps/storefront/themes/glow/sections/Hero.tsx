/**
 * glow-hero — the opening frame. Copy on one side, an arch-shaped window on the other holding the
 * merchant's image — or, before one is uploaded, the hero product of a collection with a floating
 * "product tag" (name · size · price) — set on a soft radial glow. With neither, the arch becomes a
 * gradient composition with a drawn bottle, so the hero never shows an empty box.
 * Variants: `arch` (split) · `centered` (copy over a wide soft panel).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import {
  LibImage, LibPrice, defineSection, useLibId, fields, spacingFields, str, tr, useLocaleCode, useSectionData, useSectionSettings, useVariant, variantSelect, variants, bool,
} from '../../../sections-lib';
import { sizeLabel } from '../components/size';
import { IconArrow } from '../chrome/icons';

const HERO_LAYOUTS = variants('layout', [
  { value: 'arch', label: 'Arch split', description: 'Copy beside an arch-framed image or hero product.', icon: 'HiOutlineViewColumns' },
  { value: 'centered', label: 'Centered', description: 'Centred copy over a soft glow panel (image optional).', icon: 'HiOutlineBars3CenterLeft' },
]);

export const glowHeroSchema = defineSection({
  type: 'glow-hero',
  label: 'Glow hero',
  description: 'Headline beside an arch-framed image or hero product, on a soft glow.',
  category: 'hero',
  icon: 'HiOutlineSparkles',
  variants: HERO_LAYOUTS,
  settings: [
    variantSelect(HERO_LAYOUTS, 'arch'),
    fields.text('eyebrow', 'Eyebrow', tr('عناية مدروسة · لمسة فاخرة', 'Considered care · quietly luxurious')),
    fields.text('heading', 'Heading', tr('بشرة صحية تتوهّج من الداخل', 'Skin that glows from within')),
    fields.textarea('text', 'Text', tr('تركيبات بمكوّنات فعّالة مختارة بعناية، تناسب بشرتك وتناسب مناخنا.', 'Formulas built on proven actives, chosen for your skin — and for our climate.')),
    fields.text('cta_label', 'Button label', tr('تسوّقي المجموعة', 'Shop the edit')),
    fields.url('cta_url', 'Button link', '/shop'),
    fields.text('cta2_label', 'Second button label', tr('ابني روتينك', 'Build your routine')),
    fields.url('cta2_url', 'Second button link', '#routine'),
    fields.image('image', 'Image', '', 'Portrait images work best (4:5). Leave empty to feature a product instead.'),
    fields.collection('collection', 'Hero product (when no image)', 'featured', 'The first product of this collection is shown in the arch.'),
    fields.product('product', 'Or pick a specific product', ''),
    fields.toggle('show_product_tag', 'Show the floating product tag', true),
    fields.select('height', 'Height', [{ value: 'medium', label: 'Medium' }, { value: 'tall', label: 'Tall' }], 'medium'),
    ...spacingFields(0),
  ],
});

/** Decorative fallback for the arch — a gradient field with a drawn dropper bottle. */
export function GlowBottleArt(props: { className?: string }): ReactElement {
  const id = useLibId('gl-art');
  return (
    <svg className={cn('gl-art', props.className)} viewBox="0 0 200 250" aria-hidden focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={id} cx="50%" cy="38%" r="70%">
          <stop offset="0" stopColor="var(--surface)" />
          <stop offset=".55" stopColor="var(--surface-2)" />
          <stop offset="1" stopColor="var(--accent)" />
        </radialGradient>
      </defs>
      <rect width="200" height="250" fill={`url(#${id})`} />
      <circle cx="100" cy="120" r="78" fill="none" stroke="var(--primary)" strokeOpacity=".12" />
      <circle cx="100" cy="120" r="58" fill="none" stroke="var(--primary)" strokeOpacity=".08" />
      <g fill="none" stroke="var(--primary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".75">
        <path d="M91 58h18v16H91z" />
        <path d="M94 58v-14a6 6 0 0 1 12 0v14" />
        <path d="M84 80a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v94a10 10 0 0 1-10 10H94a10 10 0 0 1-10-10z" />
        <path d="M84 112h32M84 150h32" strokeOpacity=".4" />
      </g>
      <path d="M100 196c0 0 7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z" fill="var(--accent)" fillOpacity=".8" />
    </svg>
  );
}

export function GlowHero(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(glowHeroSchema, props.settings);
  const layout = useVariant(glowHeroSchema, props.settings);
  const data = useSectionData(props.context);
  const locale = useLocaleCode();
  const image = str(s, 'image');
  const product = image ? undefined : data.product(str(s, 'product')) ?? data.products(str(s, 'collection', 'featured'), 1)[0];
  const heading = str(s, 'heading');
  const showTag = bool(s, 'show_product_tag', true) && product !== undefined;
  const size = product ? sizeLabel(product, locale) : '';
  const visualSrc = image || product?.image?.src;

  const copy = (
    <div className="gl-hero__copy">
      {str(s, 'eyebrow') ? <p className="gl-eyebrow">{str(s, 'eyebrow')}</p> : null}
      {heading ? <h1 className="gl-hero__title">{heading}</h1> : null}
      {str(s, 'text') ? <p className="gl-hero__text">{str(s, 'text')}</p> : null}
      {str(s, 'cta_label') || str(s, 'cta2_label') ? (
        <div className="gl-hero__actions">
          {str(s, 'cta_label') ? <a href={str(s, 'cta_url', '/shop') || '/shop'} className="lib-btn lib-btn--primary lib-btn--lg gl-btn">{str(s, 'cta_label')}<IconArrow /></a> : null}
          {str(s, 'cta2_label') ? <a href={str(s, 'cta2_url') || '#'} className="gl-textlink">{str(s, 'cta2_label')}</a> : null}
        </div>
      ) : null}
    </div>
  );

  if (layout === 'centered') {
    return (
      <section className={cn('gl-hero', 'gl-hero--centered', `gl-hero--${str(s, 'height', 'medium')}`, image && 'has-image')}>
        <span className="gl-hero__aura" aria-hidden />
        <div className="lib-container gl-hero__center">{copy}</div>
        {image ? (
          <div className="lib-container">
            <div className="gl-hero__wide">
              <LibImage src={image} alt={heading} eager sizes="(min-width: 1320px) 1320px, 100vw" className="gl-hero__img" />
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className={cn('gl-hero', 'gl-hero--arch', `gl-hero--${str(s, 'height', 'medium')}`)}>
      <span className="gl-hero__aura" aria-hidden />
      <div className="lib-container gl-hero__grid">
        {copy}
        <div className="gl-hero__visual">
          <div className="gl-hero__arch">
            {visualSrc ? (
              <LibImage
                src={visualSrc}
                {...(!image && product?.image?.srcSet ? { srcSet: product.image.srcSet } : {})}
                alt={image ? heading : product?.image?.alt ?? product?.title ?? ''}
                eager
                sizes="(min-width: 1024px) 42vw, 86vw"
                className="gl-hero__img"
              />
            ) : (
              <GlowBottleArt />
            )}
          </div>
          <span className="gl-hero__ring" aria-hidden />
          {showTag && product ? (
            <a href={product.url} className="gl-hero__tag">
              <span className="gl-hero__tag-text">
                <span className="gl-hero__tag-name">{product.title}</span>
                {size ? <span className="gl-hero__tag-size">{size}</span> : null}
              </span>
              <LibPrice amount={product.price} compareAt={product.compareAtPrice} currency={product.currency} className="gl-hero__tag-price" />
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
