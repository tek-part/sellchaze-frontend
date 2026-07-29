/** Voltage order-success — a confirmation readout. Reads ?number; a clear way back to shopping. */
import type { ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ButtonLink } from '../components/ButtonLink';
import { IconCheck } from '../components/icons';

export function OrderSuccessSection(_props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const number = params.get('number');
  return (
    <Section>
      <Container>
        <div className="vlt-success">
          <span className="vlt-success__mark" aria-hidden="true"><IconCheck /></span>
          <span className="vlt-eyebrow">{t('checkout.eyebrowConfirmed')}</span>
          <h1 className="vlt-success__title">{t('checkout.thankYou')}</h1>
          <p className="vlt-success__text">
            {number ? t('checkout.orderConfirmedNumber', { number }) : t('checkout.orderConfirmed')} {t('checkout.confirmationEmail')}
          </p>
          <ButtonLink href="/" variant="primary" className="vlt-success__cta">{t('cart.continueShopping')}</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
