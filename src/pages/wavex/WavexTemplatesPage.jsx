import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowPath,
    HiOutlineDocumentDuplicate,
    HiOutlineDocumentText,
    HiOutlineEye,
    HiOutlineFilm,
    HiOutlinePencilSquare,
    HiOutlinePhoto,
    HiOutlinePlus,
    HiOutlineTrash,
} from 'react-icons/hi2';
import api from '../../api/client';
import { getPaginatedRows } from '../../utils/apiPagination';

function mediaTypeLabel(t, type) {
    if (type === 'image') return t('wavex_template_media_type_image');
    if (type === 'video') return t('wavex_template_media_type_video');
    if (type === 'document') return t('wavex_template_media_type_document');
    return '';
}

function MediaIcon({ type }) {
    if (type === 'image') return <HiOutlinePhoto className="h-3.5 w-3.5" />;
    if (type === 'video') return <HiOutlineFilm className="h-3.5 w-3.5" />;
    return <HiOutlineDocumentText className="h-3.5 w-3.5" />;
}

export default function WavexTemplatesPage() {
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const canAccessWavex = permissions.includes('wavex-access');

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [selected, setSelected] = useState([]);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setErr('');
        setLoading(true);
        try {
            const { data } = await api.get('/wavex/templates');
            setRows(getPaginatedRows(data));
            setSelected([]);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!canAccessWavex) return;
        void load();
    }, [load, canAccessWavex]);

    const toggleSelect = (id) => {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        setSelected(selected.length === rows.length ? [] : rows.map((r) => r.id));
    };

    async function deleteTemplate(id) {
        if (!confirm(t('wavex_tpl_confirm_delete'))) return;
        setBusy(true);
        setErr('');
        try {
            await api.delete(`/wavex/templates/${id}`);
            await load();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    }

    async function bulkDelete() {
        if (selected.length === 0) return;
        if (!confirm(t('wavex_tpl_confirm_bulk_delete', { count: selected.length }))) return;
        setBusy(true);
        setErr('');
        try {
            await api.post('/wavex/templates/bulk-destroy', { ids: selected });
            await load();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    }

    if (!canAccessWavex) return <Navigate to="/dashboard" replace />;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <HiOutlineDocumentDuplicate className="h-8 w-8 text-brand" aria-hidden />
                        {t('wavex_templates_title')}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{t('wavex_templates_subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void load()}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <HiOutlineArrowPath className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        {t('wavex_groups_reload')}
                    </button>
                    <Link
                        to="/wavex/templates/new"
                        className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                        <HiOutlinePlus className="h-4 w-4" />
                        {t('wavex_template_create')}
                    </Link>
                </div>
            </div>

            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}

            {selected.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
                >
                    <span className="text-sm font-medium text-red-800">
                        {t('wavex_cg_selected_count', { count: selected.length })}
                    </span>
                    <button
                        type="button"
                        onClick={bulkDelete}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        <HiOutlineTrash className="h-4 w-4" />
                        {t('wavex_cg_delete_selected')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelected([])}
                        className="text-xs font-medium text-red-700 hover:underline"
                    >
                        {t('wavex_cg_deselect_all')}
                    </button>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200/80 bg-white shadow-card"
            >
                {loading ? (
                    <p className="p-8 text-center text-sm text-slate-500">{t('table_loading')}</p>
                ) : rows.length === 0 ? (
                    <div className="p-10 text-center">
                        <HiOutlineDocumentDuplicate className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-2 text-sm text-slate-500">{t('empty')}</p>
                        <Link
                            to="/wavex/templates/new"
                            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                        >
                            <HiOutlinePlus className="h-4 w-4" />
                            {t('wavex_template_create')}
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs text-slate-600">
                                <tr>
                                    <th className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.length === rows.length && rows.length > 0}
                                            onChange={toggleAll}
                                            className="rounded-sm border-slate-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3">{t('wavex_template_name')}</th>
                                    <th className="px-4 py-3">{t('wavex_template_body')}</th>
                                    <th className="px-4 py-3 text-center">{t('wavex_template_attachment')}</th>
                                    <th className="w-48 px-4 py-3 text-center">{t('wavex_cg_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row) => (
                                    <tr key={row.id} className={selected.includes(row.id) ? 'bg-brand/5' : 'hover:bg-slate-50'}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(row.id)}
                                                onChange={() => toggleSelect(row.id)}
                                                className="rounded-sm border-slate-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                                        <td className="max-w-xs px-4 py-3">
                                            <p className="line-clamp-2 whitespace-pre-wrap text-xs text-slate-600">{row.body}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {row.media_type ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                    <MediaIcon type={row.media_type} />
                                                    {mediaTypeLabel(t, row.media_type)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">{'\u2014'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    to={`/wavex/templates/${row.id}`}
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand"
                                                    title={t('wavex_tpl_view')}
                                                >
                                                    <HiOutlineEye className="h-4 w-4" />
                                                </Link>
                                                <Link
                                                    to={`/wavex/templates/${row.id}/edit`}
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand"
                                                    title={t('wavex_template_edit')}
                                                >
                                                    <HiOutlinePencilSquare className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => void deleteTemplate(row.id)}
                                                    disabled={busy}
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                    title={t('wavex_template_delete')}
                                                >
                                                    <HiOutlineTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
