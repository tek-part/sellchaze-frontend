/**
 * order-success — the post-checkout confirmation. Warm thank-you, what-happens-next delivery note,
 * and a route onward. The app owns the real order record; the theme provides the reassurance.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { Section } from '../components/Section';

export function OrderSuccessSection(props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const bag = props.context.data as { orderNumber?: unknown };
  const orderNumber = typeof bag.orderNumber === 'string' ? bag.orderNumber : undefined;

  return (
    <Section>
      <Container narrow>
        <div className="hh-order-success">
          <span className="hh-order-success__mark" aria-hidden>
            ✓
          </span>
          <h1 className="hh-order-success__title">{t('checkout.thankYouHearth')}</h1>
          {orderNumber ? <p className="hh-order-success__ref">{t('account.orderNumber', { number: orderNumber })}</p> : null}
          <p className="hh-order-success__body">
            {t('checkout.orderSuccessBodyHearth')}
          </p>
          <div className="hh-order-success__actions">
            <ButtonLink href="/">{t('cart.continueShopping')}</ButtonLink>
            <ButtonLink href="/account/orders" variant="outline">
              {t('checkout.viewOrders')}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
