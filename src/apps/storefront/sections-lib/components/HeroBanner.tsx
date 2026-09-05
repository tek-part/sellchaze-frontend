/**
 * hero-banner — a single static hero: image (+ mobile crop), eyebrow, heading, text, up to two CTAs.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, tr } from '../schema';
import { bool, num, str, useSectionSettings } from '../use-section';
import { LibButton, LibImage } from '../primitives';

export const heroBannerSchema = defineSection({
  type: 'hero-banner',
  label: 'Hero banner',
  description: 'One large image with headline, text and up to two buttons.',
  category: 'hero',
  icon: 'HiOutlineRectangleStack',
  settings: [
    fields.image('image', 'Image', 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1920&h=900&q=80', 'Recommended 1920×800.'),
    fields.image('mobile_image', 'Mobile image', ''),
    fields.text('eyebrow', 'Eyebrow', tr('وصل حديثاً', 'New in')),
    fields.text('heading', 'Heading', tr('تسوق أحدث المنتجات', 'Shop the latest arrivals')),
    fields.textarea('text', 'Text', tr('جودة عالية بأسعار مناسبة، مع توصيل سريع لباب منزلك.', 'Great quality at fair prices, delivered fast to your door.')),
    fields.text('cta_label', 'Primary button', tr('تسوق الآن', 'Shop now')),
    fields.url('cta_url', 'Primary link', '/shop'),
    fields.text('cta2_label', 'Secondary button', ''),
    fields.url('cta2_url', 'Secondary link', ''),
    fields.select('align', 'Text alignment', OPTIONS.align, 'start'),
    fields.select('height', 'Height', OPTIONS.height, 'medium'),
    fields.range('overlay', 'Overlay darkness', 35, 0, 90, 5),
    fields.select('text_color', 'Text colour', [{ value: 'light', label: 'Light (on photo)' }, { value: 'dark', label: 'Dark' }], 'light'),
    fields.toggle('rounded', 'Rounded inside the container', false),
  ],
});

export function HeroBanner(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(heroBannerSchema, props.settings);
  const image = str(s, 'image');
  const mobile = str(s, 'mobile_image');
  const style = { '--lib-overlay': String(num(s, 'overlay', 35) / 100) } as CSSProperties;
  const cta2 = str(s, 'cta2_label');
  return (
    <section className={cn('lib-hero-banner', `lib-hero--${str(s, 'height', 'medium')}`, bool(s, 'rounded') && 'lib-hero-slider--inset')}>
      <div className={cn('lib-hero', `lib-hero--${str(s, 'align', 'start')}`, !image && 'lib-hero--plain', str(s, 'text_color') === 'dark' && 'lib-hero--dark-text')} style={style}>
        {image ? (
          <picture className="lib-hero__media">
            {mobile ? <source media="(max-width: 767px)" srcSet={mobile} /> : null}
            <LibImage src={image} alt="" className="lib-hero__img" eager />
          </picture>
        ) : null}
        <div className="lib-hero__scrim" aria-hidden />
        <div className="lib-container lib-hero__inner">
          <div className="lib-hero__content">
            {str(s, 'eyebrow') ? <span className="lib-hero__eyebrow">{str(s, 'eyebrow')}</span> : null}
            {str(s, 'heading') ? <h1 className="lib-hero__title">{str(s, 'heading')}</h1> : null}
            {str(s, 'text') ? <p className="lib-hero__text">{str(s, 'text')}</p> : null}
            {str(s, 'cta_label') || cta2 ? (
              <div className="lib-hero__actions">
                {str(s, 'cta_label') ? <LibButton href={str(s, 'cta_url', '/shop')} size="lg" variant={image && str(s, 'text_color') !== 'dark' ? 'inverse' : 'primary'}>{str(s, 'cta_label')}</LibButton> : null}
                {cta2 ? <LibButton href={str(s, 'cta2_url', '/shop')} size="lg" variant="ghost">{cta2}</LibButton> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
