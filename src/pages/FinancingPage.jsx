import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineBanknotes,
    HiOutlineShieldCheck,
    HiOutlineLockClosed,
    HiOutlineBolt,
    HiOutlineCheckBadge,
} from 'react-icons/hi2';
import api from '../api/client';

const PURPOSES = ['order', 'materials', 'equipment', 'expansion'];
const REPAYMENT_OPTIONS = [3, 6, 9, 12, 18, 24, 36];

const STATUS_STYLES = {
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    funded: 'bg-brand-light text-brand-dark border-brand/20',
    rejected: 'bg-red-50 text-red-700 border-red-100',
    closed: 'bg-slate-100 text-slate-500 border-slate-200',
};

const EMPTY_FORM = {
    amount: '',
    purpose: 'order',
    repayment_months: '',
    has_confirmed_order: 'no',
    description: '',
};

/**
 * Financing request page. A factory/merchant asks for funding; Sellchaze reviews
 * and, once approved, funders can see it. This screen submits a request and lists
 * the user's own requests with their review status.
 */
export default function FinancingPage() {
    const { t } = useTranslation();

    const [form, setForm] = useState(EMPTY_FORM);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState('');
    const [success, setSuccess] = useState('');

    const loadMine = () => {
        setLoading(true);
        api.get('/me/financing-requests')
            .then((res) => setRequests(res.data?.data ?? []))
            .catch(() => setRequests([]))
            .finally(() => setLoading(false));
    };

    useEffect(loadMine, []);

    const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        setSuccess('');
        setSubmitting(true);
        try {
            await api.post('/financing-requests', {
                amount: Number(form.amount),
                purpose: form.purpose,
                repayment_months: form.repayment_months ? Number(form.repayment_months) : null,
                has_confirmed_order: form.has_confirmed_order === 'yes',
                description: form.description.trim(),
            });
            setSuccess(t('fin_submitted', 'Your financing request was submitted and is under review.'));
            setForm(EMPTY_FORM);
            loadMine();
        } catch (e2) {
            setErr(e2?.response?.data?.message || t('fin_error', 'Could not submit your request. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    const fieldClass =
        'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Hero */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-sm">
                <h1 className="flex items-center gap-2 text-2xl font-bold">
                    <HiOutlineBanknotes className="h-7 w-7" aria-hidden />
                    {t('fin_title', 'Request financing for your factory')}
                </h1>
                <p className="mt-1 text-sm text-emerald-50/90">
                    {t('fin_subtitle', 'Connect with vetted funders — without banking hassle.')}
                </p>
            </div>

            {success ? (
                <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>
            ) : null}
            {err ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>
            ) : null}

            {/* Request form */}
            <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {t('fin_amount', 'Amount requested')}
                    </label>
                    <input
                        type="number"
                        min="1"
                        required
                        value={form.amount}
                        onChange={update('amount')}
                        placeholder={t('fin_amount_ph', 'Amount (EGP)')}
                        className={fieldClass}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                            {t('fin_purpose', 'Purpose of financing')}
                        </label>
                        <select value={form.purpose} onChange={update('purpose')} className={fieldClass}>
                            {PURPOSES.map((p) => (
                                <option key={p} value={p}>
                                    {t(`fin_purpose_${p}`, p)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                            {t('fin_repayment', 'Requested repayment period')}
                        </label>
                        <select value={form.repayment_months} onChange={update('repayment_months')} className={fieldClass}>
                            <option value="">{t('fin_repayment_any', 'Flexible')}</option>
                            {REPAYMENT_OPTIONS.map((m) => (
                                <option key={m} value={m}>
                                    {t('fin_months', '{{n}} months', { n: m })}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {t('fin_has_order', 'Do you have a confirmed order?')}
                    </label>
                    <select value={form.has_confirmed_order} onChange={update('has_confirmed_order')} className={fieldClass}>
                        <option value="no">{t('no', 'No')}</option>
                        <option value="yes">{t('yes', 'Yes')}</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {t('fin_description', 'Short description of the request')}
                    </label>
                    <textarea
                        rows={4}
                        required
                        minLength={20}
                        value={form.description}
                        onChange={update('description')}
                        placeholder={t('fin_description_ph', 'Briefly describe your request…')}
                        className={fieldClass}
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                >
                    {submitting ? t('sending', 'Sending…') : t('fin_submit', 'Send financing request')}
                </button>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px] font-medium text-slate-500">
                    <span className="flex items-center justify-center gap-1 rounded-lg border border-slate-100 py-2">
                        <HiOutlineShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden /> {t('fin_badge_verified', 'Vetted & trusted')}
                    </span>
                    <span className="flex items-center justify-center gap-1 rounded-lg border border-slate-100 py-2">
                        <HiOutlineLockClosed className="h-4 w-4 text-emerald-600" aria-hidden /> {t('fin_badge_secure', 'Your data is safe')}
                    </span>
                    <span className="flex items-center justify-center gap-1 rounded-lg border border-slate-100 py-2">
                        <HiOutlineBolt className="h-4 w-4 text-emerald-600" aria-hidden /> {t('fin_badge_fast', 'Reply within 48h')}
                    </span>
                </div>
            </form>

            {/* My requests */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">{t('fin_my_requests', 'My financing requests')}</h2>
                {loading ? (
                    <p className="py-6 text-center text-sm text-slate-400">{t('loading', 'Loading…')}</p>
                ) : requests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center">
                        <p className="text-sm font-medium text-slate-500">{t('fin_none', 'No financing requests yet.')}</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {requests.map((r) => (
                            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-base font-bold text-slate-900">
                                            {Number(r.amount).toLocaleString()} {r.currency}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {t(`fin_purpose_${r.purpose}`, r.purpose)}
                                            {r.repayment_months ? ` · ${t('fin_months', '{{n}} months', { n: r.repayment_months })}` : ''}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                            STATUS_STYLES[r.status] || STATUS_STYLES.closed
                                        }`}
                                    >
                                        {r.status === 'approved' || r.status === 'funded' ? (
                                            <HiOutlineCheckBadge className="h-3.5 w-3.5" aria-hidden />
                                        ) : null}
                                        {t(`fin_status_${r.status}`, r.status)}
                                    </span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{r.description}</p>
                                {r.review_note ? (
                                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                        {t('fin_review_note', 'Note')}: {r.review_note}
                                    </p>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
