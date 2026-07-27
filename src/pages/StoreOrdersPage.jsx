import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import StatusBadge from '../components/StatusBadge';
import SearchableSelect from '../components/ui/SearchableSelect';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function StoreOrdersPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [status, setStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const loadParams = useCallback(() => ({
        page,
        per_page: perPage,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(status ? { status } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
    }), [page, perPage, debouncedSearch, status, dateFrom, dateTo]);

    useEffect(() => setPage(1), [debouncedSearch, status, dateFrom, dateTo, perPage]);

    useEffect(() => {
        setLoading(true);
        setErr('');
        api.get(`${apiBase}/orders`, { params: loadParams() })
            .then(({ data }) => { setRows(data.data ?? []); setMeta(data.meta ?? null); })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [id, loadParams]);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('orders_title', 'Orders')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('store_orders_subtitle', 'Manage storefront orders for this store.')}</p>
                </div>
                {id ? <Link to="/stores" className="text-sm text-brand hover:underline">← {t('stores_title', 'Stores')}</Link> : null}
            </div>
            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-card">
                <ListToolbar
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    perPage={perPage}
                    onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
                    advanced={
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('col_status', 'Status')}</label>
                                <SearchableSelect value={status} onChange={(e) => setStatus(e.target.value)} className="w-full">
                                    <option value="">—</option>
                                    {STATUSES.map((s) => <option key={s} value={s}>{t(`order_status_${s}`, s)}</option>)}
                                </SearchableSelect>
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('filter_date_from', 'From')}</label>
                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('filter_date_to', 'To')}</label>
                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
                            </div>
                        </div>
                    }
                />
                <div className="relative min-h-48 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5">{t('order_number', 'Order #')}</th>
                                <th className="px-4 py-3.5">{t('order_customer', 'Customer')}</th>
                                <th className="px-4 py-3.5">{t('col_status', 'Status')}</th>
                                <th className="px-4 py-3.5">{t('order_items', 'Items')}</th>
                                <th className="px-4 py-3.5">{t('order_total', 'Total')}</th>
                                <th className="px-4 py-3.5">{t('order_placed', 'Placed')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr><td colSpan={6} className="px-4 py-14 text-center text-sm text-slate-500">{t('empty', 'Nothing here yet.')}</td></tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr key={row.id} onClick={() => navigate(`${uiBase}/orders/${row.id}`)} className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                                    <td className="px-4 py-3 font-mono font-medium text-brand">{row.order_number}</td>
                                    <td className="px-4 py-3 text-slate-700">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-slate-900">{row.customer?.name || '—'}</p>
                                            <p className="truncate text-xs text-slate-400">{row.customer?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={row.status} label={t(`order_status_${row.status}`, row.status)} /></td>
                                    <td className="px-4 py-3 text-slate-600">{row.items_count ?? '—'}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{row.currency} {row.grand_total}</td>
                                    <td className="px-4 py-3 text-slate-600">{row.placed_at ? new Date(row.placed_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationBar meta={meta} loading={loading} onPageChange={setPage} />
            </div>
        </div>
    );
}
