import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import SearchableSelect from '../components/ui/SearchableSelect';

const EMPTY = {
    code: '', type: 'percentage', value: '', starts_at: '', expires_at: '',
    max_uses: '', max_uses_per_customer: '', minimum_order_amount: '', is_active: true,
};

export default function StoreCouponFormPage() {
    const { couponId } = useParams();
    const { id, apiBase, uiBase } = useStoreScope();
    const isEdit = Boolean(couponId);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!isEdit) return;
        setErr('');
        api.get(`${apiBase}/coupons/${couponId}`)
            .then(({ data }) => {
                const c = data.data;
                const dt = (v) => (v ? String(v).slice(0, 10) : '');
                setForm({
                    code: c.code ?? '', type: c.type ?? 'percentage', value: c.value ?? '',
                    starts_at: dt(c.starts_at), expires_at: dt(c.expires_at),
                    max_uses: c.max_uses ?? '', max_uses_per_customer: c.max_uses_per_customer ?? '',
                    minimum_order_amount: c.minimum_order_amount ?? '', is_active: c.is_active !== false,
                });
            })
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id, apiBase, couponId, isEdit]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr('');
        const payload = {
            code: form.code,
            type: form.type,
            value: form.value,
            is_active: form.is_active,
            starts_at: form.starts_at || null,
            expires_at: form.expires_at || null,
            max_uses: form.max_uses === '' ? null : Number(form.max_uses),
            max_uses_per_customer: form.max_uses_per_customer === '' ? null : Number(form.max_uses_per_customer),
            minimum_order_amount: form.minimum_order_amount === '' ? null : form.minimum_order_amount,
        };
        try {
            if (isEdit) await api.put(`${apiBase}/coupons/${couponId}`, payload);
            else await api.post(`${apiBase}/coupons`, payload);
            toast.success(t('product_form_save', 'Save'));
            navigate(`${uiBase}/coupons`);
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
                    {isEdit ? t('coupon_edit', 'Edit coupon') : t('coupon_create', 'New coupon')}
                </h1>
            </div>
            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className={label}>{t('coupon_code', 'Code')}</span>
                        <input required value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} className={`${field} font-mono`} placeholder="SUMMER10" />
                    </label>
                    <label className="block">
                        <span className={label}>{t('coupon_type', 'Type')}</span>
                        <SearchableSelect value={form.type} onChange={(e) => set('type', e.target.value)} className="w-full">
                            <option value="percentage">{t('coupon_type_percentage', 'Percentage (%)')}</option>
                            <option value="fixed">{t('coupon_type_fixed', 'Fixed amount')}</option>
                        </SearchableSelect>
                    </label>
                    <label className="block">
                        <span className={label}>{t('coupon_value', 'Value')}</span>
                        <input required type="number" step="0.01" min="0.01" value={form.value} onChange={(e) => set('value', e.target.value)} className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('coupon_min_order', 'Minimum order amount')}</span>
                        <input type="number" step="0.01" min="0" value={form.minimum_order_amount} onChange={(e) => set('minimum_order_amount', e.target.value)} className={field} placeholder="0.00" />
                    </label>
                    <label className="block">
                        <span className={label}>{t('coupon_starts_at', 'Starts at')}</span>
                        <input type="date" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('coupon_expires', 'Expires at')}</span>
                        <input type="date" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('coupon_max_uses', 'Max total uses')}</span>
                        <input type="number" min="1" value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} className={field} placeholder={t('coupon_unlimited', 'Unlimited')} />
                    </label>
                    <label className="block">
                        <span className={label}>{t('coupon_max_per_customer', 'Max uses per customer')}</span>
                        <input type="number" min="1" value={form.max_uses_per_customer} onChange={(e) => set('max_uses_per_customer', e.target.value)} className={field} placeholder={t('coupon_unlimited', 'Unlimited')} />
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
                        <span className="text-sm text-slate-700">{t('coupon_is_active', 'Active (redeemable at checkout)')}</span>
                    </label>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button type="submit" disabled={saving} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
                        {t('product_form_save', 'Save')}
                    </button>
                    <button type="button" onClick={() => navigate(`${uiBase}/coupons`)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
                        {t('cancel', 'Cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
