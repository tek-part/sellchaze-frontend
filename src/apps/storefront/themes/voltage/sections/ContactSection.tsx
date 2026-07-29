/**
 * Voltage contact — a get-in-touch console. No contact endpoint exists in the storefront API, so
 * submit composes a mailto: to the client-care address (same approach as the reference theme).
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Button } from '../components/Button';
import { text } from './section-settings';

export function ContactSection(props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const email = text(props.settings, 'email') || 'client.care@selchase.example';
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    const subject = encodeURIComponent(`Enquiry from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <Section reveal>
      <Container narrow>
        <div className="vlt-flow-head">
          <span className="vlt-eyebrow">{t('contact.eyebrow')}</span>
          <h1 className="vlt-flow-head__title">{t('contact.getInTouch')}</h1>
        </div>
        <p className="vlt-prose__p" style={{ marginBottom: 'var(--sp-5)' }}>{t('contact.repliesWithin')}</p>
        <form className="vlt-account-form" onSubmit={submit} noValidate>
          <Input label={t('contact.yourName')} name="name" autoComplete="name" required value={form.name} onChange={set('name')} />
          <Input label={t('auth.email')} type="email" name="email" autoComplete="email" required value={form.email} onChange={set('email')} />
          <Textarea label={t('contact.howCanWeHelp')} rows={5} required value={form.message} onChange={set('message')} />
          <div><Button type="submit">{t('contact.sendMessage')}</Button></div>
        </form>
      </Container>
    </Section>
  );
}
