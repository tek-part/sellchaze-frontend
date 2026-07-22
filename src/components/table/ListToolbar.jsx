import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronDown, HiOutlineFunnel } from 'react-icons/hi2';

export default function ListToolbar({
    searchValue,
    onSearchChange,
    onExportCurrent,
    onExportAll,
    exportDisabled,
    perPage,
    onPerPageChange,
    perPageOptions = [10, 15, 25, 50, 100],
    advanced,
    onCreate,
    createLabel,
    selectedCount = 0,
    onBulkDelete,
    bulkDeleteDisabled,
    extra,
    showPerPage = true,
    showExport = true,
}) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-3 rounded-t-2xl border border-b-0 border-slate-200/80 bg-white px-4 py-3 shadow-xs">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {t('table_search')}
                    </label>
                    <input
                        type="search"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t('table_search_placeholder')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-hidden ring-brand/20 transition focus:border-brand focus:ring-2"
                    />
                </div>
                {showPerPage ? (
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {t('table_per_page')}
                        </label>
                        <select
                            value={String(perPage)}
                            onChange={(e) => onPerPageChange(Number(e.target.value))}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20"
                        >
                            {perPageOptions.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                    {onCreate ? (
                        <button
                            type="button"
                            onClick={onCreate}
                            className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark sm:w-auto"
                        >
                            {createLabel || t('table_create')}
                        </button>
                    ) : null}
                    {showExport ? (
                        <>
                            <button
                                type="button"
                                disabled={exportDisabled}
                                onClick={onExportCurrent}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                            >
                                {t('table_export_current')}
                            </button>
                            <button
                                type="button"
                                disabled={exportDisabled}
                                onClick={onExportAll}
                                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                            >
                                {t('table_export_all')}
                            </button>
                        </>
                    ) : null}
                    {selectedCount > 0 && onBulkDelete ? (
                        <button
                            type="button"
                            disabled={bulkDeleteDisabled}
                            onClick={onBulkDelete}
                            className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                        >
                            {t('table_delete_selected', { count: selectedCount })}
                        </button>
                    ) : null}
                </div>
            </div>
            {advanced ? (
                <Disclosure defaultOpen={false}>
                    {({ open }) => (
                        <div>
                            <DisclosureButton
                                type="button"
                                className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-dark"
                            >
                                <HiOutlineFunnel className="h-4 w-4" aria-hidden />
                                {t('table_filters_toggle')}
                                <HiOutlineChevronDown
                                    className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
                                    aria-hidden
                                />
                            </DisclosureButton>
                            <DisclosurePanel className="mt-3 border-t border-slate-100 pt-3">{advanced}</DisclosurePanel>
                        </div>
                    )}
                </Disclosure>
            ) : null}
            {extra ? <div className="text-sm text-slate-600">{extra}</div> : null}
        </div>
    );
}
