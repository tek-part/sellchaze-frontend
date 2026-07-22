import { useEffect, useState } from 'react';
import { Navigate, useMatch, useNavigate, useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function CategoryFormPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const isNew = !!useMatch('/categories/new');
    const can = (p) => permissions.includes(p);

    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (isNew || !permissions.includes('categories-list')) {
            return;
        }
        setErr('');
        api.get(`/categories/${id}`)
            .then(({ data }) => {
                const d = data.data ?? {};
                setNameEn(d.name_en ?? d.name ?? '');
                setNameAr(d.name_ar ?? d.name ?? '');
            })
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id, isNew, permissions]);

    const requiredPerm = isNew ? 'categories-create' : 'categories-edit';
    if (!can(requiredPerm)) {
        return <Navigate to="/categories" replace />;
    }

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setErr('');
        try {
            const payload = { name_en: nameEn.trim(), name_ar: nameAr.trim() };
            if (isNew) {
                await api.post('/categories', payload);
                toast.success(t('table_create'));
            } else {
                await api.put(`/categories/${id}`, payload);
                toast.success(t('action_edit'));
            }
            navigate('/categories');
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-lg space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {isNew ? t('category_form_create') : t('category_form_edit')}
                </h1>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('category_name_en')}</label>
                    <input
                        required
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('category_name_ar')}</label>
                    <input
                        required
                        value={nameAr}
                        onChange={(e) => setNameAr(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        dir="rtl"
                    />
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
                        onClick={() => navigate('/categories')}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
