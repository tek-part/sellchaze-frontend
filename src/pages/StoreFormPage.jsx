import { useEffect, useState } from 'react';
import { Navigate, useMatch, useNavigate, useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import SearchableSelect from '../components/ui/SearchableSelect';

const CURRENCIES = ['USD', 'SAR', 'AED', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR', 'EUR'];

export default function StoreFormPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const isNew = !!useMatch('/stores/new');
    const can = (p) => permissions.includes(p);

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [status, setStatus] = useState('draft');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (isNew || !permissions.includes('stores-list')) return;
        setErr('');
        api.get(`/stores/${id}`)
            .then(({ data }) => {
                const s = data.data;
                setName(s.name ?? '');
                setSlug(s.slug ?? '');
                setDescription(s.description ?? '');
                setEmail(s.email ?? '');
                setPhone(s.phone ?? '');
                setCurrency(s.currency ?? 'USD');
                setStatus(s.status ?? 'draft');
            })
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id, isNew, permissions]);

    const requiredPerm = isNew ? 'stores-create' : 'stores-edit';
    if (!can(requiredPerm)) {
        return <Navigate to="/stores" replace />;
    }

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setErr('');
        const payload = {
            name,
            slug: slug.trim() || null,
            description: description || null,
            email: email || null,
            phone: phone || null,
            currency,
            status,
        };
        try {
            if (isNew) {
                const { data } = await api.post('/stores', payload);
                toast.success(t('table_create'));
                const newStoreId = data?.data?.id;
                if (newStoreId) {
                    navigate(`/stores/${newStoreId}/onboarding`);
                    return;
                }
            } else {
                await api.put(`/stores/${id}`, payload);
                toast.success(t('action_edit'));
            }
            navigate('/stores');
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    const field = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';
    const label = 'mb-1 block text-sm font-medium text-slate-700';

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {isNew ? t('store_form_create') : t('store_form_edit')}
                </h1>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <form
                onSubmit={submit}
                className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={label}>{t('col_name')}</label>
                        <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
                    </div>
                    <div>
                        <label className={label}>{t('store_slug')}</label>
                        <input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="my-store"
                            pattern="[a-z0-9\-]*"
                            className={field}
                        />
                        <p className="mt-1 text-xs text-slate-400">a-z, 0-9, - only. Auto-generated if empty.</p>
                    </div>
                    <div className="sm:col-span-2">
                        <label className={label}>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className={field}
                        />
                    </div>
                    <div>
                        <label className={label}>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                    </div>
                    <div>
                        <label className={label}>Phone</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
                    </div>
                    <div>
                        <label className={label}>{t('store_currency')}</label>
                        <SearchableSelect value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full">
                            {CURRENCIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </SearchableSelect>
                    </div>
                    <div>
                        <label className={label}>{t('store_status')}</label>
                        <SearchableSelect value={status} onChange={(e) => setStatus(e.target.value)} className="w-full">
                            <option value="draft">{t('store_status_draft')}</option>
                            <option value="active">{t('store_status_active')}</option>
                            <option value="suspended">{t('store_status_suspended')}</option>
                        </SearchableSelect>
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
                        onClick={() => navigate('/stores')}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
