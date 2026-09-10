/**
 * contact-form — name / email / (subject) / message posted to `POST /storefront/contact`. Layouts:
 * stacked (form in a reading measure), split (store contact details beside the form) and card.
 * Client-side required/email validation, inline status, no full-page reload.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { submitContact } from '../../api/storefront';
import { defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect } from '../schema';
import { bandClass, bool, spacingStyle, str, useSectionSettings, useVariant } from '../use-section';
import { LibSection, useLibId } from '../primitives';
import { useLibT } from '../i18n';
import { LibIcon } from './Features';

export const CONTACT_LAYOUTS = variants('layout', [
  { value: 'stacked', label: 'Stacked', description: 'Heading above the form in a reading measure.', icon: 'HiOutlineBars3CenterLeft' },
  { value: 'split', label: 'Split', description: 'Contact details beside the form.', icon: 'HiOutlineViewColumns' },
  { value: 'card', label: 'Card', description: 'The form on a raised card.', icon: 'HiOutlineSquare2Stack' },
]);

export const contactFormSchema = defineSection({
  type: 'contact-form',
  label: 'Contact form',
  description: 'A message form that emails the store.',
  category: 'content',
  icon: 'HiOutlineEnvelopeOpen',
  variants: CONTACT_LAYOUTS,
  settings: [
    variantSelect(CONTACT_LAYOUTS, 'stacked'),
    fields.text('eyebrow', 'Eyebrow', ''),
    fields.text('heading', 'Heading', tr('تواصل معنا', 'Get in touch')),
    fields.textarea('text', 'Text', tr('سؤال عن طلب أو منتج؟ اكتب لنا وسنرد خلال يوم عمل.', 'A question about an order or a product? Write to us and we reply within a business day.')),
    fields.toggle('show_subject', 'Ask for a subject', false),
    fields.text('button_label', 'Button label', ''),
    fields.text('success', 'Success message', ''),
    fields.toggle('show_details', 'Show store phone & email (Split layout)', true),
    fields.select('background', 'Background', OPTIONS.background, 'none'),
    ...spacingFields(),
  ],
});

type Status = 'idle' | 'busy' | 'done' | 'error' | 'invalid';

export function ContactForm(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(contactFormSchema, props.settings);
  const layout = useVariant(contactFormSchema, props.settings);
  const t = useLibT();
  const id = useLibId('libcf');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const withSubject = bool(s, 'show_subject');
  const store = props.context.store;

  const update = (key: keyof typeof form) => (e: { target: { value: string } }): void => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (status !== 'idle' && status !== 'busy') setStatus('idle');
  };

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('invalid');
      return;
    }
    setStatus('busy');
    try {
      await submitContact({ name, email, message, ...(withSubject && form.subject.trim() ? { subject: form.subject.trim() } : {}) });
      setStatus('done');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const feedback = status === 'done' ? str(s, 'success') || t('sent') : status === 'error' ? t('sendError') : status === 'invalid' ? t('required') : '';
  const busy = status === 'busy';
  const formEl = (
    <form className="lib-contact__form" onSubmit={(e) => void submit(e)} noValidate aria-describedby={feedback ? `${id}-msg` : undefined}>
      <div className="lib-contact__row">
        <label className="lib-field">
          <span className="lib-field__label">{t('name')}</span>
          <input className="lib-input" name="name" autoComplete="name" required value={form.name} onChange={update('name')} disabled={busy} />
        </label>
        <label className="lib-field">
          <span className="lib-field__label">{t('email')}</span>
          <input className="lib-input" type="email" name="email" autoComplete="email" inputMode="email" required value={form.email} onChange={update('email')} disabled={busy} />
        </label>
      </div>
      {withSubject ? (
        <label className="lib-field">
          <span className="lib-field__label">{t('subject')}</span>
          <input className="lib-input" name="subject" value={form.subject} onChange={update('subject')} disabled={busy} />
        </label>
      ) : null}
      <label className="lib-field">
        <span className="lib-field__label">{t('message')}</span>
        <textarea className="lib-input lib-textarea" name="message" rows={5} required value={form.message} onChange={update('message')} disabled={busy} />
      </label>
      <div className="lib-contact__actions">
        <button type="submit" className="lib-btn lib-btn--primary lib-btn--md" disabled={busy}>{busy ? t('sending') : str(s, 'button_label') || t('send')}</button>
        {feedback ? <p id={`${id}-msg`} className={cn('lib-contact__msg', status === 'done' ? 'is-ok' : 'is-err')} role="status">{feedback}</p> : null}
      </div>
    </form>
  );
  const head = (
    <div className="lib-contact__head">
      {str(s, 'eyebrow') ? <span className="lib-eyebrow">{str(s, 'eyebrow')}</span> : null}
      {str(s, 'heading') ? <h2 className="lib-title">{str(s, 'heading')}</h2> : null}
      {str(s, 'text') ? <p className="lib-subtitle">{str(s, 'text')}</p> : null}
    </div>
  );
  const details = layout === 'split' && bool(s, 'show_details', true) && (store.phone || store.email) ? (
    <ul className="lib-contact__details">
      {store.phone ? <li><span className="lib-contact__icon"><LibIcon name="phone" size={20} /></span><span><span className="lib-contact__label">{t('callUs')}</span><a href={`tel:${store.phone}`} dir="ltr">{store.phone}</a></span></li> : null}
      {store.email ? <li><span className="lib-contact__icon"><LibIcon name="chat" size={20} /></span><span><span className="lib-contact__label">{t('emailUs')}</span><a href={`mailto:${store.email}`} dir="ltr">{store.email}</a></span></li> : null}
    </ul>
  ) : null;

  return (
    <LibSection className={cn('lib-contact', `lib-contact--${layout}`, bandClass(str(s, 'background', 'none')))} narrow={layout !== 'split'} style={spacingStyle(s)}>
      {layout === 'split' ? (
        <div className="lib-contact__split">
          <div className="lib-contact__aside">{head}{details}</div>
          {formEl}
        </div>
      ) : (
        <div className={cn('lib-contact__stack', layout === 'card' && 'lib-contact__card')}>
          {head}
          {formEl}
        </div>
      )}
    </LibSection>
  );
}
