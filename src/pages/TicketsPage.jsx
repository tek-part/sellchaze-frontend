import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import ConfirmDialog from '../components/ConfirmDialog';
import TableIconActions from '../components/table/TableIconActions';
import { exportRowsToExcel } from '../utils/exportExcel';
import { fetchAllPages } from '../utils/fetchAllPages';

export default function TicketsPage() {
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const canBulkDeleteByActivity = permissions.includes('activity-logs-list');
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [status, setStatus] = useState('');
    const [type, setType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selected, setSelected] = useState(() => new Set());
    const [confirmBulk, setConfirmBulk] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [listNonce, setListNonce] = useState(0);

    const loadParams = useCallback(() => {
        return {
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(status ? { status } : {}),
            ...(type ? { type } : {}),
            ...(dateFrom ? { date_from: dateFrom } : {}),
            ...(dateTo ? { date_to: dateTo } : {}),
        };
    }, [page, perPage, debouncedSearch, status, type, dateFrom, dateTo]);

    useEffect(() => setPage(1), [debouncedSearch, status, type, dateFrom, dateTo, perPage]);

    useEffect(() => {
        if (!permissions.includes('tickets-list')) {
            return;
        }
        setLoading(true);
        setErr('');
        api.get('/tickets', { params: loadParams() })
            .then(({ data }) => {
                setRows(data.data ?? []);
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [permissions, loadParams, listNonce]);

    useEffect(() => {
        setSelected(new Set());
    }, [rows]);

    if (!can('tickets-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    const cols = [
        { key: 'id', header: '#' },
        { key: 'order_code', header: t('col_order') },
        { key: 'type', header: t('col_type') },
        { key: 'status', header: t('col_status') },
        { key: 'created_at', header: t('col_created') },
    ];

    const handleExportCurrent = () => {
        exportRowsToExcel(
            cols,
            rows.map((row) => ({
                id: row.id,
                order_code: row.order?.code ?? '',
                type: row.type,
                status: row.status,
                created_at: row.created_at ? new Date(row.created_at).toISOString() : '',
            })),
            `tickets-p${page}`,
            { sheetName: 'Tickets' },
        );
    };

    const handleExportAll = async () => {
        setLoading(true);
        try {
            const { page: _p, per_page: _pp, ...base } = loadParams();
            const all = await fetchAllPages('/tickets', { ...base, per_page: 100 });
            exportRowsToExcel(
                cols,
                all.map((row) => ({
                    id: row.id,
                    order_code: row.order?.code ?? '',
                    type: row.type,
                    status: row.status,
                    created_at: row.created_at ? new Date(row.created_at).toISOString() : '',
                })),
                'tickets-all',
                { sheetName: 'Tickets' },
            );
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    const canBulkDelete = canBulkDeleteByActivity && can('tickets-manage');

    const toggleRow = (id) => {
        const n = Number(id);
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(n)) {
                next.delete(n);
            } else {
                next.add(n);
            }
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === rows.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(rows.map((r) => Number(r.id))));
        }
    };

    const runBulkDelete = async () => {
        const ids = [...selected];
        if (ids.length === 0) {
            return;
        }
        setDeleting(true);
        try {
            const { data } = await api.post('/tickets/bulk-destroy', { ids });
            toast.success(`${t('action_delete')} (${data?.deleted ?? 0})`);
            setConfirmBulk(false);
            setSelected(new Set());
            setListNonce((n) => n + 1);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
        }
    };

    const colCount = canBulkDelete ? 7 : 6;

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('tickets')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('tickets_subtitle')}</p>
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
                    selectedCount={selected.size}
                    onBulkDelete={
                        canBulkDelete
                            ? () => {
                                  if (selected.size > 0) {
                                      setConfirmBulk(true);
                                  }
                              }
                            : undefined
                    }
                    bulkDeleteDisabled={deleting}
                    advanced={
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('filter_status')}
                                </label>
                                <input
                                    type="text"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('filter_type')}
                                </label>
                                <input
                                    type="text"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
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
                                {canBulkDelete ? (
                                    <th className="px-3 py-3.5">
                                        <input
                                            type="checkbox"
                                            checked={rows.length > 0 && selected.size === rows.length}
                                            onChange={toggleAll}
                                            aria-label="select all"
                                        />
                                    </th>
                                ) : null}
                                <th className="px-4 py-3.5">#</th>
                                <th className="px-4 py-3.5">{t('col_order')}</th>
                                <th className="px-4 py-3.5">{t('col_type')}</th>
                                <th className="px-4 py-3.5">{t('col_status')}</th>
                                <th className="px-4 py-3.5">{t('col_created')}</th>
                                <th className="px-4 py-3.5">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={colCount} className="px-4 py-14 text-center text-sm text-slate-500">
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    {canBulkDelete ? (
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(Number(row.id))}
                                                onChange={() => toggleRow(row.id)}
                                                aria-label={`select ${row.id}`}
                                            />
                                        </td>
                                    ) : null}
                                    <td className="px-4 py-3 font-medium text-slate-900">{row.id}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.order?.code ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.type}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.status}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <TableIconActions
                                            viewTo={`/tickets/${row.id}`}
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
            <ConfirmDialog
                open={confirmBulk}
                onClose={() => setConfirmBulk(false)}
                title={t('confirm_bulk_delete_title')}
                body={t('confirm_bulk_delete_body')}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleting}
                onConfirm={runBulkDelete}
            />
        </div>
    );
}
