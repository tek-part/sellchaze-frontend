/**
 * Voltage account order detail — a single order readout: header (number · date · status), line items,
 * total, and a way back. Real data via the shared order API. Voltage's own .vlt-* markup.
 */
import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Spinner } from '../components/Spinner';
import { useStore } from '../../../state/store-context';
import { useAsync } from '../../../api/useAsync';
import { getOrder } from '../../../api/storefront';
import { formatDate, formatMoney } from '../../../utils/format';

export function OrderDetailSection(_props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const { number = '' } = useParams();
  const { store } = useStore();
  const orderQ = useAsync(() => getOrder(number), [number]);
  const order = orderQ.data?.data;

  if (orderQ.loading) return <div className="vlt-account-loading"><Spinner label={t('account.loadingOrder')} /></div>;
  if (!order) {
    return (
      <div className="vlt-empty vlt-empty--pad">
        <span className="vlt-empty__title">{t('account.orderNotFound')}</span>
        <span className="vlt-empty__text">{t('account.orderNotFoundHint')}</span>
      </div>
    );
  }

  const currency = order.currency || store.currency;
  return (
    <div className="vlt-order">
      <div className="vlt-order__head">
        <span className="vlt-order__number">{t('account.orderNumber', { number: order.number })}</span>
        <span className="vlt-log__meta vlt-num">{formatDate(order.created_at) ?? ''} · {order.status}</span>
      </div>
      {order.items && order.items.length > 0 ? (
        <ul className="vlt-log">
          {order.items.map((item, i) => (
            <li key={item.id ?? i} className="vlt-log__row vlt-log__row--static">
              <span className="vlt-log__main">
                <span className="vlt-log__title">{item.name}</span>
                <span className="vlt-log__meta vlt-num">{t('account.qty', { count: item.quantity })}</span>
              </span>
              <span className="vlt-log__value vlt-num">{formatMoney(Number(item.price) * item.quantity, currency)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="vlt-order__total">
        <span>{t('account.orderTotal')}</span>
        <span className="vlt-num">{formatMoney(Number(order.total), currency)}</span>
      </div>
      <a href="/account/orders" className="vlt-linkbtn">← {t('account.backToOrders')}</a>
    </div>
  );
}
