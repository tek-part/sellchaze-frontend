/**
 * hero-slider — full-width rotating promos. Each slide: image, mobile image, eyebrow, heading, text,
 * CTA, alignment and overlay. Scroll-snap carousel with dots + autoplay (pauses on hover/focus and
 * under reduced motion). Renders a token-coloured gradient slide when a slide has no image.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, tr } from '../schema';
import { bool, list, num, str, useSectionSettings } from '../use-section';
import { LibButton, LibCarousel, LibImage } from '../primitives';

const SLIDE_FIELDS = [
  fields.image('image', 'Image', '', 'Recommended 1920×800.'),
  fields.image('mobile_image', 'Mobile image', '', 'Optional portrait crop for phones.'),
  fields.text('eyebrow', 'Eyebrow', ''),
  fields.text('heading', 'Heading', ''),
  fields.textarea('text', 'Text', ''),
  fields.text('cta_label', 'Button label', ''),
  fields.url('cta_url', 'Button link', '/shop'),
  fields.select('align', 'Text alignment', OPTIONS.align, 'start'),
  fields.range('overlay', 'Overlay darkness', 35, 0, 90, 5),
] as const;

export const heroSliderSchema = defineSection({
  type: 'hero-slider',
  label: 'Hero slider',
  description: 'Rotating full-width promotional slides with headline and button.',
  category: 'hero',
  icon: 'HiOutlinePhoto',
  settings: [
    fields.list(
      'slides',
      'Slides',
      SLIDE_FIELDS,
      [
        {
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&h=900&q=80',
          mobile_image: '',
          eyebrow: tr('تشكيلة الموسم', 'This season'),
          heading: tr('كل ما تحتاجه، في مكان واحد', 'Everything you need, in one place'),
          text: tr('منتجات مختارة بعناية مع شحن سريع وإرجاع سهل.', 'Hand-picked products with fast shipping and easy returns.'),
          cta_label: tr('تسوق الآن', 'Shop now'),
          cta_url: '/shop',
          align: 'start',
          overlay: 35,
        },
        {
          image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&h=900&q=80',
          mobile_image: '',
          eyebrow: tr('عروض محدودة', 'Limited offers'),
          heading: tr('خصومات تصل إلى ٥٠٪', 'Up to 50% off'),
          text: tr('على مجموعة مختارة من المنتجات الأكثر مبيعاً.', 'On a curated selection of best sellers.'),
          cta_label: tr('اكتشف العروض', 'See the deals'),
          cta_url: '/collections/best-sellers',
          align: 'center',
          overlay: 40,
        },
      ],
      6,
    ),
    fields.select('height', 'Height', OPTIONS.height, 'medium'),
    fields.toggle('autoplay', 'Autoplay', true),
    fields.range('interval', 'Autoplay interval (s)', 6, 3, 15),
    fields.toggle('show_dots', 'Show dots', true),
    fields.toggle('show_arrows', 'Show arrows', true),
    fields.toggle('rounded', 'Rounded inside the container', false, 'Off = edge-to-edge.'),
  ],
});

export function HeroSlider(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(heroSliderSchema, props.settings);
  const slides = list(s, 'slides');
  const height = str(s, 'height', 'medium');
  const rounded = bool(s, 'rounded');
  if (slides.length === 0) return null;

  return (
    <section className={cn('lib-hero-slider', `lib-hero--${height}`, rounded && 'lib-hero-slider--inset')}>
      <LibCarousel ariaLabel="Hero" itemSize="full" showDots={bool(s, 'show_dots', true)} showArrows={bool(s, 'show_arrows', true)} autoplay={bool(s, 'autoplay', true)} intervalMs={num(s, 'interval', 6) * 1000}>
        {slides.map((slide, i) => {
          const image = str(slide, 'image');
          const mobile = str(slide, 'mobile_image');
          const overlay = num(slide, 'overlay', 35) / 100;
          const align = str(slide, 'align', 'start');
          const heading = str(slide, 'heading');
          const style = { '--lib-overlay': String(overlay) } as CSSProperties;
          return (
            <div key={i} className={cn('lib-hero', `lib-hero--${align}`, !image && 'lib-hero--plain')} style={style}>
              {image ? (
                <picture className="lib-hero__media">
                  {mobile ? <source media="(max-width: 767px)" srcSet={mobile} /> : null}
                  <LibImage src={image} alt="" className="lib-hero__img" eager={i === 0} />
                </picture>
              ) : null}
              <div className="lib-hero__scrim" aria-hidden />
              <div className="lib-container lib-hero__inner">
                <div className="lib-hero__content">
                  {str(slide, 'eyebrow') ? <span className="lib-hero__eyebrow">{str(slide, 'eyebrow')}</span> : null}
                  {heading ? <h2 className="lib-hero__title">{heading}</h2> : null}
                  {str(slide, 'text') ? <p className="lib-hero__text">{str(slide, 'text')}</p> : null}
                  {str(slide, 'cta_label') ? (
                    <div className="lib-hero__actions">
                      <LibButton href={str(slide, 'cta_url', '/shop')} size="lg" variant={image ? 'inverse' : 'primary'}>
                        {str(slide, 'cta_label')}
                      </LibButton>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </LibCarousel>
    </section>
  );
}
