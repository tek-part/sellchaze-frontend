/**
 * Shared status pill for storefront order / coupon states. Uses the same
 * bordered-pill treatment as the Stores status badge.
 */
const STYLES = {
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    confirmed: 'bg-sky-50 text-sky-700 border-sky-100',
    processing: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    shipped: 'bg-violet-50 text-violet-700 border-violet-100',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cancelled: 'bg-red-50 text-red-700 border-red-100',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function StatusBadge({ status, label = null }) {
    return (
        <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[status] || STYLES.inactive}`}
        >
            {label ?? status}
        </span>
    );
}
