import { useEffect, useState } from 'react';
import { Navigate, useMatch, useNavigate, useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function BundleFormPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const isNew = !!useMatch('/bundles/new');
    const can = (p) => permissions.includes(p);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (isNew || !permissions.includes('bundles-list')) {
            return;
        }
        setErr('');
        api.get(`/bundles/${id}`)
            .then(({ data }) => {
                const b = data.data;
                setName(b.name ?? '');
                setDescription(b.description ?? '');
                const lines = (b.products ?? []).map((p) => ({
                    product_id: String(p.id),
                    quantity: p.quantity ?? 1,
                }));
                setItems(lines.length ? lines : [{ product_id: '', quantity: 1 }]);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id, isNew, permissions]);

    const requiredPerm = isNew ? 'bundles-create' : 'bundles-edit';
    if (!can(requiredPerm)) {
        return <Navigate to="/bundles" replace />;
    }

    function addLine() {
        setItems((prev) => [...prev, { product_id: '', quantity: 1 }]);
    }

    function updateLine(i, field, value) {
        setItems((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], [field]: value };
            return next;
        });
    }

    function removeLine(i) {
        setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));
    }

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setErr('');
        const payloadItems = items
            .filter((row) => String(row.product_id).trim() !== '')
            .map((row) => ({
                product_id: Number(row.product_id),
                quantity: Math.max(1, Number(row.quantity) || 1),
            }));
        try {
            const payload = {
                name,
                description: description || null,
                items: payloadItems,
            };
            if (isNew) {
                await api.post('/bundles', payload);
                toast.success(t('table_create'));
            } else {
                await api.put(`/bundles/${id}`, payload);
                toast.success(t('action_edit'));
            }
            navigate('/bundles');
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {isNew ? t('bundle_form_create') : t('bundle_form_edit')}
                </h1>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('col_name')}</label>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">{t('bundle_form_items')}</label>
                        <button type="button" onClick={addLine} className="text-sm font-medium text-brand">
                            {t('bundle_form_add_line')}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {items.map((row, i) => (
                            <div key={i} className="flex flex-wrap items-end gap-2">
                                <div className="min-w-32 flex-1">
                                    <span className="mb-1 block text-[11px] uppercase text-slate-500">
                                        {t('col_product_id')}
                                    </span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={row.product_id}
                                        onChange={(e) => updateLine(i, 'product_id', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="w-24">
                                    <span className="mb-1 block text-[11px] uppercase text-slate-500">{t('col_qty')}</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={row.quantity}
                                        onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeLine(i)}
                                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                        {t('product_form_save')}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/bundles')}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
