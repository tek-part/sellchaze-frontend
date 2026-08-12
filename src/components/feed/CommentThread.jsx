import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineTrash, HiOutlineArrowUturnLeft, HiOutlineFlag, HiOutlinePaperAirplane, HiOutlinePencilSquare } from 'react-icons/hi2';
import api from '../../api/client';
import { langParam } from '../../api/lang';
import { initials, relativeTime } from './helpers';
import { confirmDialog } from '../ui/confirmDialog';
import notify from '../ui/notify';
import ReportDialog from '../../features/community/components/ReportDialog';

/** Small round avatar (photo or initials) used for comment authors. */
function Avatar({ name, photo, size = 'h-8 w-8' }) {
    if (photo) {
        return <img src={photo} alt="" loading="lazy" decoding="async" className={`${size} shrink-0 rounded-full object-cover ring-1 ring-slate-200`} />;
    }
    return (
        <div className={`${size} flex shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand ring-1 ring-brand/15`}>
            {initials(name)}
        </div>
    );
}

/**
 * A single comment row. The author can edit in place; the viewer can reply,
 * report someone else's comment, and delete their own (or, as the post owner,
 * anyone's — the server has always allowed it, the flag now says so).
 */
function CommentRow({ comment, lang, t, onDelete, onReply, onReport, onSaveEdit, isReply = false }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(comment.body);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        const text = draft.trim();
        if (!text || saving) return;
        setSaving(true);
        const ok = await onSaveEdit(comment, text);
        setSaving(false);
        if (ok) setEditing(false);
    };

    const roleLabel = comment.author?.role ? t(`role_${comment.author.role}`, comment.author.role) : null;

    return (
        <div className={`flex gap-2.5 ${isReply ? 'ms-9' : ''}`}>
            {comment.author?.username ? (
                <Link to={`/community/u/${comment.author.username}`} className="shrink-0">
                    <Avatar name={comment.author?.name} photo={comment.author?.photo} size={isReply ? 'h-7 w-7' : 'h-8 w-8'} />
                </Link>
            ) : (
                <Avatar name={comment.author?.name} photo={comment.author?.photo} size={isReply ? 'h-7 w-7' : 'h-8 w-8'} />
            )}
            <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                    <div className="flex flex-wrap items-center gap-x-2">
                        {comment.author?.username ? (
                            <Link to={`/community/u/${comment.author.username}`} className="truncate text-sm font-semibold text-slate-900 hover:underline">
                                {comment.author?.name}
                            </Link>
                        ) : (
                            <span className="truncate text-sm font-semibold text-slate-900">{comment.author?.name}</span>
                        )}
                        {roleLabel ? <span className="text-[10px] font-bold text-slate-400">{roleLabel}</span> : null}
                        <span className="text-[11px] text-slate-400">{relativeTime(comment.created_at, lang)}</span>
                        {comment.edited_at ? <span className="text-[10px] italic text-slate-400">{t('comment_edited', 'Edited')}</span> : null}
                    </div>

                    {editing ? (
                        <div className="mt-1.5">
                            <textarea
                                rows={2}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                maxLength={5000}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                            <div className="mt-1 flex gap-2">
                                <button type="button" onClick={save} disabled={saving || !draft.trim()} className="sc-press rounded-lg bg-brand px-3 py-1 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-50">
                                    {t('comment_save', 'Save')}
                                </button>
                                <button type="button" onClick={() => { setEditing(false); setDraft(comment.body); }} className="sc-press rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-200/70">
                                    {t('action_cancel', 'Cancel')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">{comment.body}</p>
                    )}
                </div>

                <div className="mt-1 flex items-center gap-3 ps-1">
                    {!isReply && onReply ? (
                        <button
                            type="button"
                            onClick={() => onReply(comment)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand"
                        >
                            <HiOutlineArrowUturnLeft className="h-3.5 w-3.5" aria-hidden /> {t('feed_reply', 'Reply')}
                        </button>
                    ) : null}
                    {comment.can_edit && !editing ? (
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand"
                        >
                            <HiOutlinePencilSquare className="h-3.5 w-3.5" aria-hidden /> {t('comment_edit', 'Edit')}
                        </button>
                    ) : null}
                    {!comment.can_edit ? (
                        <button
                            type="button"
                            onClick={() => onReport(comment)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-600"
                        >
                            <HiOutlineFlag className="h-3.5 w-3.5" aria-hidden /> {t('comment_report', 'Report')}
                        </button>
                    ) : null}
                    {comment.can_delete ? (
                        <button
                            type="button"
                            onClick={() => onDelete(comment)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-600"
                        >
                            <HiOutlineTrash className="h-3.5 w-3.5" aria-hidden /> {t('feed_delete', 'Delete')}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

/**
 * Lazy comment thread for a post. Loads comments when first opened, renders a single
 * level of replies (grouped by parent_id), supports add / reply / edit / report /
 * delete, and reports count changes back to the PostCard via onCountChange(delta).
 */
export default function CommentThread({ postId, onCountChange }) {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [body, setBody] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setErr('');
        api.get(`/posts/${postId}/comments`)
            .then(({ data }) => {
                if (alive) setComments(data.data ?? []);
            })
            .catch((e) => {
                if (alive) setErr(e.response?.data?.message || e.message);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [postId]);

    const roots = comments.filter((c) => !c.parent_id);
    const repliesOf = (id) => comments.filter((c) => c.parent_id === id);

    const submit = async (e) => {
        e.preventDefault();
        const text = body.trim();
        if (!text || submitting) return;
        setSubmitting(true);
        setErr('');
        try {
            const payload = { body: text };
            if (replyTo) payload.parent_id = replyTo.id;
            const { data } = await api.post(`/posts/${postId}/comments`, payload);
            setComments((prev) => [...prev, data.data]);
            setBody('');
            setReplyTo(null);
            onCountChange?.(1);
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async (comment) => {
        const ok = await confirmDialog({
            title: t('feed_confirm_delete_comment', 'Delete this comment?'),
            danger: true,
        });
        if (!ok) return;
        try {
            await api.delete(`/posts/${postId}/comments/${comment.id}`);
            // Drop the comment and any of its replies.
            const removedIds = new Set([comment.id, ...repliesOf(comment.id).map((r) => r.id)]);
            setComments((prev) => prev.filter((c) => !removedIds.has(c.id)));
            onCountChange?.(-removedIds.size);
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        }
    };

    const saveEdit = async (comment, text) => {
        try {
            const { data } = await api.patch(`/posts/${postId}/comments/${comment.id}`, { body: text });
            setComments((prev) => prev.map((c) => (c.id === comment.id ? data.data : c)));
            return true;
        } catch (error) {
            notify.error(t('toast_failed', 'Something went wrong'), error?.response?.data?.message || '');
            return false;
        }
    };

    const rowProps = {
        lang,
        t,
        onDelete: remove,
        onReport: (comment) => setReportTarget({ type: 'comment', id: comment.id }),
        onSaveEdit: saveEdit,
    };

    return (
        <div className="mt-3 border-t border-slate-100 pt-3">
            {loading ? (
                <p className="py-2 text-center text-sm text-slate-400">{t('loading', 'Loading…')}</p>
            ) : (
                <>
                    {roots.length === 0 ? (
                        <p className="py-2 text-center text-sm text-slate-400">{t('feed_no_comments', 'No comments yet')}</p>
                    ) : (
                        <div className="space-y-3">
                            {roots.map((c) => (
                                <div key={c.id} className="space-y-2">
                                    <CommentRow comment={c} onReply={setReplyTo} {...rowProps} />
                                    {repliesOf(c.id).map((r) => (
                                        <CommentRow key={r.id} comment={r} isReply {...rowProps} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}

                    <form onSubmit={submit} className="mt-3 space-y-1.5">
                        {replyTo ? (
                            <div className="flex items-center justify-between rounded-lg bg-brand/5 px-2.5 py-1 text-[11px] text-slate-500">
                                <span className="truncate">
                                    {t('feed_reply', 'Reply')} → {replyTo.author?.name}
                                </span>
                                <button type="button" onClick={() => setReplyTo(null)} className="font-semibold text-slate-400 hover:text-slate-700">
                                    ×
                                </button>
                            </div>
                        ) : null}
                        <div className="flex items-end gap-2">
                            <textarea
                                rows={1}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder={t('feed_write_comment', 'Write a comment…')}
                                className="max-h-32 min-h-[40px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-hidden transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                            />
                            <button
                                type="submit"
                                disabled={submitting || !body.trim()}
                                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-50"
                            >
                                <HiOutlinePaperAirplane className="h-4 w-4 rtl:rotate-180" aria-hidden />
                                <span className="hidden sm:inline">{t('feed_send', 'Send')}</span>
                            </button>
                        </div>
                    </form>
                </>
            )}

            <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} />
        </div>
    );
}
