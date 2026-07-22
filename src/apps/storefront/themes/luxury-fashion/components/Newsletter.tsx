/**
 * Newsletter — email capture: serif eyebrow + underline field + ink button. Success is a calm inline
 * confirmation, never a popup celebration. `inline` (footer row) / `banded` (centred section). §32.3.
 */
import { useState, type FormEvent, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { Button } from './Button';
import { Eyebrow, Heading, Text } from './Typography';
import { Input } from './Input';

export type NewsletterStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface NewsletterProps {
  onSubmit: (email: string) => void;
  status?: NewsletterStatus;
  eyebrow?: ReactNode;
  title?: ReactNode;
  text?: ReactNode;
  variant?: 'inline' | 'banded';
  placeholder?: string;
  buttonLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  className?: string;
}

export function Newsletter(props: NewsletterProps): ReactElement {
  const {
    onSubmit,
    status = 'idle',
    eyebrow,
    title,
    text,
    variant = 'inline',
    placeholder = 'Email address',
    buttonLabel = 'Subscribe',
    successMessage = 'Thank you — please check your inbox to confirm.',
    errorMessage = 'Something went wrong. Please try again.',
    className,
  } = props;

  const [email, setEmail] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (status === 'submitting') return;
    onSubmit(email.trim());
  };

  return (
    <div className={cn('sf-newsletter', variant === 'banded' && 'sf-newsletter--banded', className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {title ? (
        <Heading as="h2" size="xl">
          {title}
        </Heading>
      ) : null}
      {text ? <Text muted>{text}</Text> : null}

      {status === 'success' ? (
        <p className="sf-newsletter__success" role="status">
          {successMessage}
        </p>
      ) : (
        <form className="sf-newsletter__form" onSubmit={handleSubmit} noValidate>
          <Input
            className="sf-newsletter__field"
            label={placeholder}
            type="email"
            name="email"
            required
            underline
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={status === 'error' ? errorMessage : undefined}
          />
          <Button type="submit" loading={status === 'submitting'}>
            {buttonLabel}
          </Button>
        </form>
      )}
    </div>
  );
}
