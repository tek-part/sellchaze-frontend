import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import SearchableSelect from '../components/ui/SearchableSelect';

function unwrapRow(o) {
    return o?.data ?? o;
}

/**
 * @param {Record<string, unknown>} row
 * @param {(k: string, o?: object) => string} t
 */
function deliveryDestinationLabel(row, t) {
    const o = row?.order;
    if (!o) {
        return '—';
    }
    const segment = row.segment === 'to_warehouse' ? 'to_warehouse' : 'to_customer';
    const shippingType = o.shipping_type;
    let addr = o.shipping_address_json;
    if (typeof addr === 'string') {
        try {
            addr = JSON.parse(addr);
        } catch {
            addr = null;
        }
    }
    const whName =
        addr && typeof addr === 'object' && addr.warehouse_name ? String(addr.warehouse_name).trim() : '';
    if (shippingType === 'warehouse') {
        if (segment === 'to_warehouse') {
            return whName ? t('shipping_dest_warehouse_named', { name: whName }) : t('shipping_dest_warehouse');
        }
        return t('shipping_dest_second_leg');
    }
    return t('shipping_dest_direct');
}

const DELIVERY_STATUSES = ['pending', 'in_transit', 'delivered', 'failed'];

export default function DeliveriesPage() {
    const { t } = useTranslation();
    const { isAdmin, permissions } = useOutletContext();
    const can = (p) => isAdmin || permissions.includes(p);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [statusFilter, setStatusFilter] = useState('');
    const [companies, setCompanies] = useState([]);
    const [addOpen, setAddOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [saving, setSaving] = useState(false);

    const [addOrderCode, setAddOrderCode] = useState('');
    const [addCompanyId, setAddCompanyId] = useState('');
    const [addTracking, setAddTracking] = useState('');
    const [addCod, setAddCod] = useState('');
    const [statusPatchingId, setStatusPatchingId] = useState(null);

    const loadParams = useCallback(() => {
        return {
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(statusFilter ? { status: statusFilter } : {}),
        };
    }, [page, perPage, debouncedSearch, statusFilter]);

    useEffect(() => setPage(1), [debouncedSearch, perPage, statusFilter]);

    const refreshDeliveriesList = useCallback(async () => {
        const { data } = await api.get('/deliveries', { params: loadParams() });
        setRows((data.data ?? []).map(unwrapRow));
        setMeta(data.meta ?? null);
    }, [loadParams]);

    const loadCompanies = useCallback(() => {
        api
            .get('/shipping-companies', { params: { active_only: 1, per_page: 100 } })
            .then(({ data }) => {
                const list = (data.data ?? []).map(unwrapRow);
                setCompanies(list);
            })
            .catch(() => setCompanies([]));
    }, []);

    useEffect(() => {
        if (!can('deliveries-list')) {
            return;
        }
        setLoading(true);
        setErr('');
        api.get('/deliveries', { params: loadParams() })
            .then(({ data }) => {
                const list = data.data ?? [];
                setRows(list.map(unwrapRow));
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [loadParams, isAdmin, permissions]);

    if (!can('deliveries-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    const openAdd = () => {
        setAddOrderCode('');
        setAddCompanyId(companies[0]?.id ? String(companies[0].id) : '');
        setAddTracking('');
        setAddCod('');
        setAddOpen(true);
        loadCompanies();
    };

    const submitAdd = async (e) => {
        e.preventDefault();
        if (!can('deliveries-update')) {
            return;
        }
        setSaving(true);
        try {
            await api.post('/deliveries', {
                order_code: addOrderCode.trim(),
                shipping_company_id: Number(addCompanyId),
                tracking_number: addTracking.trim() || null,
                cod_amount: addCod.trim() === '' ? null : Number(addCod),
            });
            toast.success(t('shipping_delivery_created'));
            setAddOpen(false);
            await refreshDeliveriesList();
        } catch (e2) {
            const msg = e2.response?.data?.message || e2.message;
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleInlineStatusChange = async (row, nextStatus) => {
        if (!can('deliveries-update')) {
            return;
        }
        const cur = String(row.status ?? '');
        if (cur === nextStatus) {
            return;
        }
        setStatusPatchingId(Number(row.id));
        try {
            await api.patch(`/deliveries/${row.id}`, { status: nextStatus });
            toast.success(t('shipping_delivery_status_updated'));
            await refreshDeliveriesList();
        } catch (e2) {
            const msg = e2.response?.data?.message || e2.message;
            toast.error(msg);
        } finally {
            setStatusPatchingId(null);
        }
    };

    const submitEdit = async (e) => {
        e.preventDefault();
        if (!editRow || !can('deliveries-update')) {
            return;
        }
        setSaving(true);
        try {
            const patch = {
                status: editRow.status,
                tracking_number: editRow.tracking_number || null,
                cod_amount: editRow.cod_amount === '' || editRow.cod_amount == null ? null : Number(editRow.cod_amount),
                notes: editRow.notes || null,
            };
            if (editRow.shipping_company_id !== '' && editRow.shipping_company_id != null) {
                patch.shipping_company_id = Number(editRow.shipping_company_id);
            }
            await api.patch(`/deliveries/${editRow.id}`, patch);
            toast.success(t('action_edit'));
            setEditRow(null);
            await refreshDeliveriesList();
        } catch (e2) {
            const msg = e2.response?.data?.message || e2.message;
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const statusLabel = (s) => t(`delivery_status_${s}`, { defaultValue: s });
    const orderStatusLabel = (s) => t(`order_status_${String(s || '').toLowerCase()}`, { defaultValue: s || '—' });

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-s-4 border-brand ps-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('shipping_deliveries_title')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('list_subtitle_deliveries')}</p>
                </div>
                {can('deliveries-update') ? (
                    <button
                        type="button"
                        onClick={openAdd}
                        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark"
                    >
                        {t('shipping_add_delivery')}
                    </button>
                ) : null}
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-card">
                <ListToolbar
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    afterSearch={
                        <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                {t('col_status')}
                            </label>
                            <SearchableSelect
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full sm:w-56"
                            >
                                <option value="">{t('filter_all_statuses')}</option>
                                {DELIVERY_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {statusLabel(s)}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </div>
                    }
                    perPage={perPage}
                    onPerPageChange={(n) => {
                        setPerPage(n);
                        setPage(1);
                    }}
                    onExportCurrent={() => {}}
                    onExportAll={() => {}}
                    exportDisabled
                    showExport={false}
                />
                <div className="relative min-h-48 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5">{t('col_order_code')}</th>
                                <th className="px-4 py-3.5">{t('col_customer')}</th>
                                <th className="px-4 py-3.5">{t('col_order_status')}</th>
                                <th className="px-4 py-3.5">{t('col_ship_destination')}</th>
                                <th className="px-4 py-3.5">{t('shipping_carrier')}</th>
                                <th className="px-4 py-3.5">{t('col_tracking')}</th>
                                <th className="px-4 py-3.5">{t('col_status')}</th>
                                <th className="px-4 py-3.5">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-14 text-center text-sm text-slate-500">
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {row.order?.code ? (
                                            <Link className="text-brand hover:underline" to={`/orders/${row.order.code}`}>
                                                {row.order.code}
                                            </Link>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {row.order?.customer_name || row.order?.customer_phone || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {orderStatusLabel(row.order?.status)}
                                    </td>
                                    <td className="max-w-56 px-4 py-3 text-slate-700">
                                        <span className="line-clamp-2 text-sm">{deliveryDestinationLabel(row, t)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {row.shipping_company?.name || row.delivery_company || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {row.tracking_url ? (
                                            <a
                                                href={row.tracking_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-brand hover:underline"
                                            >
                                                {row.tracking_number || t('view')}
                                            </a>
                                        ) : (
                                            row.tracking_number || '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {can('deliveries-update') ? (
                                            <SearchableSelect
                                                value={String(row.status ?? 'pending')}
                                                disabled={statusPatchingId === Number(row.id)}
                                                onChange={(e) => void handleInlineStatusChange(row, e.target.value)}
                                                className="max-w-44"
                                                aria-label={t('col_status')}
                                            >
                                                {DELIVERY_STATUSES.map((s) => (
                                                    <option key={s} value={s}>
                                                        {statusLabel(s)}
                                                    </option>
                                                ))}
                                            </SearchableSelect>
                                        ) : (
                                            statusLabel(row.status)
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {can('deliveries-update') ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    loadCompanies();
                                                    setEditRow({
                                                        ...row,
                                                        shipping_company_id: row.shipping_company_id || '',
                                                        notes: row.notes || '',
                                                    });
                                                }}
                                                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                {t('action_edit')}
                                            </button>
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

            {addOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-900">{t('shipping_add_delivery')}</h2>
                        <form onSubmit={submitAdd} className="mt-4 space-y-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    {t('col_order_code')}
                                </label>
                                <input
                                    required
                                    value={addOrderCode}
                                    onChange={(e) => setAddOrderCode(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    {t('shipping_carrier')}
                                </label>
                                <SearchableSelect
                                    required
                                    value={addCompanyId}
                                    onChange={(e) => setAddCompanyId(e.target.value)}
                                    className="w-full"
                                >
                                    <option value="">{t('shipping_select_carrier')}</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </SearchableSelect>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    {t('col_tracking')}
                                </label>
                                <input
                                    value={addTracking}
                                    onChange={(e) => setAddTracking(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">COD</label>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={addCod}
                                    onChange={(e) => setAddCod(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {t('btn_confirm')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAddOpen(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {editRow ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-900">{t('shipping_edit_delivery')}</h2>
                        <form onSubmit={submitEdit} className="mt-4 space-y-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">{t('col_status')}</label>
                                <SearchableSelect
                                    value={editRow.status}
                                    onChange={(e) => setEditRow({ ...editRow, status: e.target.value })}
                                    className="w-full"
                                >
                                    {DELIVERY_STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {statusLabel(s)}
                                        </option>
                                    ))}
                                </SearchableSelect>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    {t('shipping_carrier')}
                                </label>
                                <SearchableSelect
                                    value={editRow.shipping_company_id || ''}
                                    onChange={(e) =>
                                        setEditRow({ ...editRow, shipping_company_id: e.target.value || null })
                                    }
                                    className="w-full"
                                >
                                    <option value="">{t('shipping_keep_carrier')}</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </SearchableSelect>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    {t('col_tracking')}
                                </label>
                                <input
                                    value={editRow.tracking_number || ''}
                                    onChange={(e) => setEditRow({ ...editRow, tracking_number: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">COD</label>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={editRow.cod_amount ?? ''}
                                    onChange={(e) => setEditRow({ ...editRow, cod_amount: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">{t('col_notes')}</label>
                                <textarea
                                    value={editRow.notes}
                                    onChange={(e) => setEditRow({ ...editRow, notes: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {t('product_form_save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditRow(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
