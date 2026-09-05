import { useTranslation } from 'react-i18next';

const TONES = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    draft: 'bg-amber-50 text-amber-700 ring-amber-200',
    suspended: 'bg-red-50 text-red-700 ring-red-200',
};

const DOTS = {
    active: 'bg-emerald-500',
    draft: 'bg-amber-400',
    suspended: 'bg-red-500',
};

/** Store publish state as a compact pill: Live / Draft / Suspended. */
export default function StoreStatusPill({ status, size = 'sm', className = '' }) {
    const { t } = useTranslation();
    const key = TONES[status] ? status : 'draft';
    const labels = {
        active: t('store_status_live', 'Live'),
        draft: t('store_status_draft', 'Draft'),
        suspended: t('store_status_suspended', 'Suspended'),
    };
    const sizing = size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ${TONES[key]} ${sizing} ${className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${DOTS[key]}`} aria-hidden />
            {labels[key]}
        </span>
    );
}
