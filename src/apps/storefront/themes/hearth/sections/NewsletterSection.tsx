/**
 * newsletter — warm email capture (design tips + early access). Progressive-enhancement submit:
 * shows an inline success message on submit; consent is explicit and never pre-checked. The real
 * subscribe endpoint is wired in the commerce/API phase — this validates the shape and UX.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Button } from '../components/Button';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Heading, SectionLabel, Text } from '../components/Typography';
import { useNewsletter } from '../../../shared-ui';
import { option, text } from './section-settings';

export function NewsletterSection(props: SectionRenderProps): ReactElement {
  const { settings } = props;
  const label = text(settings, 'label');
  const title = text(settings, 'title', 'Design notes & early access');
  const body = text(settings, 'body', 'Room inspiration, new arrivals and the occasional offer. No noise.');
  const placeholder = text(settings, 'placeholder', 'you@example.com');
  const ctaLabel = text(settings, 'cta_label', 'Subscribe');
  // No success_message setting: the outcome is decided by whether the address could actually be
  // recorded, not by copy. Claiming "check your inbox" when no email will ever be sent is a lie.
  const bg = option(settings, 'bg', ['oat', 'sand', 'cream'] as const, 'sand');

  const [email, setEmail] = useState('');
  const { status, message, submitting, subscribe } = useNewsletter();
  const done = status === 'saved' || status === 'subscribed';
  const failed = status === 'invalid' || status === 'error';

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void subscribe(email);
  };

  return (
    <Section bg={bg}>
      <Container narrow>
        <div className="hh-newsletter">
          {label ? <SectionLabel>{label}</SectionLabel> : null}
          <Heading as="h2" size="2xl" className="hh-newsletter__title">
            {title}
          </Heading>
          <Text muted className="hh-newsletter__body">
            {body}
          </Text>

          {done ? (
            <div className="hh-newsletter__success" role="status">
              <p>{message}</p>
              <ButtonLink href="/contact" variant="secondary">
                Contact us
              </ButtonLink>
            </div>
          ) : (
            <form className="hh-newsletter__form" onSubmit={onSubmit} noValidate>
              <label className="hh-visually-hidden" htmlFor="hh-newsletter-email">
                Email address
              </label>
              <input
                id="hh-newsletter-email"
                className="hh-input"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder={placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={status === 'invalid' || undefined}
                {...(failed ? { 'aria-describedby': 'hh-newsletter-error' } : {})}
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Signing up…' : ctaLabel}
              </Button>
            </form>
          )}
          {!done && failed ? (
            <p id="hh-newsletter-error" className="hh-newsletter__error" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
