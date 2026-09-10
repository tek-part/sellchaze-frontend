/**
 * hero-slider — full-width rotating promos built from `slide` blocks (image, mobile image, video,
 * eyebrow, heading, text, CTA, alignment, overlay). Five layouts: slider (image + scrim), split
 * (image beside text), minimal (text on the surface, no image), video (looping muted MP4/WebM
 * behind the text) and full-bleed-compact (short banner). Scroll-snap carousel with dots +
 * autoplay (pauses on hover/focus and under reduced motion).
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { prefersReducedMotion } from '../../../../shared/env/media';
import { defineBlock, defineSection, fields, OPTIONS, tr, variants, variantSelect } from '../schema';
import { bool, num, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { LibButton, LibCarousel, LibImage } from '../primitives';

const SLIDE_FIELDS = [
  fields.image('image', 'Image', '', 'Recommended 1920×800.'),
  fields.image('mobile_image', 'Mobile image', '', 'Optional portrait crop for phones.'),
  fields.url('video', 'Video (MP4 / WebM)', ''),
  fields.text('eyebrow', 'Eyebrow', ''),
  fields.text('heading', 'Heading', ''),
  fields.textarea('text', 'Text', ''),
  fields.text('cta_label', 'Button label', ''),
  fields.url('cta_url', 'Button link', '/shop'),
  fields.text('cta2_label', 'Second button label', ''),
  fields.url('cta2_url', 'Second button link', ''),
  fields.select('align', 'Text alignment', OPTIONS.align, 'start'),
  fields.range('overlay', 'Overlay darkness', 35, 0, 90, 5),
] as const;

export const slideBlock = defineBlock({ type: 'slide', label: 'Slide', icon: 'HiOutlinePhoto', settings: SLIDE_FIELDS, limit: 8 });

export const HERO_LAYOUTS = variants('layout', [
  { value: 'slider', label: 'Slider', description: 'Full-width image with text over a scrim.', icon: 'HiOutlinePhoto' },
  { value: 'split', label: 'Split', description: 'Image on one side, text on the other.', icon: 'HiOutlineViewColumns' },
  { value: 'minimal', label: 'Minimal', description: 'Text on the surface, no image.', icon: 'HiOutlineBars3CenterLeft' },
  { value: 'video', label: 'Video', description: 'A looping muted video behind the text.', icon: 'HiOutlinePlayCircle' },
  { value: 'full-bleed-compact', label: 'Compact banner', description: 'Short edge-to-edge banner.', icon: 'HiOutlineRectangleStack' },
]);

export const heroSliderSchema = defineSection({
  type: 'hero-slider',
  label: 'Hero slider',
  description: 'Rotating promotional slides with headline and button.',
  category: 'hero',
  icon: 'HiOutlinePhoto',
  variants: HERO_LAYOUTS,
  blocks: { types: [slideBlock], max: 8, legacy: 'slides' },
  settings: [
    variantSelect(HERO_LAYOUTS, 'slider'),
    fields.list(
      'slides',
      'Slides',
      SLIDE_FIELDS,
      [
        {
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&h=900&q=80',
          mobile_image: '',
          video: '',
          eyebrow: tr('تشكيلة الموسم', 'This season'),
          heading: tr('كل ما تحتاجه، في مكان واحد', 'Everything you need, in one place'),
          text: tr('منتجات مختارة بعناية مع شحن سريع وإرجاع سهل.', 'Hand-picked products with fast shipping and easy returns.'),
          cta_label: tr('تسوق الآن', 'Shop now'),
          cta_url: '/shop',
          cta2_label: '',
          cta2_url: '',
          align: 'start',
          overlay: 35,
        },
        {
          image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&h=900&q=80',
          mobile_image: '',
          video: '',
          eyebrow: tr('عروض محدودة', 'Limited offers'),
          heading: tr('خصومات تصل إلى ٥٠٪', 'Up to 50% off'),
          text: tr('على مجموعة مختارة من المنتجات الأكثر مبيعاً.', 'On a curated selection of best sellers.'),
          cta_label: tr('اكتشف العروض', 'See the deals'),
          cta_url: '/collections/best-sellers',
          cta2_label: '',
          cta2_url: '',
          align: 'center',
          overlay: 40,
        },
      ],
      8,
    ),
    fields.url('video_url', 'Video URL (fallback for the Video layout)', ''),
    fields.select('height', 'Height', OPTIONS.height, 'medium'),
    fields.toggle('autoplay', 'Autoplay', true),
    fields.range('interval', 'Autoplay interval (s)', 6, 3, 15),
    fields.toggle('show_dots', 'Show dots', true),
    fields.toggle('show_arrows', 'Show arrows', true),
    fields.toggle('rounded', 'Rounded inside the container', false, 'Off = edge-to-edge.'),
  ],
});

const VIDEO_RE = /\.(mp4|webm|ogg)(\?|$)/i;

export function HeroSlider(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(heroSliderSchema, props.settings);
  const slides = useSectionBlocks(heroSliderSchema, s);
  const layout = useVariant(heroSliderSchema, props.settings);
  const height = str(s, 'height', 'medium');
  const rounded = bool(s, 'rounded');
  if (slides.length === 0) return null;
  const compact = layout === 'full-bleed-compact';
  const still = prefersReducedMotion();

  return (
    <section className={cn('lib-hero-slider', `lib-hero-slider--${layout}`, `lib-hero--${compact ? 'short' : height}`, rounded && 'lib-hero-slider--inset')}>
      <LibCarousel ariaLabel="Hero" itemSize="full" showDots={bool(s, 'show_dots', true) && slides.length > 1} showArrows={bool(s, 'show_arrows', true)} autoplay={bool(s, 'autoplay', true)} intervalMs={num(s, 'interval', 6) * 1000}>
        {slides.map((slide, i) => {
          const b = slide.settings;
          const image = str(b, 'image');
          const mobile = str(b, 'mobile_image');
          const video = layout === 'video' ? str(b, 'video') || str(s, 'video_url') : '';
          const hasVideo = Boolean(video) && VIDEO_RE.test(video) && !still;
          const overlay = num(b, 'overlay', 35) / 100;
          const align = str(b, 'align', 'start');
          const heading = str(b, 'heading');
          const onMedia = layout === 'slider' || layout === 'video' || compact;
          const showMedia = onMedia || layout === 'split';
          const plain = layout === 'minimal' || (!image && !hasVideo);
          const style = { '--lib-overlay': String(overlay) } as CSSProperties;
          const media = showMedia && !plain ? (
            hasVideo ? (
              <video className="lib-hero__media lib-hero__video" src={video} poster={image || undefined} autoPlay muted loop playsInline aria-hidden />
            ) : (
              <picture className="lib-hero__media">
                {mobile ? <source media="(max-width: 767px)" srcSet={mobile} /> : null}
                <LibImage src={image} alt="" className="lib-hero__img" eager={i === 0} />
              </picture>
            )
          ) : null;
          const content = (
            <div className="lib-hero__content">
              {str(b, 'eyebrow') ? <span className="lib-hero__eyebrow">{str(b, 'eyebrow')}</span> : null}
              {heading ? <h2 className="lib-hero__title">{heading}</h2> : null}
              {str(b, 'text') ? <p className="lib-hero__text">{str(b, 'text')}</p> : null}
              {str(b, 'cta_label') || str(b, 'cta2_label') ? (
                <div className="lib-hero__actions">
                  {str(b, 'cta_label') ? (
                    <LibButton href={str(b, 'cta_url', '/shop')} size={compact ? 'md' : 'lg'} variant={onMedia && !plain ? 'inverse' : 'primary'}>
                      {str(b, 'cta_label')}
                    </LibButton>
                  ) : null}
                  {str(b, 'cta2_label') ? (
                    <LibButton href={str(b, 'cta2_url', '/shop')} size={compact ? 'md' : 'lg'} variant={onMedia && !plain ? 'ghost' : 'secondary'}>
                      {str(b, 'cta2_label')}
                    </LibButton>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
          if (layout === 'split' && !plain) {
            return (
              <div key={slide.id} className={cn('lib-hero lib-hero--split', `lib-hero--${align}`)} style={style}>
                <div className="lib-container lib-hero__split">
                  <div className="lib-hero__split-media">{media}</div>
                  <div className="lib-hero__split-body">{content}</div>
                </div>
              </div>
            );
          }
          return (
            <div key={slide.id} className={cn('lib-hero', `lib-hero--${align}`, plain && (layout === 'minimal' ? 'lib-hero--minimal' : 'lib-hero--plain'))} style={style}>
              {media}
              <div className="lib-hero__scrim" aria-hidden />
              <div className="lib-container lib-hero__inner">{content}</div>
            </div>
          );
        })}
      </LibCarousel>
    </section>
  );
}
