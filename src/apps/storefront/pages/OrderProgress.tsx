/**
 * G2: an order's status timeline and price summary, shared by guest tracking (/track) and the
 * customer account order page. Statuses are shown as customer-facing copy, never raw keys.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApiOrderTimelineEntry } from '../api/storefront';
import { formatDate, formatMoney } from '../utils/format';
import { orderStatusKey } from './customer-login';

export function OrderStatusLabel({ status }: { status: string }): ReactElement {
  const { t } = useTranslation();
  return <>{t(orderStatusKey(status))}</>;
}

export function OrderTimeline({ timeline }: { timeline?: ReadonlyArray<ApiOrderTimelineEntry> }): ReactElement | null {
  const { t, i18n } = useTranslation();
  if (!timeline || timeline.length === 0) return null;
  return (
    <section className="sf-account__panel" aria-labelledby="sf-order-progress-title">
      <h2 id="sf-order-progress-title" className="sf-footer__group-title">{t('account.orderProgress')}</h2>
      <ol className="sf-timeline" data-testid="sf-order-timeline">
        {timeline.map((entry, index) => (
          <li key={`${entry.status}-${index}`} className="sf-timeline__step" aria-current={index === timeline.length - 1 ? 'step' : undefined}>
            <span><OrderStatusLabel status={entry.status} /></span>
            {entry.at ? <time className="sf-timeline__date" dateTime={entry.at}>{formatDate(entry.at, i18n.language) ?? ''}</time> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

interface Totals {
  subtotal?: string | number | null;
  shipping_total?: string | number | null;
  discount_total?: string | number | null;
  tax_total?: string | number | null;
  grand_total?: string | number | null;
  amount_due?: string | number | null;
}

export function OrderTotals({ totals, currency }: { totals: Totals; currency: string }): ReactElement {
  const { t, i18n } = useTranslation();
  const money = (value: string | number): string => formatMoney(Number(value), currency, i18n.language);
  const rows: Array<[string, string | number | null | undefined, boolean]> = [
    ['account.subtotal', totals.subtotal, false],
    ['account.shipping', totals.shipping_total, false],
    ['account.discount', totals.discount_total, true],
    ['account.tax', totals.tax_total, true],
  ];
  const due = totals.amount_due !== undefined && totals.amount_due !== null && Number(totals.amount_due) !== Number(totals.grand_total) ? totals.amount_due : null;
  return (
    <section className="sf-account__panel" aria-labelledby="sf-order-summary-title">
      <h2 id="sf-order-summary-title" className="sf-footer__group-title">{t('account.orderSummary')}</h2>
      <dl className="sf-order-totals">
        {rows.filter(([, value, optional]) => value !== undefined && value !== null && (!optional || Number(value) !== 0)).map(([key, value]) => (
          <div key={key}><dt>{t(key)}</dt><dd>{key === 'account.discount' ? `−${money(value as string | number)}` : money(value as string | number)}</dd></div>
        ))}
      </dl>
      {totals.grand_total !== undefined && totals.grand_total !== null ? (
        <div className="sf-cart-summary__total">
          <span>{t('account.orderTotal')}</span>
          <span className="sf-cart-summary__total-value">{money(totals.grand_total)}</span>
        </div>
      ) : null}
      {due !== null ? <dl className="sf-order-totals"><div><dt>{t('account.amountDue')}</dt><dd>{money(due)}</dd></div></dl> : null}
    </section>
  );
}
