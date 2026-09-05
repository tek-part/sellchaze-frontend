/**
 * image-with-text — split layout: image on one side, eyebrow/heading/rich text/CTA on the other.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { aspectClass, bandClass, spacingStyle, str, useSectionSettings } from '../use-section';
import { LibButton, LibImage, LibSection } from '../primitives';
import { RichHtml } from './RichText';

export const imageWithTextSchema = defineSection({
  type: 'image-with-text',
  label: 'Image with text',
  description: 'An image beside a headline, paragraph and button.',
  category: 'content',
  icon: 'HiOutlinePhoto',
  settings: [
    fields.image('image', 'Image', 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&h=900&q=80'),
    fields.text('eyebrow', 'Eyebrow', tr('قصتنا', 'Our story')),
    fields.text('heading', 'Heading', tr('جودة نثق بها، وخدمة تليق بك', 'Quality you can trust, service you deserve')),
    fields.richtext('text', 'Text', tr('<p>نختار كل منتج بعناية ونختبره قبل أن يصل إليك. هدفنا تجربة تسوق سهلة وسريعة من الطلب إلى الاستلام.</p>', '<p>We hand-pick and test every product before it reaches you. Our goal is a simple, fast shopping experience from order to delivery.</p>')),
    fields.text('cta_label', 'Button label', tr('اعرف المزيد', 'Learn more')),
    fields.url('cta_url', 'Button link', '/about'),
    fields.select('media_side', 'Image side', [{ value: 'start', label: 'Start' }, { value: 'end', label: 'End' }], 'start'),
    fields.select('aspect', 'Image ratio', OPTIONS.aspect, 'landscape'),
    fields.select('background', 'Background', OPTIONS.background, 'none'),
    ...spacingFields(),
  ],
});

export function ImageWithText(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(imageWithTextSchema, props.settings);
  return (
    <LibSection className={bandClass(str(s, 'background', 'none'))} style={spacingStyle(s)}>
      <div className={cn('lib-split', str(s, 'media_side') === 'end' && 'lib-split--reverse')}>
        <div className={cn('lib-split__media', aspectClass(str(s, 'aspect', 'landscape')))}>
          <LibImage src={str(s, 'image')} alt="" className="lib-split__img" />
        </div>
        <div className="lib-split__body">
          {str(s, 'eyebrow') ? <span className="lib-eyebrow">{str(s, 'eyebrow')}</span> : null}
          {str(s, 'heading') ? <h2 className="lib-title">{str(s, 'heading')}</h2> : null}
          {str(s, 'text') ? <RichHtml html={str(s, 'text')} className="lib-prose" /> : null}
          {str(s, 'cta_label') ? (
            <div className="lib-split__actions">
              <LibButton href={str(s, 'cta_url', '/about')}>{str(s, 'cta_label')}</LibButton>
            </div>
          ) : null}
        </div>
      </div>
    </LibSection>
  );
}
