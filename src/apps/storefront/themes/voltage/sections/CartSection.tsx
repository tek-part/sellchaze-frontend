/**
 * Voltage cart — the full bag as a spec sheet: line rows (thumb + title + config + qty + line total),
 * a mono order-summary rail, and an empty state. Reads/writes the shared cart store directly, so no
 * page-level data threading is needed. Voltage's own markup — no Theme 01 component is imported.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ButtonLink } from '../components/ButtonLink';
import { StoreImage } from '../components/Image';
import { Price } from '../components/Price';
import { QuantityStepper } from '../components/QuantityStepper';
import { IconButton } from '../components/IconButton';
import { IconClose } from '../components/icons';
import { useCart } from '../../../state/cart';

export function CartSection(_props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const cart = useCart();
  const currency = cart.totals.currency || 'USD';

  if (cart.lines.length === 0) {
    return (
      <Section>
        <Container>
          <div className="vlt-flow-head">
            <span className="vlt-eyebrow">{t('cart.eyebrow')}</span>
            <h1 className="vlt-flow-head__title">{t('cart.title')}</h1>
          </div>
          <div className="vlt-empty vlt-empty--pad">
            <span className="vlt-empty__title">{t('cart.empty')}</span>
            <span className="vlt-empty__text">{t('cart.emptyVoltage')}</span>
            <ButtonLink href="/collections/new-in" className="vlt-empty__cta">{t('cart.shopNewIn')}</ButtonLink>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container>
        <div className="vlt-flow-head">
          <span className="vlt-eyebrow">{t('cart.eyebrow')}</span>
          <h1 className="vlt-flow-head__title">{t('cart.title')}</h1>
        </div>
        <div className="vlt-cart">
          <ul className="vlt-cart__lines">
            {cart.lines.map((line) => (
              <li key={line.id} className="vlt-cart__line">
                <a href={line.url} className="vlt-cart__thumb" aria-hidden="true" tabIndex={-1}>
                  <StoreImage className="vlt-cart__thumb-img" src={line.image} alt="" />
                </a>
                <div className="vlt-cart__body">
                  <a href={line.url} className="vlt-cart__title">{line.title}</a>
                  {line.attributes ? <span className="vlt-cart__attr">{line.attributes}</span> : null}
                  <div className="vlt-cart__ctrls">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(q) => cart.updateQuantity(line.id, q)}
                      {...(line.maxQuantity ? { max: line.maxQuantity } : {})}
                      label={t('pdp.quantityFor', { title: line.title })}
                    />
                    <IconButton label={t('misc.removeItem', { title: line.title })} onClick={() => cart.remove(line.id)} className="vlt-cart__rm">
                      <IconClose />
                    </IconButton>
                  </div>
                </div>
                <div className="vlt-cart__price">
                  <Price amount={line.price * line.quantity} currency={line.currency} />
                </div>
              </li>
            ))}
          </ul>
          <aside className="vlt-summary" aria-label={t('checkout.orderSummary')}>
            <span className="vlt-eyebrow">{t('checkout.eyebrowSummary')}</span>
            <div className="vlt-summary__row">
              <span>{t('cart.subtotal')}</span>
              <span className="vlt-num"><Price amount={cart.totals.subtotal} currency={currency} /></span>
            </div>
            <div className="vlt-summary__row vlt-summary__row--muted">
              <span>{t('checkout.shipping')}</span>
              <span>{t('checkout.calculatedAtCheckout')}</span>
            </div>
            <div className="vlt-summary__total">
              <span>{t('checkout.total')}</span>
              <span className="vlt-num"><Price amount={cart.totals.subtotal} currency={currency} /></span>
            </div>
            <ButtonLink href="/checkout" variant="primary" className="vlt-summary__cta">{t('cart.checkout')}</ButtonLink>
            <ButtonLink href="/collections/new-in" variant="ghost" className="vlt-summary__cont">{t('cart.continueShopping')}</ButtonLink>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
