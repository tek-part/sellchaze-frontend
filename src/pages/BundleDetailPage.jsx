import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';

export default function BundleDetailPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const [row, setRow] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!permissions.includes('bundles-list') || !id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setErr('');
        api.get(`/bundles/${id}`)
            .then(({ data }) => setRow(data.data ?? null))
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [permissions, id]);

    if (!can('bundles-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 border-s-4 border-brand ps-4">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        {t('bundle_detail_title', { id })}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        <Link to="/bundles" className="text-brand hover:underline">
                            ← {t('bundles')}
                        </Link>
                    </p>
                </div>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            {!err && row ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                    <h2 className="text-lg font-semibold text-slate-900">{row.name}</h2>
                    {row.description ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{row.description}</p>
                    ) : null}
                </div>
            ) : null}
            {!err && (
                <div className="relative min-h-48 overflow-auto rounded-2xl border border-slate-200/80 bg-white shadow-card">
                    <TableLoadingOverlay show={loading} />
                    {row ? (
                        <>
                            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
                                {t('bundle_items_heading')}
                            </div>
                            <table className="min-w-full text-start text-sm">
                                <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3">{t('col_product')}</th>
                                        <th className="px-4 py-3">{t('col_category')}</th>
                                        <th className="px-4 py-3">{t('col_qty')}</th>
                                        <th className="px-4 py-3">{t('col_image')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(row?.products ?? []).length === 0 && !loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                                                {t('empty')}
                                            </td>
                                        </tr>
                                    ) : null}
                                    {(row?.products ?? []).map((p) => (
                                        <tr key={p.id} className="border-t border-slate-100">
                                            <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                                            <td className="px-4 py-3 text-slate-700">{p.category?.name ?? '—'}</td>
                                            <td className="px-4 py-3 text-slate-700">{p.quantity ?? 1}</td>
                                            <td className="px-4 py-3">
                                                {p.image_thumb_url ? (
                                                    <img
                                                        src={p.image_thumb_url}
                                                        alt=""
                                                        className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-200"
                                                    />
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    ) : null}
                    {!loading && !row ? (
                        <p className="p-8 text-center text-sm text-slate-500">{t('empty')}</p>
                    ) : null}
                </div>
            )}
        </div>
    );
}
