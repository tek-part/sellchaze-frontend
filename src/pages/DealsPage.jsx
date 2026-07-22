import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import TableIconActions from '../components/table/TableIconActions';
import { exportRowsToExcel } from '../utils/exportExcel';
import { fetchAllPages } from '../utils/fetchAllPages';

function unwrapRow(o) {
    return o?.data ?? o;
}

export default function DealsPage({ direction }) {
    const { t } = useTranslation();
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const title = direction === 'out' ? t('deals_out') : t('deals_in');

    const loadParams = useCallback(() => {
        return {
            direction,
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(dateFrom ? { date_from: dateFrom } : {}),
            ...(dateTo ? { date_to: dateTo } : {}),
        };
    }, [direction, page, perPage, debouncedSearch, dateFrom, dateTo]);

    useEffect(() => setPage(1), [debouncedSearch, dateFrom, dateTo, perPage, direction]);

    useEffect(() => {
        setLoading(true);
        setErr('');
        api.get('/deals', { params: loadParams() })
            .then(({ data }) => {
                const list = data.data ?? [];
                setRows(list.map(unwrapRow));
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [loadParams]);

    const exportCols = [
        { key: 'order', header: t('col_order') },
        { key: 'price', header: t('col_price') },
        { key: 'status', header: t('col_status') },
        { key: 'party', header: t('col_party') },
    ];

    const toRow = (q) => ({
        order: q.order?.code ?? '',
        price: `${q.price ?? ''} USD`.trim(),
        status: q.status,
        party:
            direction === 'out'
                ? q.supplier_user?.name ?? ''
                : q.customer?.name ?? '',
    });

    const handleExportCurrent = () => {
        exportRowsToExcel(exportCols, rows.map(toRow), `deals-${direction}-p${page}`, { sheetName: 'Deals' });
    };

    const handleExportAll = async () => {
        setLoading(true);
        try {
            const { page: _p, per_page: _pp, ...base } = loadParams();
            const all = await fetchAllPages('/deals', { ...base, per_page: 100 }, { unwrap: unwrapRow });
            exportRowsToExcel(exportCols, all.map(toRow), `deals-${direction}-all`, { sheetName: 'Deals' });
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('list_subtitle_deals')}</p>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-card">
                <ListToolbar
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    perPage={perPage}
                    onPerPageChange={(n) => {
                        setPerPage(n);
                        setPage(1);
                    }}
                    onExportCurrent={handleExportCurrent}
                    onExportAll={handleExportAll}
                    exportDisabled={loading}
                    advanced={
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('filter_date_from')}
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('filter_date_to')}
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
                        </div>
                    }
                />
                <div className="relative min-h-48 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5">{t('col_order')}</th>
                                <th className="px-4 py-3.5">{t('col_price')}</th>
                                <th className="px-4 py-3.5">{t('col_status')}</th>
                                <th className="px-4 py-3.5">{t('col_party')}</th>
                                <th className="px-4 py-3.5">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-14 text-center text-sm text-slate-500">
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((q) => (
                                <tr
                                    key={q.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900">{q.order?.code ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {q.price ?? '—'} USD
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{q.status}</td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {direction === 'out'
                                            ? q.supplier_user?.name ?? '—'
                                            : q.customer?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {q.order?.code ? (
                                            <TableIconActions
                                                viewTo={`/orders/${encodeURIComponent(q.order.code)}`}
                                                showEdit={false}
                                                showDelete={false}
                                            />
                                        ) : (
                                            '—'
                                        )}
                                    </td>
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
