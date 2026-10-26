/**
 * The order's shipments on the customer account order page: carrier, tracking number with a
 * tracking link, status and the items in each parcel. Orders shipped in several parcels say so.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../foundation/components';
import type { ApiOrder, ApiShipmentStatus } from '../api/storefront';
import { formatDate } from '../utils/format';

const STATUS_KEYS: Record<ApiShipmentStatus, string> = {
  pending: 'account.shipmentStatusPending',
  in_transit: 'account.shipmentStatusInTransit',
  delivered: 'account.shipmentStatusDelivered',
  failed: 'account.shipmentStatusFailed',
};

/** Only http(s) links are rendered, whatever the API returns. */
const safeUrl = (value?: string | null): string | null => (value && /^https?:\/\//i.test(value) ? value : null);

export function OrderShipmentsSection({ order }: { order: ApiOrder }): ReactElement | null {
  const { t } = useTranslation();
  const shipments = order.fulfillments ?? [];
  if (shipments.length === 0) return null;

  return (
    <section className="sf-return sf-shipments" aria-labelledby="sf-shipments-title">
      <h2 id="sf-shipments-title" className="sf-footer__group-title">{t('account.shipments')}</h2>
      {order.fulfillment_status === 'partial' ? <p className="sf-card-row__meta">{t('account.shipmentPartial')}</p> : null}
      <ul className="sf-card-list sf-return__list">
        {shipments.map((shipment, index) => {
          const url = safeUrl(shipment.tracking_url);
          return (
            <li key={shipment.id} className="sf-card-row sf-shipment" data-testid="sf-shipment">
              <div className="sf-shipment__body">
                <div className="sf-return__title">{t('account.shipmentNumber', { number: index + 1 })}</div>
                <div className="sf-card-row__meta">{t('account.shipmentCarrier', { name: shipment.carrier_name })}</div>
                {shipment.tracking_number ? (
                  <div className="sf-card-row__meta">{t('account.shipmentTracking')}: <bdi dir="ltr">{shipment.tracking_number}</bdi></div>
                ) : null}
                <ul className="sf-shipment__items">
                  {shipment.items.map((item) => (
                    <li key={item.store_order_item_id} className="sf-card-row__meta">
                      {item.name ?? ''}{item.variant_name ? ` (${item.variant_name})` : ''} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <div className="sf-card-row__meta">
                  {shipment.delivered_at
                    ? t('account.shipmentDeliveredOn', { date: formatDate(shipment.delivered_at) ?? '' })
                    : shipment.shipped_at ? t('account.shipmentShippedOn', { date: formatDate(shipment.shipped_at) ?? '' }) : null}
                </div>
                {url ? (
                  <a className="sf-link sf-shipment__track" href={url} target="_blank" rel="noopener noreferrer"
                    aria-label={t('account.shipmentTrackLabel', { number: shipment.tracking_number ?? '', carrier: shipment.carrier_name })}>
                    <span className="sf-link__label">{t('account.shipmentTrack')}</span>
                  </a>
                ) : null}
              </div>
              <Badge variant={shipment.status === 'failed' ? 'outline' : 'solid'}>{t(STATUS_KEYS[shipment.status] ?? STATUS_KEYS.in_transit)}</Badge>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
