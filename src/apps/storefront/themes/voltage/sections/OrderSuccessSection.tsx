/** Voltage order-success — a confirmation readout. Reads ?number; a clear way back to shopping. */
import type { ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ButtonLink } from '../components/ButtonLink';
import { IconCheck } from '../components/icons';

export function OrderSuccessSection(_props: SectionRenderProps): ReactElement {
  const [params] = useSearchParams();
  const number = params.get('number');
  return (
    <Section>
      <Container>
        <div className="vlt-success">
          <span className="vlt-success__mark" aria-hidden="true"><IconCheck /></span>
          <span className="vlt-eyebrow">// Order confirmed</span>
          <h1 className="vlt-success__title">Thank you for your order</h1>
          <p className="vlt-success__text">
            {number ? `Your order ${number} is confirmed.` : 'Your order is confirmed.'} A confirmation email is on its way.
          </p>
          <ButtonLink href="/" variant="primary" className="vlt-success__cta">Continue shopping</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
