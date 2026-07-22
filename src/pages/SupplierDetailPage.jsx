import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineCalendarDays, HiOutlineEnvelope, HiOutlinePhone, HiOutlineShieldCheck, HiOutlineUser } from 'react-icons/hi2';
import api from '../api/client';

export default function SupplierDetailPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const { isAdmin = false } = useOutletContext() ?? {};
    const [row, setRow] = useState(null);
    const [categoryIds, setCategoryIds] = useState([]);
    const [categories, setCategories] = useState([]);
    const [err, setErr] = useState('');

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const [{ data: supplierData }, { data: routingData }, { data: catData }] = await Promise.all([
                    api.get(`/suppliers/${id}`),
                    api.get(`/suppliers/${id}/routing-categories`),
                    api.get('/categories', { params: { per_page: 200 } }),
                ]);
                if (!active) return;
                setRow(supplierData?.data ?? null);
                setCategoryIds(Array.isArray(routingData?.category_ids) ? routingData.category_ids : []);
                setCategories(Array.isArray(catData?.data) ? catData.data : []);
            } catch (e) {
                if (!active) return;
                setErr(e.response?.data?.message || e.message);
            }
        })();
        return () => {
            active = false;
        };
    }, [id]);

    const selectedNames = categories.filter((c) => categoryIds.includes(c.id)).map((c) => c.name);
    const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-s-4 border-brand ps-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('supplier_detail')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('suppliers_help')}</p>
                </div>
                {isAdmin ? (
                    <Link to={`/suppliers/${id}/edit`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                        {t('action_edit')}
                    </Link>
                ) : null}
            </div>
            {err ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
            {row?.pending_approval ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    {t('suppliers_detail_pending_hint')}
                </p>
            ) : null}
            {row ? (
                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
                        <h2 className="mb-4 text-base font-semibold text-slate-900">{t('supplier_profile')}</h2>
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
                                <dt className="mb-1 flex items-center gap-1 text-xs text-slate-500"><HiOutlineShieldCheck className="h-4 w-4" />{t('col_partnership')}</dt>
                                <dd className="font-medium text-slate-900">{row.partnership_status || '—'}</dd>
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
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h2 className="mb-4 text-base font-semibold text-slate-900">{t('col_routing_categories')}</h2>
                        {selectedNames.length ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedNames.map((n) => <span key={n} className="rounded-sm border border-slate-200 px-2 py-1 text-xs">{n}</span>)}
                            </div>
                        ) : (
                            <span className="text-slate-500">—</span>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
