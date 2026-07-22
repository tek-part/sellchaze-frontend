import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

function unwrap(payload) {
    return payload?.data ?? payload;
}

export default function ShippingCompanyFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAdmin, permissions } = useOutletContext();
    const can = (p) => isAdmin || permissions.includes(p);

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [trackingUrlTemplate, setTrackingUrlTemplate] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [sortOrder, setSortOrder] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!isEdit || (!can('shipping-companies-list') && !can('shipping-companies-edit'))) {
            setFetching(false);
            return;
        }
        setErr('');
        setFetching(true);
        api.get(`/shipping-companies/${id}`)
            .then(({ data }) => {
                const row = unwrap(data);
                setName(row?.name ?? '');
                setCode(row?.code ?? '');
                setPhone(row?.phone ?? '');
                setWebsite(row?.website ?? '');
                setTrackingUrlTemplate(row?.tracking_url_template ?? '');
                setIsActive(row?.is_active !== false);
                setSortOrder(Number(row?.sort_order ?? 0));
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setFetching(false));
    }, [id, isEdit, isAdmin]);

    if (isEdit && !can('shipping-companies-edit')) {
        return <Navigate to="/shipping/companies" replace />;
    }
    if (!isEdit && !can('shipping-companies-create')) {
        return <Navigate to="/shipping/companies" replace />;
    }

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setErr('');
        try {
            const payload = {
                name,
                code: code.trim() || undefined,
                phone: phone.trim() || null,
                website: website.trim() || null,
                tracking_url_template: trackingUrlTemplate.trim() || null,
                is_active: isActive,
                sort_order: sortOrder,
            };
            if (isEdit) {
                await api.patch(`/shipping-companies/${id}`, payload);
            } else {
                await api.post('/shipping-companies', payload);
            }
            toast.success(t('shipping_company_saved'));
            navigate('/shipping/companies');
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            const errors = e.response?.data?.errors;
            const flat = errors && typeof errors === 'object' ? Object.values(errors).flat().join(' ') : '';
            setErr(flat || msg);
            toast.error(flat || msg);
        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">{t('loading')}</div>
        );
    }

    return (
        <div className="mx-auto max-w-lg space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {isEdit ? t('shipping_company_form_edit') : t('shipping_company_form_new')}
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
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('col_slug')}</label>
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={t('shipping_company_code_placeholder')}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-500">{t('shipping_company_code_hint')}</p>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('profile_phone')}</label>
                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('shipping_company_website')}</label>
                    <input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        {t('shipping_tracking_url_template')}
                    </label>
                    <input
                        value={trackingUrlTemplate}
                        onChange={(e) => setTrackingUrlTemplate(e.target.value)}
                        placeholder="https://example.com/track?no={tracking}"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-500">{t('shipping_tracking_template_hint')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        id="sc-active"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded-sm border-slate-300"
                    />
                    <label htmlFor="sc-active" className="text-sm text-slate-700">
                        {t('status_active')}
                    </label>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('col_sort_order')}</label>
                    <input
                        type="number"
                        min={0}
                        max={65535}
                        value={sortOrder}
                        onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
                        onClick={() => navigate('/shipping/companies')}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
