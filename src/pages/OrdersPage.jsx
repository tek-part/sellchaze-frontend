import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineUserPlus, HiXMark } from 'react-icons/hi2';
import CreateOrderDialog from '../components/orders/CreateOrderDialog';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import ConfirmDialog from '../components/ConfirmDialog';
import TableIconActions from '../components/table/TableIconActions';
import { exportRowsToExcel } from '../utils/exportExcel';
import { fetchAllPages } from '../utils/fetchAllPages';

function wigpleasureStoreStatusLabel(t, value) {
    if (value == null || value === '') {
        return '—';
    }
    return t(`wigpleasure_store_status_${value}`, { defaultValue: value });
}

function unwrapRow(o) {
    return o?.data ?? o;
}

function sentToLabel(row) {
    const names = (Array.isArray(row?.suppliers) ? row.suppliers : [])
        .map((s) => s?.supplier_name || s?.supplier_user?.name)
        .filter(Boolean);
    return names.length ? [...new Set(names)].join(', ') : '—';
}

function pickLocalizedProductName(product, locale, fallback = '—') {
    const isAr = String(locale || '').startsWith('ar');
    const en = product?.name_en ?? null;
    const ar = product?.name_ar ?? null;
    const base = product?.name ?? null;
    const chosen = isAr ? (ar ?? en ?? base) : (en ?? ar ?? base);
    const text = String(chosen ?? fallback).trim();
    return text === '' ? fallback : text;
}

/** Table list only — full name stays in tooltip (`title`). */
const ORDER_LIST_PRODUCT_NAME_MAX = 30;

function truncateOrderListProductName(label, max = ORDER_LIST_PRODUCT_NAME_MAX) {
    const s = String(label ?? '').trim();
    if (s === '') return '—';
    if (s.length <= max) return s;
    return `${s.slice(0, max)}…`;
}

export default function OrdersPage({ direction }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const outlet = useOutletContext();
    const isAdmin = Boolean(outlet?.isAdmin);
    const isSupplier = Boolean(outlet?.isSupplier);
    /** Suppliers only see their assigned orders; "Sent to" is redundant (always themselves). */
    const showSentToColumn = !(isSupplier && !isAdmin);
    const showWigpleasureStoreColumn = direction === 'in';
    const permissions = Array.isArray(outlet?.permissions) ? outlet.permissions : [];
    const canBulkDelete =
        isAdmin || permissions.includes('orders-out') || permissions.includes('orders-in');
    const canCreateOrder =
        direction === 'in' && !(isSupplier && !isAdmin) && (isAdmin || permissions.includes('orders-create'));
    const [createOpen, setCreateOpen] = useState(false);
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
    const [selected, setSelected] = useState(() => new Set());
    const [confirmBulk, setConfirmBulk] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [listNonce, setListNonce] = useState(0);
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [assigningCode, setAssigningCode] = useState('');
    const [selectedSupplierByCode, setSelectedSupplierByCode] = useState({});
    const [supplierSearchByCode, setSupplierSearchByCode] = useState({});
    const [assignPopupCode, setAssignPopupCode] = useState('');

    const title =
        direction === 'in'
            ? t('orders_in')
            : isSupplier && !isAdmin
              ? t('orders_out_supplier')
              : t('orders_out');

    useEffect(() => {
        if (isSupplier && !isAdmin && direction === 'in') {
            navigate('/orders/out', { replace: true });
        }
    }, [isSupplier, isAdmin, direction, navigate]);

    const loadParams = useCallback(() => {
        const params = {
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(status ? { status } : {}),
            ...(dateFrom ? { date_from: dateFrom } : {}),
            ...(dateTo ? { date_to: dateTo } : {}),
        };
        if (direction) {
            params.direction = direction;
        }
        return params;
    }, [page, perPage, debouncedSearch, status, dateFrom, dateTo, direction]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, dateFrom, dateTo, perPage, direction]);

    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === 'visible' && direction === 'in') {
                setListNonce((n) => n + 1);
            }
        };
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, [direction]);

    useEffect(() => {
        if (direction !== 'in') {
            return undefined;
        }
        const id = setInterval(() => setListNonce((n) => n + 1), 45000);
        return () => clearInterval(id);
    }, [direction]);

    useEffect(() => {
        setLoading(true);
        setErr('');
        api
            .get('/orders', { params: loadParams() })
            .then(({ data }) => {
                const list = data.data ?? [];
                setRows(list.map(unwrapRow));
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [loadParams, listNonce]);

    useEffect(() => {
        setSelected(new Set());
    }, [rows]);

    const canAssignSupplier =
        !isSupplier &&
        ((direction === 'in' && (isAdmin || permissions.includes('orders-in'))) ||
            (direction === 'out' && (isAdmin || permissions.includes('orders-out'))));

    const assignPopupOpen = Boolean(assignPopupCode);

    useEffect(() => {
        if (!canAssignSupplier) {
            return;
        }
        const init = {};
        for (const row of rows) {
            const ids = (Array.isArray(row?.suppliers) ? row.suppliers : [])
                .map((s) => Number(s?.supplier ?? s?.supplier_id))
                .filter((v) => Number.isFinite(v) && v > 0);
            init[row.code] = [...new Set(ids)];
        }
        setSelectedSupplierByCode(init);
    }, [rows, canAssignSupplier]);

    useEffect(() => {
        if (!canAssignSupplier) {
            return;
        }
        api.get('/suppliers', { params: { per_page: 200 } })
            .then(({ data }) => setSupplierOptions(Array.isArray(data?.data) ? data.data : []))
            .catch(() => setSupplierOptions([]));
    }, [canAssignSupplier]);

    const exportColumns = [
        { key: 'code', header: t('col_code') },
        { key: 'status', header: t('col_status') },
        { key: 'product_name', header: t('col_product') },
        { key: 'created_at', header: t('col_created') },
    ];

    const toExportRow = (r) => ({
        code: r.code,
        status: r.status,
        product_name: pickLocalizedProductName(r.product, i18n.language, ''),
        created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
    });

    const handleExportCurrent = () => {
        exportRowsToExcel(
            exportColumns,
            rows.map(toExportRow),
            `orders-${direction}-p${page}`,
            { sheetName: 'Orders' },
        );
    };

    const handleExportAll = async () => {
        setLoading(true);
        try {
            const base = loadParams();
            delete base.page;
            delete base.per_page;
            const all = await fetchAllPages('/orders', { ...base, per_page: 100 }, { unwrap: unwrapRow });
            exportRowsToExcel(exportColumns, all.map(toExportRow), `orders-${direction}-all`, {
                sheetName: 'Orders',
            });
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (code) => {
        const c = String(code);
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(c)) {
                next.delete(c);
            } else {
                next.add(c);
            }
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === rows.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(rows.map((r) => String(r.code))));
        }
    };

    const runBulkDelete = async () => {
        const codes = [...selected];
        if (codes.length === 0) {
            return;
        }
        setDeleting(true);
        try {
            const { data } = await api.post('/orders/bulk-destroy', { codes });
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

    const colCount =
        (canBulkDelete ? 1 : 0) +
        5 +
        (showWigpleasureStoreColumn ? 1 : 0) +
        (showSentToColumn ? 1 : 0) +
        (canAssignSupplier ? 1 : 0);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('list_subtitle_orders')}</p>
                </div>
                {canCreateOrder ? (
                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark"
                    >
                        <HiOutlinePlus className="h-4 w-4" aria-hidden />
                        {t('create_order_title')}
                    </button>
                ) : null}
            </div>
            <CreateOrderDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => setListNonce((n) => n + 1)}
            />
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
                                    placeholder={t('filter_all')}
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
                                <th className="px-4 py-3.5">{t('col_code')}</th>
                                {showWigpleasureStoreColumn ? (
                                    <th className="px-4 py-3.5">{t('col_wigpleasure_store_status')}</th>
                                ) : null}
                                <th className="px-4 py-3.5">{t('col_status')}</th>
                                <th className="px-4 py-3.5">{t('col_product')}</th>
                                {showSentToColumn ? (
                                    <th className="px-4 py-3.5">{t('col_sent_to')}</th>
                                ) : null}
                                {canAssignSupplier ? <th className="px-4 py-3.5">{t('col_assign_supplier')}</th> : null}
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
                            {rows.map((row) => {
                                const productFull = pickLocalizedProductName(row.product, i18n.language);
                                return (
                                <tr
                                    key={row.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    {canBulkDelete ? (
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(String(row.code))}
                                                onChange={() => toggleRow(row.code)}
                                                aria-label={`select ${row.code}`}
                                            />
                                        </td>
                                    ) : null}
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {row.code}
                                        {row.is_late ? (
                                            <span
                                                className="ms-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                                                title={t('order_is_late')}
                                            >
                                                {t('badge_late')}
                                            </span>
                                        ) : null}
                                    </td>
                                    {showWigpleasureStoreColumn ? (
                                        <td className="px-4 py-3 text-slate-700">
                                            {row.wigpleasure_order_id ? (
                                                <span className="inline-flex max-w-44 items-center rounded-lg bg-violet-50 px-2 py-1 text-xs font-medium text-violet-900 ring-1 ring-violet-100">
                                                    {wigpleasureStoreStatusLabel(t, row.wigpleasure_store_status)}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                    ) : null}
                                    <td className="px-4 py-3 text-slate-700">{row.status}</td>
                                    <td className="px-4 py-3 text-slate-700 max-w-56">
                                        <p className="truncate text-slate-700" title={productFull}>
                                            {truncateOrderListProductName(productFull)}
                                        </p>
                                    </td>
                                    {showSentToColumn ? (
                                        <td className="px-4 py-3 text-slate-700 max-w-[16rem]">
                                            <p className="truncate" title={sentToLabel(row)}>
                                                {sentToLabel(row)}
                                            </p>
                                        </td>
                                    ) : null}
                                    {canAssignSupplier ? (
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50"
                                                title={t('col_assign_supplier')}
                                                onClick={() => setAssignPopupCode(row.code)}
                                            >
                                                <HiOutlineUserPlus className="h-4 w-4" />
                                            </button>
                                        </td>
                                    ) : null}
                                    <td className="px-4 py-3 text-slate-600">
                                        {row.created_at
                                            ? new Date(row.created_at).toLocaleString()
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <TableIconActions
                                            viewTo={`/orders/${encodeURIComponent(row.code)}`}
                                            viewLinkState={{ ordersDir: direction }}
                                            showEdit={false}
                                            showDelete={false}
                                        />
                                    </td>
                                </tr>
                                );
                            })}
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
            {assignPopupOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h3 className="text-base font-semibold text-slate-900">{t('col_assign_supplier')}</h3>
                            <button
                                type="button"
                                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                                onClick={() => setAssignPopupCode('')}
                            >
                                <HiXMark className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-3 p-4">
                            <input
                                type="text"
                                value={supplierSearchByCode[assignPopupCode] ?? ''}
                                onChange={(e) =>
                                    setSupplierSearchByCode((prev) => ({
                                        ...prev,
                                        [assignPopupCode]: e.target.value,
                                    }))
                                }
                                placeholder={t('table_search_placeholder')}
                                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                            />
                            <div className="max-h-64 space-y-1 overflow-auto rounded-lg border border-slate-200 p-2">
                                {supplierOptions
                                    .filter((s) => {
                                        const q = (supplierSearchByCode[assignPopupCode] ?? '').trim().toLowerCase();
                                        if (!q) return true;
                                        return String(s.name ?? '').toLowerCase().includes(q);
                                    })
                                    .map((s) => {
                                        const checked = (selectedSupplierByCode[assignPopupCode] ?? []).includes(Number(s.id));
                                        return (
                                            <label key={s.id} className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-slate-50">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() =>
                                                        setSelectedSupplierByCode((prev) => {
                                                            const current = Array.isArray(prev[assignPopupCode]) ? prev[assignPopupCode] : [];
                                                            const next = checked
                                                                ? current.filter((v) => v !== Number(s.id))
                                                                : [...current, Number(s.id)];
                                                            return { ...prev, [assignPopupCode]: next };
                                                        })
                                                    }
                                                />
                                                <span>{s.name}</span>
                                            </label>
                                        );
                                    })}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                                    onClick={() => setAssignPopupCode('')}
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                                    disabled={!selectedSupplierByCode[assignPopupCode]?.length || assigningCode === assignPopupCode}
                                    onClick={async () => {
                                        try {
                                            setAssigningCode(assignPopupCode);
                                            setErr('');
                                            await api.post(`/orders/${encodeURIComponent(assignPopupCode)}/assign-supplier`, {
                                                supplier_ids: selectedSupplierByCode[assignPopupCode],
                                            });
                                            toast.success(t('order_assign_suppliers_saved'));
                                            setListNonce((n) => n + 1);
                                            setAssignPopupCode('');
                                        } catch (e) {
                                            const msg = e.response?.data?.message || e.message;
                                            setErr(msg);
                                            toast.error(msg);
                                        } finally {
                                            setAssigningCode('');
                                        }
                                    }}
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
