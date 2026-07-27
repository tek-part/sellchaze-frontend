import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
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

export default function StockTransferFormPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

    const [warehouses, setWarehouses] = useState([]);
    const [fromId, setFromId] = useState('');
    const [toId, setToId] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState([{ product_id: '', qty: 1 }]);
    const [productOptions, setProductOptions] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!can('products-list')) {
            return;
        }
        api
            .get('/warehouses')
            .then(({ data }) => {
                const wh = data.data ?? [];
                setWarehouses(wh);
                if (wh.length >= 2) {
                    setFromId(String(wh[0].id));
                    setToId(String(wh[1].id));
                } else if (wh.length === 1) {
                    setFromId(String(wh[0].id));
                }
            })
            .catch(() => setWarehouses([]));
    }, [permissions]);

    useEffect(() => {
        if (!can('products-edit')) {
            return;
        }
        const tmr = setTimeout(() => {
            api
                .get('/products', { params: { per_page: 80, search: productSearch.trim() || undefined } })
                .then(({ data }) => setProductOptions(data.data ?? []))
                .catch(() => setProductOptions([]));
        }, 300);
        return () => clearTimeout(tmr);
    }, [productSearch, permissions]);

    if (!can('products-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    if (!can('products-edit')) {
        return <Navigate to="/inventory/transfers" replace />;
    }

    const addLine = () => setLines((prev) => [...prev, { product_id: '', qty: 1 }]);

    const updateLine = (i, field, value) => {
        setLines((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], [field]: value };
            return next;
        });
    };

    const removeLine = (i) => setLines((prev) => prev.filter((_, j) => j !== i));

    const submit = async () => {
        if (!fromId || !toId || fromId === toId) {
            toast.error(t('inventory_transfer_validation_warehouses'));
            return;
        }
        const payloadLines = lines
            .map((l) => ({
                product_id: Number(l.product_id),
                qty: Number(l.qty),
            }))
            .filter((l) => l.product_id > 0 && l.qty > 0);
        if (payloadLines.length === 0) {
            toast.error(t('inventory_transfer_validation_lines'));
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/stock-transfers', {
                from_warehouse_id: Number(fromId),
                to_warehouse_id: Number(toId),
                notes: notes.trim() || null,
                lines: payloadLines,
            });
            toast.success(t('inventory_transfer_created'));
            navigate('/inventory/transfers');
        } catch (e) {
            const msg = e.response?.data?.message;
            const errs = e.response?.data?.errors;
            if (errs && typeof errs === 'object') {
                const first = Object.values(errs).flat()[0];
                toast.error(first || msg || e.message);
            } else {
                toast.error(msg || e.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('inventory_transfer_new')}</h1>
                    <p className="text-sm text-slate-600">{t('inventory_transfer_form_subtitle')}</p>
                </div>
                <Link to="/inventory/transfers" className="text-sm font-semibold text-brand hover:underline">
                    {t('inventory_transfers')}
                </Link>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">{t('inventory_transfer_from')}</span>
                        <SearchableSelect
                            value={fromId}
                            onChange={(e) => setFromId(e.target.value)}
                            className="w-full"
                        >
                            <option value="">{t('inventory_select_warehouse')}</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {warehouseLabel(w, lang)}
                                </option>
                            ))}
                        </SearchableSelect>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">{t('inventory_transfer_to')}</span>
                        <SearchableSelect
                            value={toId}
                            onChange={(e) => setToId(e.target.value)}
                            className="w-full"
                        >
                            <option value="">{t('inventory_select_warehouse')}</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {warehouseLabel(w, lang)}
                                </option>
                            ))}
                        </SearchableSelect>
                    </label>
                </div>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">{t('inventory_notes')}</span>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="rounded-xl border border-slate-200 px-3 py-2"
                    />
                </label>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">{t('inventory_lines_heading')}</span>
                        <button
                            type="button"
                            onClick={addLine}
                            className="text-sm font-semibold text-brand hover:underline"
                        >
                            {t('inventory_add_line_row')}
                        </button>
                    </div>
                    <label className="mb-3 flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-600">{t('table_search')}</span>
                        <input
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder={t('table_search_placeholder')}
                            className="rounded-xl border border-slate-200 px-3 py-2"
                        />
                    </label>
                    <div className="space-y-3">
                        {lines.map((line, i) => (
                            <div key={i} className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                <label className="min-w-[200px] flex-1 flex flex-col gap-1 text-xs font-medium text-slate-600">
                                    {t('inventory_select_product')}
                                    <SearchableSelect
                                        value={line.product_id}
                                        onChange={(e) => updateLine(i, 'product_id', e.target.value)}
                                        className="w-full"
                                    >
                                        <option value="">{t('inventory_pick_product')}</option>
                                        {productOptions.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                #{p.id} — {p.name}
                                            </option>
                                        ))}
                                    </SearchableSelect>
                                </label>
                                <label className="w-28 flex flex-col gap-1 text-xs font-medium text-slate-600">
                                    {t('col_qty')}
                                    <input
                                        type="number"
                                        min={1}
                                        value={line.qty}
                                        onChange={(e) => updateLine(i, 'qty', e.target.value)}
                                        className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                                    />
                                </label>
                                {lines.length > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => removeLine(i)}
                                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                                    >
                                        {t('action_delete')}
                                    </button>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Link
                        to="/inventory/transfers"
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        {t('cancel')}
                    </Link>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void submit()}
                        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {t('inventory_submit_transfer')}
                    </button>
                </div>
            </div>
        </div>
    );
}
