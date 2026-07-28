/**
 * Rouge coupons-strip — a row of gilt-dashed offer cards with copy-to-clipboard codes. Settings:
 * title, coupons (newline "CODE | description"). Self-hides with none.
 */
import { useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { IconCheck } from '../components/icons';
import { lines, text } from './section-settings';
import { couponsFrom } from '../../../content/home-data';

function CouponCard(props: { code: string; description: string }): ReactElement {
  const { code, description } = props;
  const [copied, setCopied] = useState(false);
  const copy = (): void => {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.clipboard?.writeText) {
      void nav.clipboard.writeText(code).then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      });
    }
  };
  return (
    <button type="button" className="rge-coupon" onClick={copy} aria-label={`Copy code ${code}`}>
      <span className="rge-coupon__code rge-num">{code}</span>
      <span className="rge-coupon__desc">{description}</span>
      <span className="rge-coupon__action">{copied ? <><IconCheck width={14} height={14} /> Copied</> : 'Tap to copy'}</span>
    </button>
  );
}

export function CouponsStripSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title');
  const fromData = couponsFrom(context);
  const coupons = fromData.length
    ? fromData.map((c) => ({ code: c.code, description: c.type === 'percentage' ? `${c.value}% off your order` : `${c.value} off your order` }))
    : lines(settings, 'coupons')
        .map((row) => {
          const [code, description] = row.split('|').map((s) => s.trim());
          return code ? { code, description: description ?? '' } : null;
        })
        .filter((x): x is { code: string; description: string } => x !== null);

  if (coupons.length === 0) return null;

  return (
    <Section tight>
      <Container>
        {title ? <p className="rge-logos__title">{title}</p> : null}
        <div className="rge-coupons">
          {coupons.map((coupon) => (
            <CouponCard key={coupon.code} code={coupon.code} description={coupon.description} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
