import { useTranslation } from 'react-i18next';

export default function PaginationBar({ meta, onPageChange, loading = false, className = '' }) {
    const { t } = useTranslation();
    if (!meta || meta.total === 0) {
        return null;
    }
    const { current_page: cur, last_page: last, total, per_page: per } = meta;
    const from = total === 0 ? 0 : (cur - 1) * per + 1;
    const to = Math.min(cur * per, total);

    return (
        <div
            className={`flex flex-col gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
        >
            <p className="text-xs text-slate-600">
                {t('table_paging_info', { from, to, total })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    disabled={loading || cur <= 1}
                    onClick={() => onPageChange(cur - 1)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {t('table_prev')}
                </button>
                <span className="text-xs font-medium text-slate-600">
                    {t('table_page_of', { current: cur, last })}
                </span>
                <button
                    type="button"
                    disabled={loading || cur >= last}
                    onClick={() => onPageChange(cur + 1)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {t('table_next')}
                </button>
            </div>
        </div>
    );
}
