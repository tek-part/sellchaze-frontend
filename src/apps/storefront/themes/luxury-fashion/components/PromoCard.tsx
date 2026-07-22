/**
 * PromoCard — an offer / coupon callout. Code in mono inside a dashed hairline; copying yields
 * exactly one confirmation (via the onCopied callback so the caller raises a single toast). Bordeaux
 * is reserved for genuine urgency, applied by the caller. See §32.4.
 */
import { useState, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { Button } from './Button';
import { LinkButton } from './LinkButton';

export interface PromoCardProps {
  title?: ReactNode;
  text?: ReactNode;
  /** Coupon code to display and copy. */
  code?: string;
  onCopied?: (code: string) => void;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
}

export function PromoCard(props: PromoCardProps): ReactElement {
  const { title, text, code, onCopied, ctaHref, ctaLabel = 'Shop now', className } = props;
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    if (!code) return;
    try {
      await navigator.clipboard?.writeText(code);
      setCopied(true);
      onCopied?.(code);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — leave the code visible for manual copy */
    }
  };

  return (
    <article className={cn('sf-promo', className)}>
      {title ? <h3 className="sf-promo__title">{title}</h3> : null}
      {text ? <p className="sf-promo__text">{text}</p> : null}
      {code ? (
        <div className="sf-promo__code">
          <span className="sf-promo__code-value">{code}</span>
          <Button size="sm" variant="secondary" onClick={() => void copy()}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      ) : null}
      {ctaHref ? (
        <LinkButton variant="arrow" href={ctaHref}>
          {ctaLabel}
        </LinkButton>
      ) : null}
    </article>
  );
}
