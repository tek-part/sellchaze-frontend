import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

const EMPTY = {
    name: '', slug: '', sku: '', barcode: '', short_description: '', description: '',
    price: '', compare_price: '', store_category_id: '', is_active: true, is_featured: false,
};

export default function StoreProductFormPage() {
    const { productId } = useParams();
    const { id, apiBase, uiBase } = useStoreScope();
    const isEdit = Boolean(productId);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY);
    const [categories, setCategories] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        api.get(`${apiBase}/catalog/categories`, { params: { per_page: 100 } })
            .then(({ data }) => setCategories(data.data ?? [])).catch(() => {});
    }, [id]);

    useEffect(() => {
        if (!isEdit) return;
        api.get(`${apiBase}/catalog/products/${productId}`)
            .then(({ data }) => {
                const p = data.data;
                setForm({
                    name: p.name ?? '', slug: p.slug ?? '', sku: p.sku ?? '', barcode: p.barcode ?? '',
                    short_description: p.short_description ?? '', description: p.description ?? '',
                    price: p.price ?? '', compare_price: p.compare_price ?? '',
                    store_category_id: p.category?.id ?? '', is_active: p.is_active !== false, is_featured: !!p.is_featured,
                });
                setImageUrl(p.image_url ?? '');
            })
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id, productId, isEdit]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr('');
        const fd = new FormData();
        if (isEdit) fd.append('_method', 'PUT');
        fd.append('name', form.name);
        if (form.slug) fd.append('slug', form.slug);
        fd.append('sku', form.sku ?? '');
        fd.append('barcode', form.barcode ?? '');
        fd.append('short_description', form.short_description ?? '');
        fd.append('description', form.description ?? '');
        if (form.price !== '') fd.append('price', form.price);
        if (form.compare_price !== '') fd.append('compare_price', form.compare_price);
        if (form.store_category_id) fd.append('store_category_id', form.store_category_id);
        fd.append('is_active', form.is_active ? '1' : '0');
        fd.append('is_featured', form.is_featured ? '1' : '0');
        if (imageFile) fd.append('image', imageFile);

        try {
            const url = isEdit ? `${apiBase}/catalog/products/${productId}` : `${apiBase}/catalog/products`;
            const { data } = await api.post(url, fd);
            toast.success(t('product_form_save', 'Save'));
            navigate(`${uiBase}/products/${data.data.id}`);
        } catch (e2) {
            const errors = e2.response?.data?.errors;
            setErr(errors ? Object.values(errors).flat().join(' ') : (e2.response?.data?.message || e2.message));
        } finally {
            setSaving(false);
        }
    };

    const field = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-xs transition focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20';
    const label = 'mb-1 block text-sm font-medium text-slate-700';

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {isEdit ? t('product_edit', 'Edit product') : t('product_create', 'New product')}
                </h1>
            </div>
            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className={label}>{t('col_name', 'Name')}</span>
                        <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('store_slug', 'Slug')}</span>
                        <input value={form.slug} onChange={(e) => set('slug', e.target.value)} pattern="[a-z0-9\-]*" placeholder={t('slug_auto', 'auto-generated if empty')} className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('product_sku', 'SKU')}</span>
                        <input value={form.sku} onChange={(e) => set('sku', e.target.value)} className={`${field} font-mono`} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('product_barcode', 'Barcode')}</span>
                        <input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} className={`${field} font-mono`} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('product_price', 'Price')}</span>
                        <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('product_compare_price', 'Compare-at price')}</span>
                        <input type="number" step="0.01" min="0" value={form.compare_price} onChange={(e) => set('compare_price', e.target.value)} className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('product_category', 'Category')}</span>
                        <select value={form.store_category_id} onChange={(e) => set('store_category_id', e.target.value)} className={field}>
                            <option value="">{t('product_no_category', 'Uncategorized')}</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <span className={label}>{t('product_image', 'Image')}</span>
                        {imageUrl ? <img src={imageUrl} alt="" className="mb-2 h-16 w-16 rounded-lg border border-slate-200 object-cover" /> : null}
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:text-brand" />
                    </label>
                    <label className="block sm:col-span-2">
                        <span className={label}>{t('product_short_description', 'Short description')}</span>
                        <input value={form.short_description} onChange={(e) => set('short_description', e.target.value)} maxLength={500} className={field} />
                    </label>
                    <label className="block sm:col-span-2">
                        <span className={label}>{t('product_description', 'Description')}</span>
                        <textarea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} className={field} />
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
                        <span className="text-sm text-slate-700">{t('product_active', 'Active (visible in storefront)')}</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />
                        <span className="text-sm text-slate-700">{t('product_featured_flag', 'Featured')}</span>
                    </label>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button type="submit" disabled={saving} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
                        {t('product_form_save', 'Save')}
                    </button>
                    <button type="button" onClick={() => navigate(`${uiBase}/products`)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
                        {t('cancel', 'Cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
