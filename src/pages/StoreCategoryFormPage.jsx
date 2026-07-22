import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function StoreCategoryFormPage() {
    const { categoryId } = useParams();
    const { id, apiBase, uiBase } = useStoreScope();
    const isEdit = Boolean(categoryId);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', slug: '', description: '', is_active: true });
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!isEdit) return;
        api.get(`${apiBase}/catalog/categories/${categoryId}`)
            .then(({ data }) => {
                const c = data.data;
                setForm({ name: c.name ?? '', slug: c.slug ?? '', description: c.description ?? '', is_active: c.is_active !== false });
                setImageUrl(c.image_url ?? '');
            })
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id, categoryId, isEdit]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr('');
        const fd = new FormData();
        if (isEdit) fd.append('_method', 'PUT');
        fd.append('name', form.name);
        if (form.slug) fd.append('slug', form.slug);
        fd.append('description', form.description ?? '');
        fd.append('is_active', form.is_active ? '1' : '0');
        if (imageFile) fd.append('image', imageFile);
        try {
            const url = isEdit ? `${apiBase}/catalog/categories/${categoryId}` : `${apiBase}/catalog/categories`;
            await api.post(url, fd);
            toast.success(t('product_form_save', 'Save'));
            navigate(`${uiBase}/categories`);
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
                    {isEdit ? t('category_edit', 'Edit category') : t('category_create', 'New category')}
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
                    <label className="block sm:col-span-2">
                        <span className={label}>{t('product_description', 'Description')}</span>
                        <textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('product_image', 'Image')}</span>
                        {imageUrl ? <img src={imageUrl} alt="" className="mb-2 h-16 w-16 rounded-lg border border-slate-200 object-cover" /> : null}
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:text-brand" />
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
                        <span className="text-sm text-slate-700">{t('product_active', 'Active')}</span>
                    </label>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button type="submit" disabled={saving} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{t('product_form_save', 'Save')}</button>
                    <button type="button" onClick={() => navigate(`${uiBase}/categories`)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">{t('cancel', 'Cancel')}</button>
                </div>
            </form>
        </div>
    );
}
