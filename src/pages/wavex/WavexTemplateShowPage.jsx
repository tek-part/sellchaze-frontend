import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowLeft,
    HiOutlineDocumentDuplicate,
    HiOutlineDocumentText,
    HiOutlineFilm,
    HiOutlinePencilSquare,
    HiOutlinePhoto,
} from 'react-icons/hi2';
import api from '../../api/client';

function mediaTypeLabel(t, type) {
    if (type === 'image') return t('wavex_template_media_type_image');
    if (type === 'video') return t('wavex_template_media_type_video');
    if (type === 'document') return t('wavex_template_media_type_document');
    return '';
}

export default function WavexTemplateShowPage() {
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const { id } = useParams();
    const canAccessWavex = permissions.includes('wavex-access');

    const [tpl, setTpl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    const load = useCallback(async () => {
        setErr('');
        setLoading(true);
        try {
            const { data } = await api.get(`/wavex/templates/${id}`);
            setTpl(data?.data ?? data);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!canAccessWavex) return;
        void load();
    }, [load, canAccessWavex]);

    if (!canAccessWavex) return <Navigate to="/dashboard" replace />;

    if (loading) return <p className="p-6 text-sm text-slate-500">{t('loading')}</p>;

    if (!tpl) {
        return (
            <div className="p-6 text-center">
                <p className="text-sm text-red-600">{err || t('wavex_tpl_not_found')}</p>
                <Link to="/wavex/templates" className="mt-2 inline-block text-sm text-brand hover:underline">
                    {t('wavex_tpl_back_to_list')}
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/wavex/templates" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand">
                        <HiOutlineArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="border-s-4 border-brand ps-4">
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                            <HiOutlineDocumentDuplicate className="h-7 w-7 text-brand" aria-hidden />
                            {tpl.name}
                        </h1>
                    </div>
                </div>
                <Link
                    to={`/wavex/templates/${id}/edit`}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                    {t('wavex_template_edit')}
                </Link>
            </div>

            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}

            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
            >
                <div>
                    <h3 className="text-sm font-medium text-slate-500">{t('wavex_template_body_html')}</h3>
                    <div
                        className="prose prose-sm mt-2 max-w-none rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-slate-800"
                        dangerouslySetInnerHTML={{ __html: tpl.body_html || '' }}
                    />
                </div>

                <div>
                    <h3 className="text-sm font-medium text-slate-500">{t('wavex_template_whatsapp_plain_preview')}</h3>
                    <p className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-800">
                        {tpl.body || '\u2014'}
                    </p>
                </div>

                {tpl.media_url && tpl.media_type && (
                    <div>
                        <h3 className="mb-2 text-sm font-medium text-slate-500">
                            {t('wavex_template_attachment')}
                            <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {tpl.media_type === 'image' ? <HiOutlinePhoto className="h-3.5 w-3.5" /> :
                                 tpl.media_type === 'video' ? <HiOutlineFilm className="h-3.5 w-3.5" /> :
                                 <HiOutlineDocumentText className="h-3.5 w-3.5" />}
                                {mediaTypeLabel(t, tpl.media_type)}
                            </span>
                        </h3>
                        {tpl.media_type === 'image' && (
                            <img src={tpl.media_url} alt="" className="max-h-64 rounded-lg border border-slate-200 object-contain" />
                        )}
                        {tpl.media_type === 'video' && (
                            <video src={tpl.media_url} controls className="max-h-64 rounded-lg border border-slate-200" />
                        )}
                        {tpl.media_type === 'document' && (
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                <HiOutlineDocumentText className="h-8 w-8 shrink-0 text-slate-400" />
                                <span>{tpl.media_original_name || t('wavex_template_media_type_document')}</span>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
