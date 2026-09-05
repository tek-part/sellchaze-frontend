import { useTranslation } from 'react-i18next';
import { ORDER_SOURCES } from './OrderSourceBadge';

const DOT = {
    storefront: 'bg-emerald-500',
    external_store: 'bg-violet-500',
    merchant_direct: 'bg-slate-400',
};

/**
 * Segmented "All | Storefront | External | Direct" control that drives the
 * `?source=` filter on the orders list. `value` is '' for "All".
 * Logical (start/end) spacing only, so it mirrors correctly in RTL.
 */
export default function OrderSourceTabs({ value, onChange, className = '' }) {
    const { t } = useTranslation();
    const current = ORDER_SOURCES.includes(value) ? value : '';
    const tabs = [
        { value: '', label: t('order_source_all') },
        ...ORDER_SOURCES.map((s) => ({ value: s, label: t(`order_source_${s}`) })),
    ];

    return (
        <div
            role="group"
            aria-label={t('filter_source')}
            className={`flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 ${className}`}
        >
            {tabs.map((tab) => {
                const active = tab.value === current;
                return (
                    <button
                        key={tab.value || 'all'}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                            if (!active) {
                                onChange?.(tab.value);
                            }
                        }}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/30 ${
                            active
                                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                        }`}
                    >
                        {tab.value ? (
                            <span className={`h-1.5 w-1.5 rounded-full ${DOT[tab.value]}`} aria-hidden />
                        ) : null}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
