/**
 * Voltage account orders — the order log. Mono rows (number · date · status → total) linking to the
 * order detail. Real data via the shared orders API. Spinner + empty state. Voltage's own markup.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Spinner } from '../components/Spinner';
import { useStore } from '../../../state/store-context';
import { useAsync } from '../../../api/useAsync';
import { getOrders, type ApiOrder } from '../../../api/storefront';
import { formatDate, formatMoney } from '../../../utils/format';

export function OrdersSection(_props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const { store } = useStore();
  const ordersQ = useAsync(() => getOrders(), []);
  const orders: ReadonlyArray<ApiOrder> = ordersQ.data?.data ?? [];

  if (ordersQ.loading) return <div className="vlt-account-loading"><Spinner label={t('account.loadingOrders')} /></div>;
  if (orders.length === 0) {
    return (
      <div className="vlt-empty vlt-empty--pad">
        <span className="vlt-empty__title">{t('account.ordersEmpty')}</span>
        <span className="vlt-empty__text">{t('account.ordersEmptyHint')}</span>
      </div>
    );
  }

  return (
    <ul className="vlt-log">
      {orders.map((order) => (
        <li key={order.id}>
          <a href={`/account/orders/${order.number}`} className="vlt-log__row">
            <span className="vlt-log__main">
              <span className="vlt-log__title">{t('account.orderNumber', { number: order.number })}</span>
              <span className="vlt-log__meta vlt-num">{formatDate(order.created_at) ?? ''} · {order.status}</span>
            </span>
            <span className="vlt-log__value vlt-num">{formatMoney(Number(order.total), order.currency || store.currency)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
