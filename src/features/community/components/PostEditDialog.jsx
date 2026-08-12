import { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { HiOutlinePencilSquare, HiOutlineXMark } from 'react-icons/hi2';
import api from '../../../api/client';
import notify from '../../../components/ui/notify';
import { extractHashtags } from '../social/socialText';

const QUILL_MODULES = {
    toolbar: [['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']],
};

/**
 * Edit an existing post: body, audience and comment permission — the fields a
 * member actually revisits. PATCHes /posts/{id} and hands the fully hydrated
 * card back through onUpdated so the open card refreshes in place.
 */
export default function PostEditDialog({ post, open, onClose, onUpdated }) {
    const { t } = useTranslation();
    const [body, setBody] = useState(post.body || '');
    const [audience, setAudience] = useState(post.audience === 'group' ? 'group' : post.audience || 'public');
    const [commentsEnabled, setCommentsEnabled] = useState(post.comments_enabled !== false);
    const [busy, setBusy] = useState(false);

    // Re-seed whenever a different post opens in the dialog.
    useEffect(() => {
        if (open) {
            setBody(post.body || '');
            setAudience(post.audience === 'group' ? 'group' : post.audience || 'public');
            setCommentsEnabled(post.comments_enabled !== false);
        }
    }, [open, post]);

    const submit = async (event) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
            const payload = { body, comments_enabled: commentsEnabled };
            if (audience !== 'group') payload.audience = audience;
            const hashtags = extractHashtags(body);
            if (hashtags.length) payload.hashtags = hashtags;
            const { data } = await api.patch(`/posts/${post.id}`, payload);
            notify.success(t('post_updated_toast', 'Post updated'));
            onUpdated?.(data.data);
            onClose?.();
        } catch (error) {
            notify.error(t('toast_failed', 'Something went wrong'), error?.response?.data?.message || '');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => onClose?.()} className="relative z-[90]">
            <DialogBackdrop transition className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition duration-200 data-closed:opacity-0" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel
                    transition
                    className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200/80 transition duration-200 data-closed:scale-95 data-closed:opacity-0"
                >
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                                <HiOutlinePencilSquare className="h-5 w-5" aria-hidden />
                            </span>
                            {t('post_edit', 'Edit post')}
                        </DialogTitle>
                        <button type="button" onClick={() => onClose?.()} aria-label={t('action_cancel', 'Cancel')} className="sc-press rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
                            <HiOutlineXMark className="h-5 w-5" aria-hidden />
                        </button>
                    </div>

                    <form onSubmit={submit} className="mt-4 space-y-4">
                        <style>{`.edit-quill .ql-toolbar{border-top-left-radius:.75rem;border-top-right-radius:.75rem;border-color:rgb(226 232 240);background:rgb(248 250 252)}.edit-quill .ql-container{border-bottom-left-radius:.75rem;border-bottom-right-radius:.75rem;border-color:rgb(226 232 240);font-family:inherit}.edit-quill .ql-editor{min-height:110px;font-size:.95rem}`}</style>
                        <div className="edit-quill">
                            <ReactQuill theme="snow" value={body} onChange={setBody} modules={QUILL_MODULES} />
                        </div>

                        {audience !== 'group' ? (
                            <label className="block text-xs font-bold text-slate-600">
                                {t('composer_audience', 'Audience')}
                                <select value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                                    <option value="public">{t('composer_audience_public', 'Everyone')}</option>
                                    <option value="followers">{t('composer_audience_followers', 'Followers')}</option>
                                    <option value="sector">{t('composer_audience_sector', 'My sector')}</option>
                                </select>
                            </label>
                        ) : null}

                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <input type="checkbox" checked={commentsEnabled} onChange={(event) => setCommentsEnabled(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand" />
                            {t('composer_allow_comments', 'Allow comments')}
                        </label>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => onClose?.()} className="sc-press rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200/70">
                                {t('action_cancel', 'Cancel')}
                            </button>
                            <button type="submit" disabled={busy} className="sc-press rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-50">
                                {busy ? t('profile_saving', 'Saving…') : t('profile_save', 'Save changes')}
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
