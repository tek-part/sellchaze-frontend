import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_VARIANT = { id: null, name: '', sku: '', price_override: '', weight: '', options: '', is_active: true };

// "size=L, color=Red" <-> { size: 'L', color: 'Red' }
const parseOptions = (str) => Object.fromEntries(
    String(str || '').split(',').map((p) => p.split('=').map((s) => s.trim())).filter(([k, v]) => k && v),
);
const stringifyOptions = (obj) => Object.entries(obj || {}).map(([k, v]) => `${k}=${v}`).join(', ');

export default function StoreProductDetailPage() {
    const { productId } = useParams();
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();

    const [product, setProduct] = useState(null);
    const [err, setErr] = useState('');
    const [vForm, setVForm] = useState(EMPTY_VARIANT);
    const [savingVariant, setSavingVariant] = useState(false);
    const [confirmVariant, setConfirmVariant] = useState(null);

    const load = useCallback(() => {
        setErr('');
        api.get(`${apiBase}/catalog/products/${productId}`)
            .then(({ data }) => setProduct(data.data))
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id, productId]);

    useEffect(() => { load(); }, [load]);

    const setV = (k, v) => setVForm((f) => ({ ...f, [k]: v }));
    const resetVariant = () => setVForm(EMPTY_VARIANT);

    const editVariant = (v) => setVForm({
        id: v.id, name: v.name ?? '', sku: v.sku ?? '', price_override: v.price_override ?? '',
        weight: v.weight ?? '', options: stringifyOptions(v.options), is_active: v.is_active !== false,
    });

    const saveVariant = async (e) => {
        e.preventDefault();
        setSavingVariant(true);
        const payload = {
            name: vForm.name,
            sku: vForm.sku || null,
            price_override: vForm.price_override === '' ? null : vForm.price_override,
            weight: vForm.weight === '' ? null : vForm.weight,
            options: parseOptions(vForm.options),
            is_active: vForm.is_active,
        };
        try {
            const base = `${apiBase}/catalog/products/${productId}/variants`;
            if (vForm.id) await api.put(`${base}/${vForm.id}`, payload);
            else await api.post(base, payload);
            toast.success(t('product_form_save', 'Save'));
            resetVariant();
            load();
        } catch (e2) {
            const errors = e2.response?.data?.errors;
            toast.error(errors ? Object.values(errors).flat().join(' ') : (e2.response?.data?.message || e2.message));
        } finally {
            setSavingVariant(false);
        }
    };

    const deleteVariant = async () => {
        if (!confirmVariant) return;
        try {
            await api.delete(`${apiBase}/catalog/products/${productId}/variants/${confirmVariant}`);
            toast.success(t('action_delete', 'Delete'));
            setConfirmVariant(null);
            if (vForm.id === confirmVariant) resetVariant();
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    };

    if (err) return <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>;
    if (!product) return <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">{t('loading', 'Loading…')}</div>;

    const field = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
    const variants = product.variants || [];

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900">
                        {product.name}
                        <StatusBadge status={product.is_active ? 'active' : 'inactive'} label={product.is_active ? t('status_active', 'Active') : t('status_inactive', 'Inactive')} />
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">/{product.slug}{product.sku ? ` · ${product.sku}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to={`${uiBase}/products/${productId}/edit`} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">{t('action_edit', 'Edit')}</Link>
                    <Link to={`${uiBase}/products`} className="text-sm text-brand hover:underline">← {t('products_title', 'Products')}</Link>
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                    {product.image_url ? <img src={product.image_url} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" /> : null}
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-500">{t('product_price', 'Price')}</dt><dd className="font-medium text-slate-900">{Number(product.price).toFixed(2)}</dd></div>
                        {product.compare_price ? <div className="flex justify-between"><dt className="text-slate-500">{t('product_compare_price', 'Compare-at')}</dt><dd className="text-slate-500 line-through">{Number(product.compare_price).toFixed(2)}</dd></div> : null}
                        <div className="flex justify-between"><dt className="text-slate-500">{t('product_category', 'Category')}</dt><dd className="text-slate-700">{product.category?.name || '—'}</dd></div>
                    </dl>
                    {product.short_description ? <p className="mt-3 text-sm text-slate-600">{product.short_description}</p> : null}
                </div>

                {/* Variants manager */}
                <div className="space-y-4 lg:col-span-2">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                        <div className="border-b border-slate-100 px-5 py-3">
                            <h2 className="text-base font-semibold text-slate-900">{t('variants_title', 'Variants')}</h2>
                        </div>
                        <div className="overflow-auto">
                            <table className="min-w-full text-start text-sm">
                                <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3">{t('col_name', 'Name')}</th>
                                        <th className="px-4 py-3">{t('product_sku', 'SKU')}</th>
                                        <th className="px-4 py-3">{t('variant_price', 'Price')}</th>
                                        <th className="px-4 py-3">{t('col_status', 'Status')}</th>
                                        <th className="px-4 py-3">{t('col_actions', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">{t('variants_empty', 'No variants yet.')}</td></tr>
                                    ) : null}
                                    {variants.map((v) => (
                                        <tr key={v.id} className="border-t border-slate-100">
                                            <td className="px-4 py-3 text-slate-800">{v.name}<div className="text-xs text-slate-400">{stringifyOptions(v.options)}</div></td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.sku || '—'}</td>
                                            <td className="px-4 py-3 text-slate-900">{v.effective_price ?? '—'}</td>
                                            <td className="px-4 py-3"><StatusBadge status={v.is_active ? 'active' : 'inactive'} label={v.is_active ? t('status_active', 'Active') : t('status_inactive', 'Inactive')} /></td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2 text-xs">
                                                    <button type="button" onClick={() => editVariant(v)} className="font-medium text-brand hover:underline">{t('action_edit', 'Edit')}</button>
                                                    <button type="button" onClick={() => setConfirmVariant(v.id)} className="font-medium text-red-600 hover:underline">{t('action_delete', 'Delete')}</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add / edit variant */}
                    <form onSubmit={saveVariant} className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                        <h3 className="text-sm font-semibold text-slate-900">{vForm.id ? t('variant_edit', 'Edit variant') : t('variant_add', 'Add variant')}</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input required placeholder={t('variant_name', 'Name (e.g. Red / L)')} value={vForm.name} onChange={(e) => setV('name', e.target.value)} className={field} />
                            <input placeholder={t('product_sku', 'SKU')} value={vForm.sku} onChange={(e) => setV('sku', e.target.value)} className={`${field} font-mono`} />
                            <input type="number" step="0.01" min="0" placeholder={t('variant_price_override', 'Price override (blank = product price)')} value={vForm.price_override} onChange={(e) => setV('price_override', e.target.value)} className={field} />
                            <input type="number" step="0.001" min="0" placeholder={t('variant_weight', 'Weight (kg)')} value={vForm.weight} onChange={(e) => setV('weight', e.target.value)} className={field} />
                            <input placeholder={t('variant_options', 'Options — e.g. size=L, color=Red')} value={vForm.options} onChange={(e) => setV('options', e.target.value)} className={`${field} sm:col-span-2`} />
                        </div>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input type="checkbox" checked={vForm.is_active} onChange={(e) => setV('is_active', e.target.checked)} />
                            <span className="text-sm text-slate-700">{t('product_active', 'Active')}</span>
                        </label>
                        <div className="flex gap-2">
                            <button type="submit" disabled={savingVariant} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{t('product_form_save', 'Save')}</button>
                            {vForm.id ? <button type="button" onClick={resetVariant} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700">{t('cancel', 'Cancel')}</button> : null}
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmDialog
                open={!!confirmVariant}
                onClose={() => setConfirmVariant(null)}
                title={t('variant_delete_title', 'Delete variant')}
                body={t('variant_delete_body', 'This variant will be removed.')}
                confirmLabel={t('action_delete', 'Delete')}
                cancelLabel={t('cancel', 'Cancel')}
                danger
                onConfirm={deleteVariant}
            />
        </div>
    );
}
