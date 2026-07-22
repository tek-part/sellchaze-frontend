import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowLeft,
    HiOutlinePencilSquare,
    HiOutlineTag,
    HiOutlineRectangleGroup,
    HiOutlineCalendarDays,
    HiOutlineIdentification,
    HiOutlinePhoto,
    HiOutlineTrash,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../api/client';

function unwrap(p) { return p?.data ?? p; }

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const [row, setRow] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [imgOpen, setImgOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        setErr('');
        setLoading(true);
        api.get(`/products/${id}`)
            .then(({ data }) => setRow(unwrap(data)))
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (!can('products-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleDelete = async () => {
        if (!window.confirm(t('confirm_delete') || 'Delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success(t('deleted') || 'Deleted');
            navigate('/products');
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
        );
    }

    if (err) {
        return (
            <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{err}</div>
        );
    }

    if (!row) return null;

    const attributes = Array.isArray(row.attributes) ? row.attributes : [];
    const imgUrl = row.image_url || row.image_thumb_url;
    const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en';

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-brand"
                    >
                        <HiOutlineArrowLeft className="h-4 w-4" aria-hidden />
                        {t('products')}
                    </button>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{row.name}</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">
                            #{row.id}
                        </span>
                    </div>
                    {row.category?.name ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
                            <HiOutlineTag className="h-4 w-4" aria-hidden />
                            {row.category.name}
                        </p>
                    ) : null}
                </div>
                <div className="flex items-center gap-2">
                    {can('products-delete') ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-xs transition hover:bg-red-50"
                        >
                            <HiOutlineTrash className="h-4 w-4" aria-hidden />
                            {t('delete') || 'Delete'}
                        </button>
                    ) : null}
                    {can('products-edit') ? (
                        <Link
                            to={`/products/${id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand/90"
                        >
                            <HiOutlinePencilSquare className="h-4 w-4" aria-hidden />
                            {t('action_edit')}
                        </Link>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Image */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2"
                >
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-slate-50 to-slate-100">
                            {imgUrl ? (
                                <button type="button" onClick={() => setImgOpen(true)} className="h-full w-full">
                                    <img src={imgUrl} alt={row.name} className="h-full w-full object-contain p-4 transition hover:scale-105" />
                                </button>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-300">
                                    <HiOutlinePhoto className="h-14 w-14" aria-hidden />
                                    <span className="text-sm">{t('product_no_image') || 'No image'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Details */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="space-y-5 lg:col-span-3"
                >
                    {/* Description */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{t('col_description')}</h2>
                        {row.description ? (
                            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-800">{row.description}</p>
                        ) : (
                            <p className="mt-3 text-slate-400">{t('product_no_description') || 'No description provided.'}</p>
                        )}
                    </div>

                    {/* Attributes */}
                    {attributes.length > 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                            <div className="mb-3 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600">
                                    <HiOutlineRectangleGroup className="h-4 w-4" aria-hidden />
                                </div>
                                <h2 className="text-sm font-semibold text-slate-900">{t('order_section_attributes') || 'Attributes'}</h2>
                                <span className="ms-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{attributes.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {attributes.map((a) => (
                                    <span
                                        key={`${a.id}-${a.name}`}
                                        className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand"
                                    >
                                        <HiOutlineTag className="h-3 w-3" aria-hidden />
                                        {a.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Meta */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <MetaCard
                            icon={HiOutlineIdentification}
                            label="ID"
                            value={<span className="font-mono">{row.id}</span>}
                            gradient="from-slate-400 to-slate-600"
                        />
                        <MetaCard
                            icon={HiOutlineTag}
                            label={t('col_category')}
                            value={row.category?.name ?? '—'}
                            gradient="from-amber-400 to-orange-500"
                        />
                        <MetaCard
                            icon={HiOutlineCalendarDays}
                            label={t('col_created')}
                            value={row.created_at ? new Date(row.created_at).toLocaleString(locale) : '—'}
                            gradient="from-indigo-400 to-sky-500"
                        />
                        <MetaCard
                            icon={HiOutlineCalendarDays}
                            label={t('col_updated') || 'Updated'}
                            value={row.updated_at ? new Date(row.updated_at).toLocaleString(locale) : '—'}
                            gradient="from-emerald-400 to-teal-500"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Lightbox */}
            {imgOpen && imgUrl ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs"
                    onClick={() => setImgOpen(false)}
                >
                    <img src={imgUrl} alt={row.name} className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" />
                </div>
            ) : null}
        </div>
    );
}

function MetaCard({ icon: Icon, label, value, gradient }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className={`absolute -inset-e-6 -top-6 h-20 w-20 rounded-full bg-linear-to-br ${gradient} opacity-10 blur-2xl`} />
            <div className="relative flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${gradient} text-white shadow-xs`}>
                    <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value}</p>
                </div>
            </div>
        </div>
    );
}
