/**
 * order-success — the post-checkout confirmation. Warm thank-you, what-happens-next delivery note,
 * and a route onward. The app owns the real order record; the theme provides the reassurance.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { Section } from '../components/Section';

export function OrderSuccessSection(props: SectionRenderProps): ReactElement {
  const bag = props.context.data as { orderNumber?: unknown };
  const orderNumber = typeof bag.orderNumber === 'string' ? bag.orderNumber : undefined;

  return (
    <Section>
      <Container narrow>
        <div className="hh-order-success">
          <span className="hh-order-success__mark" aria-hidden>
            ✓
          </span>
          <h1 className="hh-order-success__title">Thank you — your order is in</h1>
          {orderNumber ? <p className="hh-order-success__ref">Order {orderNumber}</p> : null}
          <p className="hh-order-success__body">
            We’ll email your confirmation shortly. For larger pieces, our team will be in touch to
            schedule a delivery date that suits you.
          </p>
          <div className="hh-order-success__actions">
            <ButtonLink href="/">Continue shopping</ButtonLink>
            <ButtonLink href="/account/orders" variant="outline">
              View orders
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
