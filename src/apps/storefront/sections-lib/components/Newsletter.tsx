/**
 * newsletter — email capture wired to POST /storefront/newsletter. Layouts: band (full-width),
 * card (inside the container), inline (heading beside the form) and split-image (photo + form).
 * Client-side validation, inline status (idle → busy → done/error), no full-page reload.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { subscribeNewsletter } from '../../api/storefront';
import { defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect } from '../schema';
import { bandClass, spacingStyle, str, useSectionSettings, useVariant } from '../use-section';
import { LibImage, LibSection, useLibId } from '../primitives';
import { useLibT } from '../i18n';

export const NEWSLETTER_LAYOUTS = variants('layout', [
  { value: 'band', label: 'Band', description: 'Full-width coloured band.', icon: 'HiOutlineRectangleStack' },
  { value: 'card', label: 'Card', description: 'A rounded card inside the container.', icon: 'HiOutlineSquare2Stack' },
  { value: 'inline', label: 'Inline', description: 'Heading on one side, form on the other.', icon: 'HiOutlineArrowsRightLeft' },
  { value: 'split-image', label: 'Split image', description: 'A photo beside the sign-up form.', icon: 'HiOutlinePhoto' },
], { style: { band: 'band', card: 'card' } });

export const newsletterSchema = defineSection({
  type: 'newsletter',
  label: 'Newsletter',
  description: 'Email sign-up with a headline and note.',
  category: 'marketing',
  icon: 'HiOutlineEnvelope',
  variants: NEWSLETTER_LAYOUTS,
  settings: [
    variantSelect(NEWSLETTER_LAYOUTS, 'band'),
    fields.text('eyebrow', 'Eyebrow', ''),
    fields.text('heading', 'Heading', tr('اشترك في نشرتنا البريدية', 'Join our newsletter')),
    fields.textarea('text', 'Text', tr('كن أول من يعرف عن الجديد والعروض الحصرية.', 'Be the first to hear about new arrivals and exclusive offers.')),
    fields.text('placeholder', 'Input placeholder', ''),
    fields.text('button_label', 'Button label', ''),
    fields.text('note', 'Small print', tr('لن نرسل لك رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.', 'No spam. Unsubscribe any time.')),
    fields.image('image', 'Image (Split image layout)', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&h=900&q=80'),
    fields.select('align', 'Alignment', OPTIONS.align, 'center'),
    fields.select('background', 'Background', OPTIONS.background, 'primary'),
    ...spacingFields(),
  ],
});

type Status = 'idle' | 'busy' | 'done' | 'error' | 'invalid';

export function Newsletter(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(newsletterSchema, props.settings);
  const layout = useVariant(newsletterSchema, props.settings);
  const t = useLibT();
  const id = useLibId('libnl');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('invalid');
      return;
    }
    setStatus('busy');
    try {
      await subscribeNewsletter(value);
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  const message = status === 'done' ? t('subscribed') : status === 'error' ? t('subscribeError') : status === 'invalid' ? t('invalidEmail') : '';
  const boxed = layout !== 'band';
  const band = bandClass(str(s, 'background', 'primary'));
  const align = layout === 'inline' || layout === 'split-image' ? 'start' : str(s, 'align', 'center');

  const form = (
    <form className="lib-newsletter__form" onSubmit={(e) => void submit(e)} noValidate>
      <label htmlFor={id} className="lib-sr-only">{str(s, 'placeholder') || t('emailPlaceholder')}</label>
      <input
        id={id}
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        className="lib-input"
        placeholder={str(s, 'placeholder') || t('emailPlaceholder')}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status !== 'idle' && status !== 'busy') setStatus('idle');
        }}
        aria-invalid={status === 'invalid' || undefined}
        aria-describedby={message ? `${id}-msg` : undefined}
        disabled={status === 'busy'}
      />
      <button type="submit" className="lib-btn lib-btn--primary lib-btn--md lib-newsletter__btn" disabled={status === 'busy'}>
        {status === 'busy' ? t('subscribing') : str(s, 'button_label') || t('subscribe')}
      </button>
    </form>
  );
  const note = message ? (
    <p id={`${id}-msg`} className={cn('lib-newsletter__msg', status === 'done' ? 'is-ok' : 'is-err')} role="status">{message}</p>
  ) : str(s, 'note') ? (
    <p className="lib-newsletter__note">{str(s, 'note')}</p>
  ) : null;
  const copy = (
    <div className="lib-newsletter__copy">
      {str(s, 'eyebrow') ? <span className="lib-eyebrow">{str(s, 'eyebrow')}</span> : null}
      {str(s, 'heading') ? <h2 className="lib-title">{str(s, 'heading')}</h2> : null}
      {str(s, 'text') ? <p className="lib-subtitle">{str(s, 'text')}</p> : null}
    </div>
  );

  return (
    <LibSection className={cn('lib-newsletter', `lib-newsletter--${layout}`, !boxed && band, boxed && 'lib-newsletter--card-mode')} style={spacingStyle(s)}>
      <div className={cn('lib-newsletter__box', `lib-newsletter--${align}`, boxed && cn('lib-newsletter__card', band))}>
        {layout === 'split-image' ? (
          <div className="lib-newsletter__media">
            <LibImage src={str(s, 'image')} alt="" className="lib-newsletter__img" />
          </div>
        ) : null}
        {layout === 'inline' ? (
          <>
            {copy}
            <div className="lib-newsletter__side">{form}{note}</div>
          </>
        ) : (
          <div className="lib-newsletter__body">
            {copy}
            {form}
            {note}
          </div>
        )}
      </div>
    </LibSection>
  );
}
