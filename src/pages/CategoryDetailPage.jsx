import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../api/client';

function unwrap(payload) {
    return payload?.data ?? payload;
}

export default function CategoryDetailPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const [row, setRow] = useState(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!id) {
            return;
        }
        setErr('');
        api.get(`/categories/${id}`)
            .then(({ data }) => setRow(unwrap(data)))
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id]);

    if (!can('categories-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="space-y-6">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {row?.name
                        ? t('category_detail_title', { name: row.name })
                        : t('category_detail_title', { name: id ?? '' })}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <Link to="/categories" className="font-medium text-brand hover:underline">
                        ← {t('categories')}
                    </Link>
                    {can('categories-edit') && id ? (
                        <Link
                            to={`/categories/${id}/edit`}
                            className="font-medium text-brand hover:underline"
                        >
                            {t('action_edit')}
                        </Link>
                    ) : null}
                </p>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            {row ? (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
                >
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {t('category_detail_name_en')}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">{row.name_en ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {t('category_detail_name_ar')}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-slate-900" dir="rtl">
                                {row.name_ar ?? '—'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t('col_products_count')}
                        </p>
                        <p className="mt-1 text-2xl font-bold tabular-nums text-brand">{row.products_count ?? 0}</p>
                    </div>
                    <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ID</p>
                            <p className="mt-1 font-mono text-sm text-slate-800">{row.id}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {t('col_created')}
                            </p>
                            <p className="mt-1 text-sm text-slate-800">
                                {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            ) : !err ? (
                <p className="text-center text-sm text-slate-500">{t('loading')}</p>
            ) : null}
        </div>
    );
}
