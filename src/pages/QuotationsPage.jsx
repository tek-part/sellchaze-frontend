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

export default function QuotationsPage() {
    const { t } = useTranslation();
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [status, setStatus] = useState('');

    const title = t('nav_group_quotations');

    const loadParams = useCallback(() => {
        return {
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(status ? { status } : {}),
        };
    }, [page, perPage, debouncedSearch, status]);

    useEffect(() => setPage(1), [debouncedSearch, status, perPage]);

    useEffect(() => {
        setLoading(true);
        setErr('');
        api.get('/quotations', { params: loadParams() })
            .then(({ data }) => {
                const list = data.data ?? [];
                setRows(list.map(unwrapRow));
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [loadParams]);

    const columns = [
        { key: 'code', header: t('col_code') },
        { key: 'status', header: t('col_status') },
        { key: 'product', header: t('col_product') },
        { key: 'qcount', header: t('col_quotations_count') },
    ];

    const rowToExport = (order) => ({
        code: order.code,
        status: order.status,
        product: order.product?.name ?? '',
        qcount: Array.isArray(order.quotations) ? order.quotations.length : '',
    });

    const handleExportCurrent = () => {
        exportRowsToExcel(columns, rows.map(rowToExport), `quotations-p${page}`, { sheetName: 'Quotations' });
    };

    const handleExportAll = async () => {
        setLoading(true);
        try {
            const { page: _p, per_page: _pp, ...base } = loadParams();
            const all = await fetchAllPages('/quotations', { ...base, per_page: 100 }, { unwrap: unwrapRow });
            exportRowsToExcel(columns, all.map(rowToExport), 'quotations-all', { sheetName: 'Quotations' });
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
                <p className="mt-1 text-sm text-slate-500">{t('list_subtitle_quotations')}</p>
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
                        <div className="max-w-xs">
                            <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                {t('filter_status')}
                            </label>
                            <input
                                type="text"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                placeholder={t('filter_all')}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            />
                        </div>
                    }
                />
                <div className="relative min-h-48 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5">{t('col_code')}</th>
                                <th className="px-4 py-3.5">{t('col_status')}</th>
                                <th className="px-4 py-3.5">{t('col_product')}</th>
                                <th className="px-4 py-3.5">{t('col_quotations_count')}</th>
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
                            {rows.map((order) => (
                                <tr
                                    key={order.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {order.code}
                                        {order.is_late ? (
                                            <span className="ms-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                                {t('badge_late')}
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{order.status}</td>
                                    <td className="px-4 py-3 text-slate-700">{order.product?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {Array.isArray(order.quotations) ? order.quotations.length : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <TableIconActions
                                            viewTo={`/orders/${encodeURIComponent(order.code)}`}
                                            showEdit={false}
                                            showDelete={false}
                                        />
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
