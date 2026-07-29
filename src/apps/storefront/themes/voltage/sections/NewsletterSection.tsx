/**
 * Voltage newsletter — email capture with a calm confirmation. Settings: title, text, cta_label.
 * Voltage's own .vlt-* markup.
 *
 * No storefront subscribe endpoint exists. This used to validate locally and then claim "You're on
 * the list — watch your inbox", which was untrue: nothing was recorded and no email would follow.
 * The shared hook now stores the address on the device and reports exactly that.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Button } from '../components/Button';
import { ButtonLink } from '../components/ButtonLink';
import { useNewsletter } from '../../../shared-ui';
import { text } from './section-settings';
import { newsletterFrom } from '../../../content/home-data';
import { subscribeNewsletter } from '../../../api/storefront';

export function NewsletterSection(props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const copy = newsletterFrom(props.context);
  const title = copy.title ?? (text(props.settings, 'title') || t('newsletter.voltageTitle'));
  const blurb = copy.text ?? (text(props.settings, 'text') || t('newsletter.voltageText'));
  const ctaLabel = copy.cta ?? (text(props.settings, 'cta_label') || t('newsletter.subscribe'));
  const [email, setEmail] = useState('');
  const { status, message, submitting, subscribe } = useNewsletter({ submit: (e) => subscribeNewsletter(e).then(() => undefined) });
  const done = status === 'saved' || status === 'subscribed';
  const error = status === 'invalid' || status === 'error' ? message : undefined;

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    void subscribe(email);
  };

  return (
    <Section reveal>
      <Container>
        <div className="vlt-newsletter">
          <div className="vlt-newsletter__copy">
            <span className="vlt-eyebrow">{t('newsletter.eyebrow')}</span>
            <h2 className="vlt-newsletter__title">{title}</h2>
            <p className="vlt-newsletter__text">{blurb}</p>
          </div>
          {done ? (
            <div className="vlt-newsletter__done" role="status">
              <p>{message}</p>
              <ButtonLink href="/contact" variant="ghost">{t('contact.contactUs')}</ButtonLink>
            </div>
          ) : (
            <form className="vlt-newsletter__form" onSubmit={submit} noValidate>
              <label className="vlt-visually-hidden" htmlFor="vlt-newsletter-email">{t('footer.emailLabel')}</label>
              <input
                id="vlt-newsletter-email"
                type="email"
                className="vlt-newsletter__input"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                {...(error ? { 'aria-describedby': 'vlt-newsletter-error' } : {})}
              />
              <Button type="submit" variant="accent" disabled={submitting}>
                {submitting ? t('newsletter.subscribing') : ctaLabel}
              </Button>
              {error ? <p id="vlt-newsletter-error" className="vlt-newsletter__error" role="alert">{error}</p> : null}
            </form>
          )}
        </div>
      </Container>
    </Section>
  );
}
