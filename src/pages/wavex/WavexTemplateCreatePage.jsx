import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowLeft,
    HiOutlineDocumentDuplicate,
    HiOutlineDocumentText,
} from 'react-icons/hi2';
import api from '../../api/client';
import WavexTemplateBodyEditor from '../../components/wavex/WavexTemplateBodyEditor';

function htmlToPlain(html) {
    if (!html) return '';
    const d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent || d.innerText || '').trim();
}

function mediaTypeLabel(t, type) {
    if (type === 'image') return t('wavex_template_media_type_image');
    if (type === 'video') return t('wavex_template_media_type_video');
    if (type === 'document') return t('wavex_template_media_type_document');
    return '';
}

export default function WavexTemplateCreatePage() {
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const navigate = useNavigate();
    const canAccessWavex = permissions.includes('wavex-access');

    const [name, setName] = useState('');
    const [bodyHtml, setBodyHtml] = useState('<p></p>');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const plainPreview = useMemo(() => htmlToPlain(bodyHtml), [bodyHtml]);

    useEffect(() => {
        return () => {
            if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
        };
    }, [attachmentPreviewUrl]);

    function onPickFile(e) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setAttachmentFile(file);
        setAttachmentPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
    }

    function clearAttachment() {
        setAttachmentFile(null);
        setAttachmentPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErr('');
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', name);
            fd.append('body_html', bodyHtml);
            if (attachmentFile) fd.append('attachment', attachmentFile);
            const { data } = await api.post('/wavex/templates', fd);
            const id = data?.data?.id;
            navigate(id ? `/wavex/templates/${id}` : '/wavex/templates');
        } catch (e2) {
            const d = e2.response?.data;
            setErr(d?.message || d?.errors?.body_html?.[0] || d?.errors?.attachment?.[0] || d?.errors?.name?.[0] || e2.message);
        } finally {
            setSaving(false);
        }
    }

    if (!canAccessWavex) return <Navigate to="/dashboard" replace />;

    const previewIsVideo = attachmentFile?.type?.startsWith('video/');
    const previewIsImage = attachmentFile?.type?.startsWith('image/');

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
                <Link to="/wavex/templates" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand">
                    <HiOutlineArrowLeft className="h-5 w-5" />
                </Link>
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <HiOutlineDocumentDuplicate className="h-7 w-7 text-brand" aria-hidden />
                        {t('wavex_template_create')}
                    </h1>
                </div>
            </div>

            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}

            <motion.form
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
            >
                <div>
                    <label className="block text-sm font-medium text-slate-700">{t('wavex_template_name')}</label>
                    <input
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">{t('wavex_template_body_html')}</label>
                    <div className="mt-1">
                        <WavexTemplateBodyEditor
                            key="new-template"
                            initialHtml={bodyHtml}
                            onChange={setBodyHtml}
                            placeholder={t('wavex_template_editor_placeholder')}
                        />
                    </div>
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-700">{t('wavex_template_whatsapp_plain_preview')}</span>
                        <span className="mt-1 block whitespace-pre-wrap font-sans text-slate-800">
                            {plainPreview || '\u2014'}
                        </span>
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">{t('wavex_template_attachment')}</label>
                    <p className="mt-0.5 text-xs text-slate-500">{t('wavex_template_attachment_hint')}</p>
                    <input
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={onPickFile}
                        className="mt-2 block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-dark hover:file:bg-brand/20"
                    />
                    {attachmentFile && (
                        <div className="mt-3 flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                            <div className="min-w-0 flex-1">
                                {attachmentPreviewUrl && previewIsImage && (
                                    <img src={attachmentPreviewUrl} alt="" className="max-h-40 max-w-full rounded-lg object-contain" />
                                )}
                                {attachmentPreviewUrl && previewIsVideo && (
                                    <video src={attachmentPreviewUrl} controls className="max-h-48 max-w-full rounded-lg" />
                                )}
                                {!previewIsImage && !previewIsVideo && (
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <HiOutlineDocumentText className="h-8 w-8 shrink-0 text-slate-400" />
                                        <span className="truncate">{attachmentFile.name}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
                                    {mediaTypeLabel(t, previewIsImage ? 'image' : previewIsVideo ? 'video' : 'document')}
                                </span>
                                <button
                                    type="button"
                                    onClick={clearAttachment}
                                    className="text-xs font-semibold text-red-700 hover:underline"
                                >
                                    {t('wavex_template_remove_attachment')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                        {saving ? t('loading') : t('wavex_template_save')}
                    </button>
                    <Link
                        to="/wavex/templates"
                        className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        {t('cancel')}
                    </Link>
                </div>
            </motion.form>
        </div>
    );
}
