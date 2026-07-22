/**
 * Rouge newsletter — an editorial "join the list" panel over an aura glow, with an email capture and
 * a gift incentive line. Settings: eyebrow, title, subtitle, cta_label, incentive.
 *
 * Honesty: this previously flipped a flag and told the visitor "You're on the list — check your
 * inbox for your code", which was false twice over — nothing was recorded and no email would ever
 * arrive. It now uses the shared newsletter hook, which stores the address on the device and says
 * exactly that.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Button } from '../components/Button';
import { ButtonLink } from '../components/ButtonLink';
import { Eyebrow } from '../components/Typography';
import { IconCheck } from '../components/icons';
import { useNewsletter } from '../../../shared-ui';
import { text } from './section-settings';

export function NewsletterSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const eyebrow = text(settings, 'eyebrow', 'The Rouge Édit');
  const title = text(settings, 'title', 'Join the list, unlock 10% off');
  const subtitle = text(settings, 'subtitle', 'Early access to launches, shade drops, and members-only rituals.');
  const ctaLabel = text(settings, 'cta_label', 'Subscribe');
  const incentive = text(settings, 'incentive', 'Plus a complimentary sample with your first order.');
  const [email, setEmail] = useState('');
  const { status, message, submitting, subscribe } = useNewsletter();
  const done = status === 'saved' || status === 'subscribed';

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void subscribe(email);
  };

  return (
    <Section>
      <Container narrow>
        <div className="rge-news">
          <div className="rge-aura rge-news__aura" aria-hidden />
          <div className="rge-news__inner">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="rge-news__title">{title}</h2>
            <p className="rge-news__sub">{subtitle}</p>
            {done ? (
              <div className="rge-news__done" role="status">
                <p>
                  <IconCheck width={18} height={18} aria-hidden /> {message}
                </p>
                <ButtonLink href="/contact" variant="ghost">
                  Contact us
                </ButtonLink>
              </div>
            ) : (
              <form className="rge-news__form" onSubmit={onSubmit} noValidate>
                <label className="sr-only" htmlFor="rge-news-email">
                  Email address
                </label>
                <input
                  id="rge-news-email"
                  className="rge-control rge-news__input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={status === 'invalid' || undefined}
                  {...(status === 'invalid' || status === 'error' ? { 'aria-describedby': 'rge-news-error' } : {})}
                />
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? 'Signing up…' : ctaLabel}
                </Button>
              </form>
            )}
            {!done && (status === 'invalid' || status === 'error') ? (
              <p id="rge-news-error" className="rge-news__error" role="alert">
                {message}
              </p>
            ) : null}
            {!done && incentive ? <p className="rge-news__fine">{incentive}</p> : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
