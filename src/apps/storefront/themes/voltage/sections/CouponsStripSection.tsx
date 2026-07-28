/** Voltage coupons-strip — a thin promo band with a mono code chip and optional CTA. Self-hides empty. */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { text } from './section-settings';
import { couponsFrom } from '../../../content/home-data';

export function CouponsStripSection(props: SectionRenderProps): ReactElement | null {
  const coupon = couponsFrom(props.context)[0];
  const code = coupon?.code ?? text(props.settings, 'code');
  const message = coupon
    ? (coupon.type === 'percentage' ? `Save ${coupon.value}% — use code` : `Save ${coupon.value} — use code`)
    : text(props.settings, 'message');
  if (!message && !code) return null;
  const ctaLabel = text(props.settings, 'cta_label', coupon ? 'Shop now' : '');
  const ctaUrl = text(props.settings, 'cta_url', coupon ? '/shop' : '');

  return (
    <div className="vlt-strip">
      <Container>
        <div className="vlt-strip__inner">
          {message ? <span className="vlt-strip__msg">{message}</span> : null}
          {code ? <span className="vlt-strip__code vlt-num">{code}</span> : null}
          {ctaLabel && ctaUrl ? <a className="vlt-strip__cta" href={ctaUrl}>{ctaLabel} →</a> : null}
        </div>
      </Container>
    </div>
  );
}
