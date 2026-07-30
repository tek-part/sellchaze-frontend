import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineTrash, HiOutlineArrowUturnLeft, HiOutlinePaperAirplane } from 'react-icons/hi2';
import api from '../../api/client';
import { langParam } from '../../api/lang';
import { initials, relativeTime } from './helpers';

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

/** A single comment row, with an optional reply affordance and delete. */
function CommentRow({ comment, lang, t, onDelete, onReply, isReply = false }) {
    return (
        <div className={`flex gap-2.5 ${isReply ? 'ms-9' : ''}`}>
            <Avatar name={comment.author?.name} photo={comment.author?.photo} size={isReply ? 'h-7 w-7' : 'h-8 w-8'} />
            <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{comment.author?.name}</span>
                        <span className="text-[11px] text-slate-400">{relativeTime(comment.created_at, lang)}</span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">{comment.body}</p>
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
 * level of replies (grouped by parent_id), supports add / reply / delete, and reports
 * count changes back to the PostCard via onCountChange(delta).
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
        if (!window.confirm(t('feed_confirm_delete_comment', 'Delete this comment?'))) return;
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
                                    <CommentRow comment={c} lang={lang} t={t} onDelete={remove} onReply={setReplyTo} />
                                    {repliesOf(c.id).map((r) => (
                                        <CommentRow key={r.id} comment={r} lang={lang} t={t} onDelete={remove} isReply />
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
        </div>
    );
}
