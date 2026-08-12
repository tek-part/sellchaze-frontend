import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronDown, HiOutlineFunnel } from 'react-icons/hi2';
import SearchableSelect from '../ui/SearchableSelect';

export default function ListToolbar({
    searchValue,
    onSearchChange,
    onExportAll,
    exportDisabled,
    perPage,
    onPerPageChange,
    perPageOptions = [10, 15, 25, 50, 100],
    advanced,
    afterSearch,
    selectedCount = 0,
    onBulkDelete,
    bulkDeleteDisabled,
    extra,
    showPerPage = true,
    showExport = true,
}) {
    const { t } = useTranslation();

    // The action buttons cluster (right side): filters toggle FIRST, then Excel, then bulk delete.
    const actions = (filterToggle) => (
        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap lg:ms-auto">
            {filterToggle}
            {showExport ? (
                <button
                    type="button"
                    disabled={exportDisabled}
                    onClick={onExportAll}
                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                    {t('table_export_excel', 'Excel')}
                </button>
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
    );

    const row = (filterToggle) => (
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="w-full sm:w-72">
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
            {afterSearch || null}
            {showPerPage ? (
                <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {t('table_per_page')}
                    </label>
                    <SearchableSelect
                        value={String(perPage)}
                        onChange={(e) => onPerPageChange(Number(e.target.value))}
                        className="w-24"
                    >
                        {perPageOptions.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </SearchableSelect>
                </div>
            ) : null}
            {actions(filterToggle)}
        </div>
    );

    return (
        <div className="flex flex-col gap-3 rounded-t-2xl border border-b-0 border-slate-200/80 bg-white px-4 py-3 shadow-xs">
            {advanced ? (
                <Disclosure defaultOpen={false}>
                    {({ open }) => (
                        <>
                            {row(
                                <DisclosureButton
                                    type="button"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand transition hover:bg-slate-50 sm:w-auto"
                                >
                                    <HiOutlineFunnel className="h-4 w-4" aria-hidden />
                                    {t('table_filters_toggle')}
                                    <HiOutlineChevronDown
                                        className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
                                        aria-hidden
                                    />
                                </DisclosureButton>,
                            )}
                            <DisclosurePanel className="border-t border-slate-100 pt-3">{advanced}</DisclosurePanel>
                        </>
                    )}
                </Disclosure>
            ) : (
                row(null)
            )}
            {extra ? <div className="text-sm text-slate-600">{extra}</div> : null}
        </div>
    );
}
