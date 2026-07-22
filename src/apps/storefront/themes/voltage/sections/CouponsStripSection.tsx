/** Voltage coupons-strip — a thin promo band with a mono code chip and optional CTA. Self-hides empty. */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { text } from './section-settings';

export function CouponsStripSection(props: SectionRenderProps): ReactElement | null {
  const message = text(props.settings, 'message');
  const code = text(props.settings, 'code');
  if (!message && !code) return null;
  const ctaLabel = text(props.settings, 'cta_label');
  const ctaUrl = text(props.settings, 'cta_url');

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
