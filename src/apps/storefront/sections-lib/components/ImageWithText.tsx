/**
 * image-with-text — an image with eyebrow/heading/rich text/CTA: image on the start or end side,
 * text overlaid on the image, or stacked (image above text).
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect } from '../schema';
import { aspectClass, bandClass, num, spacingStyle, str, useSectionSettings, useVariant } from '../use-section';
import { LibButton, LibImage, LibSection } from '../primitives';
import { RichHtml } from './RichText';

export const IMAGE_TEXT_LAYOUTS = variants('layout', [
  { value: 'image-left', label: 'Image first', description: 'Image on the start side, text beside it.', icon: 'HiOutlineViewColumns' },
  { value: 'image-right', label: 'Image last', description: 'Text first, image on the end side.', icon: 'HiOutlineViewColumns' },
  { value: 'overlay', label: 'Overlay', description: 'Text over the image with a scrim.', icon: 'HiOutlinePhoto' },
  { value: 'stacked', label: 'Stacked', description: 'Image above the text, centred.', icon: 'HiOutlineRectangleStack' },
], { media_side: { start: 'image-left', end: 'image-right' } });

export const imageWithTextSchema = defineSection({
  type: 'image-with-text',
  label: 'Image with text',
  description: 'An image beside a headline, paragraph and button.',
  category: 'content',
  icon: 'HiOutlinePhoto',
  variants: IMAGE_TEXT_LAYOUTS,
  settings: [
    variantSelect(IMAGE_TEXT_LAYOUTS, 'image-left'),
    fields.image('image', 'Image', 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&h=900&q=80'),
    fields.text('eyebrow', 'Eyebrow', tr('قصتنا', 'Our story')),
    fields.text('heading', 'Heading', tr('جودة نثق بها، وخدمة تليق بك', 'Quality you can trust, service you deserve')),
    fields.richtext('text', 'Text', tr('<p>نختار كل منتج بعناية ونختبره قبل أن يصل إليك. هدفنا تجربة تسوق سهلة وسريعة من الطلب إلى الاستلام.</p>', '<p>We hand-pick and test every product before it reaches you. Our goal is a simple, fast shopping experience from order to delivery.</p>')),
    fields.text('cta_label', 'Button label', tr('اعرف المزيد', 'Learn more')),
    fields.url('cta_url', 'Button link', '/about'),
    fields.select('aspect', 'Image ratio', OPTIONS.aspect, 'landscape'),
    fields.range('overlay', 'Overlay darkness (Overlay layout)', 45, 0, 90, 5),
    fields.select('background', 'Background', OPTIONS.background, 'none'),
    ...spacingFields(),
  ],
});

export function ImageWithText(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(imageWithTextSchema, props.settings);
  const layout = useVariant(imageWithTextSchema, props.settings);
  const overlay = layout === 'overlay';
  const body = (
    <div className="lib-split__body">
      {str(s, 'eyebrow') ? <span className="lib-eyebrow">{str(s, 'eyebrow')}</span> : null}
      {str(s, 'heading') ? <h2 className="lib-title">{str(s, 'heading')}</h2> : null}
      {str(s, 'text') ? <RichHtml html={str(s, 'text')} className="lib-prose" /> : null}
      {str(s, 'cta_label') ? (
        <div className="lib-split__actions">
          <LibButton href={str(s, 'cta_url', '/about')} variant={overlay ? 'inverse' : 'primary'}>{str(s, 'cta_label')}</LibButton>
        </div>
      ) : null}
    </div>
  );
  if (overlay) {
    return (
      <LibSection className={bandClass(str(s, 'background', 'none'))} style={spacingStyle(s)}>
        <div className={cn('lib-split lib-split--overlay', aspectClass(str(s, 'aspect', 'landscape')))} style={{ '--lib-overlay': String(num(s, 'overlay', 45) / 100) } as CSSProperties}>
          <div className="lib-split__media">
            <LibImage src={str(s, 'image')} alt="" className="lib-split__img" />
            <span className="lib-split__scrim" aria-hidden />
          </div>
          {body}
        </div>
      </LibSection>
    );
  }
  return (
    <LibSection className={bandClass(str(s, 'background', 'none'))} narrow={layout === 'stacked'} style={spacingStyle(s)}>
      <div className={cn('lib-split', layout === 'image-right' && 'lib-split--reverse', layout === 'stacked' && 'lib-split--stacked')}>
        <div className={cn('lib-split__media', aspectClass(str(s, 'aspect', 'landscape')))}>
          <LibImage src={str(s, 'image')} alt="" className="lib-split__img" />
        </div>
        {body}
      </div>
    </LibSection>
  );
}
