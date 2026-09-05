import { useTranslation } from 'react-i18next';

/**
 * Order origin (workstream D): where a B2B order row came from.
 *   storefront      – placed by a customer on the owner's storefront (bridged via `SF-…`)
 *   external_store  – synced from an external shop (Wigpleasure/WooCommerce)
 *   merchant_direct – created by a merchant/admin from the dashboard
 * Order of this array is also the order of the filter tabs.
 */
export const ORDER_SOURCES = ['storefront', 'external_store', 'merchant_direct'];

const STYLES = {
    storefront: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    external_store: 'bg-violet-50 text-violet-700 border-violet-100',
    merchant_direct: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function orderSourceLabel(t, source) {
    const s = String(source ?? '').trim();
    if (!s) {
        return '';
    }
    return t(`order_source_${s}`, { defaultValue: s.replace(/_/g, ' ') });
}

/** Same bordered-pill treatment as `StatusBadge`. Renders "—" when the row has no source. */
export default function OrderSourceBadge({ source, className = '' }) {
    const { t } = useTranslation();
    const s = String(source ?? '').trim();
    if (!s) {
        return <span className="text-slate-400">—</span>;
    }
    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${
                STYLES[s] || STYLES.merchant_direct
            } ${className}`}
        >
            {orderSourceLabel(t, s)}
        </span>
    );
}
