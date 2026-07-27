import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import SearchableSelect from '../components/ui/SearchableSelect';

function warehouseLabel(w, lang) {
    if (!w) {
        return '';
    }
    if (lang === 'ar' && w.name_ar) {
        return w.name_ar;
    }
    if (lang !== 'ar' && w.name_en) {
        return w.name_en;
    }
    return w.name ?? w.code ?? '';
}

export default function StockTransfersPage() {
    const { t, i18n } = useTranslation();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    const loadParams = useCallback(
        () => ({
            page,
            per_page: perPage,
        }),
        [page, perPage]
    );

    useEffect(() => {
        setPage(1);
    }, [perPage]);

    useEffect(() => {
        if (!can('products-list')) {
            return;
        }
        setLoading(true);
        setErr('');
        api
            .get('/stock-transfers', { params: loadParams() })
            .then(({ data }) => {
                setRows(data.data ?? []);
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [permissions, loadParams]);

    if (!can('products-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="relative space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('inventory_transfers')}</h1>
                    <p className="mt-1 text-sm text-slate-600">{t('inventory_transfer_list_subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        to="/inventory"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50"
                    >
                        {t('inventory_title')}
                    </Link>
                    {can('products-edit') ? (
                        <Link
                            to="/inventory/transfers/new"
                            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                        >
                            {t('inventory_transfer_new')}
                        </Link>
                    ) : null}
                </div>
            </div>

            {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
            ) : null}

            <div className="flex justify-end">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                    {t('table_per_page')}
                    <SearchableSelect
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                        className="w-24"
                    >
                        {[15, 30, 50, 100].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </SearchableSelect>
                </label>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <TableLoadingOverlay show={loading} />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50/90">
                            <tr>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">#</th>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">
                                    {t('inventory_transfer_from')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">
                                    {t('inventory_transfer_to')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">{t('inventory_lines_count')}</th>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">{t('col_created')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50/80">
                                    <td className="px-4 py-3 font-mono text-slate-800">{r.id}</td>
                                    <td className="px-4 py-3 text-slate-800">
                                        {warehouseLabel(r.from_warehouse, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-800">
                                        {warehouseLabel(r.to_warehouse, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-800">{r.lines?.length ?? 0}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                                        {t('inventory_transfers_empty')}
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
                <PaginationBar meta={meta} loading={loading} onPageChange={setPage} />
            </div>
        </div>
    );
}
