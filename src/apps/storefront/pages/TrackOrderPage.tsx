/**
 * G2: guest order tracking (/track). The order number plus the phone or e-mail used on the order
 * shows its progress, shipments (carrier, tracking number and link), items and totals. Every miss
 * shows the same message; the API never returns addresses or contact details here.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Container, Input, Section } from '../foundation/components';
import { trackOrder, type ApiOrder, type ApiTrackedOrder } from '../api/storefront';
import { useStore } from '../state/store-context';
import { formatDate, formatMoney } from '../utils/format';
import { apiErrorText, asciiDigits } from './customer-login';
import { OrderStatusLabel, OrderTimeline, OrderTotals } from './OrderProgress';
import { OrderShipmentsSection } from './OrderShipmentsSection';

export function TrackOrderPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const { store } = useStore();
  const [number, setNumber] = useState(() => new URLSearchParams(window.location.search).get('order') ?? '');
  const [contact, setContact] = useState('');
  const [order, setOrder] = useState<ApiTrackedOrder | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (busy || !number.trim() || !contact.trim()) return;
    setBusy(true);
    setError(undefined);
    try {
      const { data } = await trackOrder({ order_number: number.trim(), contact: asciiDigits(contact.trim()) });
      setOrder(data);
    } catch (failure) {
      setError(apiErrorText(failure, t('track.notFound')));
    } finally {
      setBusy(false);
    }
  };

  const currency = order?.currency || store.currency;
  return (
    <Section>
      <Container>
        <div className="sf-track">
          <h1 className="sf-auth__title">{t('track.title')}</h1>
          {order ? (
            <>
              <div className="sf-account__panel" aria-live="polite">
                <div style={{ fontFamily: 'var(--heading)', fontSize: 'var(--fs-xl)', color: 'var(--text)' }}>{t('account.orderNumber', { number: order.number })}</div>
                <div className="sf-card-row__meta">
                  {order.placed_at ? `${t('track.placedOn', { date: formatDate(order.placed_at, i18n.language) ?? '' })} · ` : ''}<OrderStatusLabel status={order.status} />
                </div>
              </div>
              <OrderTimeline timeline={order.timeline} />
              <OrderShipmentsSection order={{ id: 0, number: order.number, status: order.status, total: order.grand_total, fulfillments: order.fulfillments,
                ...(order.fulfillment_status ? { fulfillment_status: order.fulfillment_status } : {}) } satisfies ApiOrder} />
              <section className="sf-account__panel" aria-labelledby="sf-track-items">
                <h2 id="sf-track-items" className="sf-footer__group-title">{t('track.items')}</h2>
                <ul className="sf-card-list">
                  {order.items.map((item) => (
                    <li key={item.id} className="sf-card-row">
                      <div>
                        <div style={{ fontFamily: 'var(--heading)', color: 'var(--text)' }}>{item.name}{item.variant_name ? ` (${item.variant_name})` : ''}</div>
                        <div className="sf-card-row__meta">{t('account.qty', { count: item.quantity })}</div>
                      </div>
                      <div>{formatMoney(Number(item.line_total), currency, i18n.language)}</div>
                    </li>
                  ))}
                </ul>
              </section>
              <OrderTotals totals={order} currency={currency} />
              <Button type="button" variant="secondary" onClick={() => { setOrder(null); setContact(''); }}>{t('track.searchAgain')}</Button>
            </>
          ) : (
            <form className="sf-auth" onSubmit={(event) => void submit(event)} noValidate>
              <p className="sf-auth__alt">{t('track.intro')}</p>
              <Input label={t('track.orderNumber')} name="order_number" dir="ltr" autoComplete="off" required maxLength={64} value={number} onChange={(event) => setNumber(event.target.value)} />
              <Input label={t('track.contact')} name="contact" dir="ltr" autoComplete="tel" required maxLength={255} value={contact} onChange={(event) => setContact(event.target.value)} />
              {error ? <p role="alert" className="sf-field__error">{error}</p> : null}
              <Button type="submit" block loading={busy} disabled={!number.trim() || !contact.trim()}>{t('track.submit')}</Button>
              <p className="sf-auth__alt"><a href="/login">{t('track.signInHint')}</a></p>
            </form>
          )}
        </div>
      </Container>
    </Section>
  );
}
