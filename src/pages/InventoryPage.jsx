import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDebounced } from '../hooks/useDebounced';

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

export default function InventoryPage() {
    const { t, i18n } = useTranslation();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

    const [warehouses, setWarehouses] = useState([]);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [threshold, setThreshold] = useState(5);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [warehouseId, setWarehouseId] = useState('');
    const [productId, setProductId] = useState('');
    const [lowStock, setLowStock] = useState(false);
    const [drafts, setDrafts] = useState({});
    const [savingId, setSavingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [addWarehouseId, setAddWarehouseId] = useState('');
    const [addProductId, setAddProductId] = useState('');
    const [addProductSnapshot, setAddProductSnapshot] = useState(null);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [productOptionsLoading, setProductOptionsLoading] = useState(false);
    const debouncedProductSearch = useDebounced(productSearch, 300);

    const loadParams = useCallback(() => {
        const params = {
            page,
            per_page: perPage,
            ...(warehouseId ? { warehouse_id: warehouseId } : {}),
            ...(productId.trim() ? { product_id: productId.trim() } : {}),
            ...(lowStock ? { low_stock: 1 } : {}),
        };
        return params;
    }, [page, perPage, warehouseId, productId, lowStock]);

    useEffect(() => {
        if (!can('products-list')) {
            return;
        }
        api
            .get('/warehouses')
            .then(({ data }) => setWarehouses(data.data ?? []))
            .catch(() => setWarehouses([]));
    }, [permissions]);

    useEffect(() => {
        setPage(1);
    }, [warehouseId, productId, lowStock, perPage]);

    useEffect(() => {
        if (!can('products-list')) {
            return;
        }
        setLoading(true);
        setErr('');
        api
            .get('/inventory', { params: loadParams() })
            .then(({ data }) => {
                setRows(data.data ?? []);
                setMeta(data.meta ?? null);
                if (data.meta?.low_stock_threshold != null) {
                    setThreshold(Number(data.meta.low_stock_threshold));
                }
                const next = {};
                (data.data ?? []).forEach((r) => {
                    next[r.id] = { qty: r.qty, reserved_qty: r.reserved_qty };
                });
                setDrafts(next);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [permissions, loadParams]);

    useEffect(() => {
        if (!showAdd || !can('products-edit')) {
            return;
        }
        if (!can('products-list')) {
            return;
        }
        let cancelled = false;
        setProductOptionsLoading(true);
        api
            .get('/products', {
                params: {
                    per_page: 100,
                    search: debouncedProductSearch.trim() || undefined,
                },
            })
            .then(({ data }) => {
                if (!cancelled) {
                    setProductOptions(data.data ?? []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setProductOptions([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setProductOptionsLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [showAdd, debouncedProductSearch, permissions]);

    useEffect(() => {
        if (showAdd && warehouses.length && !addWarehouseId) {
            const def = warehouses.find((w) => w.is_default) ?? warehouses[0];
            setAddWarehouseId(String(def.id));
        }
    }, [showAdd, warehouses, addWarehouseId]);

    if (!can('products-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    const stockStatus = (available) => {
        if (available <= 0) {
            return { key: 'out', label: t('inventory_stock_out') };
        }
        if (available <= threshold) {
            return { key: 'low', label: t('inventory_stock_low') };
        }
        return { key: 'ok', label: t('inventory_stock_normal') };
    };

    const setDraft = (id, field, value) => {
        setDrafts((prev) => ({
            ...prev,
            [id]: { ...prev[id], [field]: value === '' ? '' : Number(value) },
        }));
    };

    const saveRow = async (id) => {
        const d = drafts[id];
        if (!d || !can('products-edit')) {
            return;
        }
        setSavingId(id);
        try {
            await api.patch(`/inventory/${id}`, {
                qty: Number(d.qty),
                reserved_qty: Number(d.reserved_qty),
            });
            toast.success(t('inventory_row_saved'));
            const { data } = await api.get('/inventory', { params: loadParams() });
            setRows(data.data ?? []);
            setMeta(data.meta ?? null);
            const next = {};
            (data.data ?? []).forEach((r) => {
                next[r.id] = { qty: r.qty, reserved_qty: r.reserved_qty };
            });
            setDrafts(next);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSavingId(null);
        }
    };

    const runDelete = async () => {
        if (!confirmDelete || !can('products-edit')) {
            return;
        }
        setDeleting(true);
        try {
            await api.delete(`/inventory/${confirmDelete}`);
            toast.success(t('action_delete'));
            setConfirmDelete(null);
            setRows((r) => r.filter((x) => x.id !== confirmDelete));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
        }
    };

    const submitAdd = async () => {
        if (!addWarehouseId || !addProductId) {
            toast.error(t('inventory_add_validation'));
            return;
        }
        setAddSubmitting(true);
        try {
            await api.post('/inventory', {
                warehouse_id: Number(addWarehouseId),
                product_id: Number(addProductId),
                qty: 0,
                reserved_qty: 0,
            });
            toast.success(t('inventory_row_saved'));
            setShowAdd(false);
            setAddProductId('');
            setAddProductSnapshot(null);
            setProductSearch('');
            setProductOptions([]);
            const { data } = await api.get('/inventory', { params: loadParams() });
            setRows(data.data ?? []);
            setMeta(data.meta ?? null);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setAddSubmitting(false);
        }
    };

    const closeAddModal = () => {
        setShowAdd(false);
        setAddProductId('');
        setAddProductSnapshot(null);
        setProductSearch('');
        setProductOptions([]);
    };

    const selectedProduct =
        addProductId &&
        (productOptions.find((p) => String(p.id) === String(addProductId)) ?? addProductSnapshot);

    const filtersOpen = Boolean(warehouseId || productId.trim() || lowStock);

    return (
        <div className="relative space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('inventory_title')}</h1>
                    <p className="mt-1 text-sm text-slate-600">{t('inventory_subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {can('products-edit') ? (
                        <Link
                            to="/inventory/transfers/new"
                            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                        >
                            {t('inventory_transfer_new')}
                        </Link>
                    ) : null}
                    <Link
                        to="/inventory/transfers"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50"
                    >
                        {t('inventory_transfers')}
                    </Link>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs shadow-slate-200/40">
                <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                    <label className="flex min-w-[160px] flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">{t('inventory_filter_warehouse')}</span>
                        <select
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                        >
                            <option value="">{t('inventory_filter_all_warehouses')}</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {warehouseLabel(w, lang)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex min-w-[140px] flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">{t('inventory_filter_product_id')}</span>
                        <input
                            type="number"
                            min={1}
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            placeholder="ID"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                        />
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                            type="checkbox"
                            checked={lowStock}
                            onChange={(e) => setLowStock(e.target.checked)}
                            className="h-4 w-4 rounded-sm border-slate-300 text-brand"
                        />
                        {t('inventory_filter_low_stock')}
                    </label>
                    {filtersOpen ? (
                        <button
                            type="button"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                                setWarehouseId('');
                                setProductId('');
                                setLowStock(false);
                            }}
                        >
                            {t('inventory_clear_filters')}
                        </button>
                    ) : null}
                    {can('products-edit') ? (
                        <button
                            type="button"
                            className="ms-auto rounded-xl border border-brand/30 bg-brand-light/40 px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-light/60"
                            onClick={() => setShowAdd(true)}
                        >
                            {t('inventory_add_line')}
                        </button>
                    ) : null}
                </div>
            </div>

            {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
            ) : null}

            <div className="flex justify-end">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                    {t('table_per_page')}
                    <select
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                        className="rounded-lg border border-slate-200 px-2 py-1"
                    >
                        {[15, 30, 50, 100].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <TableLoadingOverlay show={loading} />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50/90">
                            <tr>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">{t('col_product')}</th>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">{t('inventory_col_warehouse')}</th>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">{t('col_qty')}</th>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">{t('inventory_col_reserved')}</th>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">{t('inventory_col_available')}</th>
                                <th className="px-4 py-3 text-start font-semibold text-slate-700">{t('inventory_col_status')}</th>
                                <th className="px-4 py-3 text-end font-semibold text-slate-700">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((r) => {
                                const d = drafts[r.id] ?? { qty: r.qty, reserved_qty: r.reserved_qty };
                                const avail =
                                    Number(d.qty) -
                                    Number(d.reserved_qty === '' || d.reserved_qty === undefined ? r.reserved_qty : d.reserved_qty);
                                const st = stockStatus(Number.isFinite(avail) ? avail : r.available_qty);
                                return (
                                    <tr key={r.id} className="hover:bg-slate-50/80">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{r.product?.name ?? '—'}</div>
                                            <div className="text-xs text-slate-500">#{r.product_id}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-800">
                                            {warehouseLabel(r.warehouse, lang) || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min={0}
                                                disabled={!can('products-edit')}
                                                value={d.qty}
                                                onChange={(e) => setDraft(r.id, 'qty', e.target.value)}
                                                className="w-24 rounded-lg border border-slate-200 px-2 py-1 disabled:bg-slate-100"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min={0}
                                                disabled={!can('products-edit')}
                                                value={d.reserved_qty}
                                                onChange={(e) => setDraft(r.id, 'reserved_qty', e.target.value)}
                                                className="w-24 rounded-lg border border-slate-200 px-2 py-1 disabled:bg-slate-100"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-slate-800">{Number.isFinite(avail) ? avail : r.available_qty}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={[
                                                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                    st.key === 'out'
                                                        ? 'bg-red-100 text-red-800'
                                                        : st.key === 'low'
                                                          ? 'bg-amber-100 text-amber-900'
                                                          : 'bg-emerald-100 text-emerald-900',
                                                ].join(' ')}
                                            >
                                                {st.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            {can('products-edit') ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={savingId === r.id}
                                                        onClick={() => saveRow(r.id)}
                                                        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                                    >
                                                        {t('inventory_save_row')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmDelete(r.id)}
                                                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                    >
                                                        {t('action_delete')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">{t('inventory_read_only')}</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                        {t('inventory_empty')}
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
                <PaginationBar meta={meta} loading={loading} onPageChange={setPage} />
            </div>

            <ConfirmDialog
                open={Boolean(confirmDelete)}
                onClose={() => setConfirmDelete(null)}
                title={t('inventory_delete_title')}
                body={t('inventory_delete_body')}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleting}
                onConfirm={runDelete}
            />

            {showAdd ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900">{t('inventory_add_line')}</h2>
                        <p className="mt-1 text-sm text-slate-600">{t('inventory_add_line_hint')}</p>
                        <label className="mt-4 flex flex-col gap-1 text-sm">
                            <span className="font-medium">{t('inventory_filter_warehouse')}</span>
                            <select
                                value={addWarehouseId}
                                onChange={(e) => setAddWarehouseId(e.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2"
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {warehouseLabel(w, lang)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="font-medium text-slate-800">{t('inventory_select_product')}</span>
                                <span className="text-slate-500">
                                    {productOptionsLoading
                                        ? t('inventory_products_loading')
                                        : t('inventory_products_count', { count: productOptions.length })}
                                </span>
                            </div>
                            {selectedProduct ? (
                                <div className="flex items-start justify-between gap-3 rounded-xl border border-brand/25 bg-brand-light/30 px-3 py-2.5">
                                    <div className="min-w-0">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
                                            {t('inventory_selected_product')}
                                        </div>
                                        <div className="truncate font-medium text-slate-900">{selectedProduct.name}</div>
                                        <div className="text-xs text-slate-600">#{selectedProduct.id}</div>
                                    </div>
                                    <button
                                        type="button"
                                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        onClick={() => {
                                            setAddProductId('');
                                            setAddProductSnapshot(null);
                                        }}
                                    >
                                        {t('inventory_change_product')}
                                    </button>
                                </div>
                            ) : null}
                            {!selectedProduct ? (
                                <>
                                    <label className="flex flex-col gap-1 text-sm">
                                        <span className="font-medium text-slate-700">{t('inventory_search_products_label')}</span>
                                        <input
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            placeholder={t('inventory_search_products_placeholder')}
                                            autoComplete="off"
                                            className="rounded-xl border border-slate-200 px-3 py-2"
                                        />
                                    </label>
                                    <div
                                        className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80"
                                        role="listbox"
                                        aria-label={t('inventory_search_products_label')}
                                    >
                                        {productOptionsLoading ? (
                                            <div className="px-3 py-8 text-center text-sm text-slate-500">
                                                {t('inventory_products_loading')}
                                            </div>
                                        ) : productOptions.length === 0 ? (
                                            <div className="px-3 py-8 text-center text-sm text-slate-500">
                                                {t('inventory_products_none')}
                                            </div>
                                        ) : (
                                            <ul className="divide-y divide-slate-100">
                                                {productOptions.map((p) => {
                                                    const isSel = String(addProductId) === String(p.id);
                                                    return (
                                                        <li key={p.id}>
                                                            <button
                                                                type="button"
                                                                role="option"
                                                                aria-selected={isSel}
                                                                onClick={() => {
                                                                    setAddProductId(String(p.id));
                                                                    setAddProductSnapshot({
                                                                        id: p.id,
                                                                        name: p.name,
                                                                    });
                                                                }}
                                                                className={[
                                                                    'flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-start text-sm transition',
                                                                    isSel
                                                                        ? 'bg-brand-light/50 font-semibold text-brand-dark'
                                                                        : 'hover:bg-white',
                                                                ].join(' ')}
                                                            >
                                                                <span className="text-slate-900">{p.name}</span>
                                                                <span className="text-xs text-slate-500">#{p.id}</span>
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                                onClick={closeAddModal}
                            >
                                {t('inventory_modal_cancel')}
                            </button>
                            <button
                                type="button"
                                disabled={addSubmitting}
                                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                onClick={submitAdd}
                            >
                                {t('inventory_modal_confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
