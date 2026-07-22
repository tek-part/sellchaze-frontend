import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineCalendarDays, HiOutlineEnvelope, HiOutlinePhone, HiOutlineShieldCheck, HiOutlineUser } from 'react-icons/hi2';
import api from '../api/client';

export default function MerchantDetailPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const { isAdmin = false } = useOutletContext() ?? {};
    const [row, setRow] = useState(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data } = await api.get(`/merchants/${id}`);
                if (!active) return;
                setRow(data?.data ?? null);
            } catch (e) {
                if (!active) return;
                setErr(e.response?.data?.message || e.message);
            }
        })();
        return () => {
            active = false;
        };
    }, [id]);

    const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');
    const statusLabel = row?.pending_approval
        ? t('suppliers_pending_badge')
        : row?.is_active !== false
            ? t('status_active')
            : t('status_inactive');
    const statusClass = row?.pending_approval
        ? 'bg-amber-100 text-amber-900'
        : row?.is_active !== false
            ? 'bg-emerald-50 text-emerald-800'
            : 'bg-slate-100 text-slate-600';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-s-4 border-brand ps-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('merchant_detail', 'Merchant details')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('merchants_help') || t('suppliers_help')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/merchants" className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                        {t('back', 'Back')}
                    </Link>
                    {isAdmin ? (
                        <Link to={`/merchants/${id}/edit`} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                            {t('action_edit')}
                        </Link>
                    ) : null}
                </div>
            </div>
            {err ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
            {row?.pending_approval ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    {t('suppliers_detail_pending_hint')}
                </p>
            ) : null}
            {row ? (
                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
                        <h2 className="mb-4 text-base font-semibold text-slate-900">{t('supplier_profile', 'Profile')}</h2>
                        <dl className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                <dt className="mb-1 flex items-center gap-1 text-xs text-slate-500"><HiOutlineUser className="h-4 w-4" />{t('col_name')}</dt>
                                <dd className="font-medium text-slate-900">{row.name || '—'}</dd>
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                <dt className="mb-1 flex items-center gap-1 text-xs text-slate-500"><HiOutlineEnvelope className="h-4 w-4" />{t('email')}</dt>
                                <dd className="font-medium text-slate-900">{row.email || '—'}</dd>
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                <dt className="mb-1 flex items-center gap-1 text-xs text-slate-500"><HiOutlinePhone className="h-4 w-4" />{t('phone')}</dt>
                                <dd className="font-medium text-slate-900">{row.phone || '—'}</dd>
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                <dt className="mb-1 flex items-center gap-1 text-xs text-slate-500"><HiOutlineShieldCheck className="h-4 w-4" />{t('col_status')}</dt>
                                <dd><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>{statusLabel}</span></dd>
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                <dt className="mb-1 flex items-center gap-1 text-xs text-slate-500"><HiOutlineCalendarDays className="h-4 w-4" />{t('col_created')}</dt>
                                <dd className="font-medium text-slate-900">{fmt(row.created_at)}</dd>
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                <dt className="mb-1 flex items-center gap-1 text-xs text-slate-500"><HiOutlineCalendarDays className="h-4 w-4" />{t('col_updated')}</dt>
                                <dd className="font-medium text-slate-900">{fmt(row.updated_at)}</dd>
                            </div>
                        </dl>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                        <h2 className="mb-4 text-base font-semibold text-slate-900">{t('col_actions')}</h2>
                        {row.username ? (
                            <a
                                href={`/u/${encodeURIComponent(row.username)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-brand hover:text-brand"
                            >
                                {t('view_public_profile', 'View public profile')}
                            </a>
                        ) : (
                            <span className="text-sm text-slate-500">—</span>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
