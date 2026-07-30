import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineHeart,
    HiHeart,
    HiOutlineChatBubbleOvalLeft,
    HiOutlineArrowUpTray,
    HiOutlineTrash,
    HiCheckBadge,
} from 'react-icons/hi2';
import api from '../../api/client';
import { langParam } from '../../api/lang';
import { initials, relativeTime } from './helpers';
import CommentThread from './CommentThread';

/** Author avatar — photo or initials. */
function Avatar({ name, photo }) {
    if (photo) {
        return <img src={photo} alt="" loading="lazy" decoding="async" className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />;
    }
    return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand ring-1 ring-brand/15">
            {initials(name)}
        </div>
    );
}

/**
 * One post in the feed. Owns its own like/comment/share/delete state so the parent
 * list only needs to remove the card when deleted (via onDeleted).
 */
export default function PostCard({ post, onDeleted }) {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [liked, setLiked] = useState(!!post.liked);
    const [counts, setCounts] = useState(post.counts ?? { likes: 0, comments: 0, shares: 0 });
    const [showComments, setShowComments] = useState(false);
    const [likeBusy, setLikeBusy] = useState(false);
    const [shareBusy, setShareBusy] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const author = post.author ?? {};
    const typeLabel = t(`feed_type_${post.type}`, post.type);

    const toggleLike = async () => {
        if (likeBusy) return;
        setLikeBusy(true);
        // Optimistic flip.
        const nextLiked = !liked;
        setLiked(nextLiked);
        setCounts((c) => ({ ...c, likes: Math.max(0, (c.likes ?? 0) + (nextLiked ? 1 : -1)) }));
        try {
            const { data } = nextLiked
                ? await api.post(`/posts/${post.id}/like`)
                : await api.delete(`/posts/${post.id}/like`);
            // Reconcile with the server's authoritative count/flag.
            if (data && typeof data.likes_count === 'number') {
                setCounts((c) => ({ ...c, likes: data.likes_count }));
            }
            if (data && typeof data.liked === 'boolean') setLiked(data.liked);
        } catch {
            // Revert on failure.
            setLiked(!nextLiked);
            setCounts((c) => ({ ...c, likes: Math.max(0, (c.likes ?? 0) + (nextLiked ? -1 : 1)) }));
        } finally {
            setLikeBusy(false);
        }
    };

    const share = async () => {
        if (shareBusy) return;
        setShareBusy(true);
        try {
            const caption = window.prompt(t('feed_share_caption_prompt', 'Add a caption (optional)'));
            // A null return means the user cancelled the prompt — abort the share.
            if (caption === null) {
                setShareBusy(false);
                return;
            }
            const { data } = await api.post(`/posts/${post.id}/share`, caption ? { caption } : {});
            if (data && typeof data.shares_count === 'number') {
                setCounts((c) => ({ ...c, shares: data.shares_count }));
            } else {
                setCounts((c) => ({ ...c, shares: (c.shares ?? 0) + 1 }));
            }
        } catch {
            /* no-op; count stays as-is */
        } finally {
            setShareBusy(false);
        }
    };

    const remove = async () => {
        if (deleting) return;
        if (!window.confirm(t('feed_confirm_delete_post', 'Delete this post?'))) return;
        setDeleting(true);
        try {
            await api.delete(`/posts/${post.id}`);
            onDeleted?.(post.id);
        } catch {
            setDeleting(false);
        }
    };

    return (
        <article className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
            {/* Author header */}
            <header className="flex items-start gap-3">
                <Avatar name={author.name || author.company} photo={author.photo} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="truncate text-sm font-semibold text-slate-900">{author.name}</span>
                        {author.is_verified ? (
                            <HiCheckBadge className="h-4 w-4 shrink-0 text-brand" title={t('feed_verified', 'Verified')} aria-label={t('feed_verified', 'Verified')} />
                        ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
                        {author.company ? <span className="truncate">{author.company}</span> : null}
                        <span className="text-slate-300" aria-hidden>·</span>
                        <span>{relativeTime(post.created_at, lang)}</span>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    {post.sector ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            {post.sector.name}
                        </span>
                    ) : null}
                    <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                        {typeLabel}
                    </span>
                </div>
            </header>

            {/* Body (HTML from the rich editor) */}
            {post.body ? (
                <div
                    className="prose prose-sm mt-3 max-w-none break-words text-slate-700 prose-p:my-1.5 prose-a:text-brand prose-headings:text-slate-900"
                    dangerouslySetInnerHTML={{ __html: post.body }}
                />
            ) : null}

            {/* Attached product mini-card */}
            {post.product ? (
                (() => {
                    const inner = (
                        <>
                            {post.product.image ? (
                                <img src={post.product.image} alt="" loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
                            ) : (
                                <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 ring-1 ring-slate-200" />
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{post.product.name}</p>
                                <p className="text-[11px] text-slate-400">{t('col_product', 'Product')}</p>
                            </div>
                        </>
                    );
                    const cls = 'mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5';
                    return author.username ? (
                        <Link to={`/u/${author.username}`} className={`${cls} transition hover:bg-slate-100`}>
                            {inner}
                        </Link>
                    ) : (
                        <div className={cls}>{inner}</div>
                    );
                })()
            ) : null}

            {/* Attachment images */}
            {Array.isArray(post.attachments) && post.attachments.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {post.attachments.map((src, i) => (
                        <img key={i} src={src} alt="" loading="lazy" decoding="async" className="h-32 w-full rounded-xl object-cover ring-1 ring-slate-200" />
                    ))}
                </div>
            ) : null}

            {/* Action row */}
            <footer className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3">
                <button
                    type="button"
                    onClick={toggleLike}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50 ${
                        liked ? 'text-red-600' : 'text-slate-600'
                    }`}
                >
                    {liked ? <HiHeart className="h-5 w-5" aria-hidden /> : <HiOutlineHeart className="h-5 w-5" aria-hidden />}
                    <span>{t('feed_like', 'Like')}</span>
                    {counts.likes ? <span className="text-xs text-slate-400">{counts.likes}</span> : null}
                </button>
                <button
                    type="button"
                    onClick={() => setShowComments((v) => !v)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50 ${
                        showComments ? 'text-brand' : 'text-slate-600'
                    }`}
                >
                    <HiOutlineChatBubbleOvalLeft className="h-5 w-5" aria-hidden />
                    <span>{t('feed_comment', 'Comment')}</span>
                    {counts.comments ? <span className="text-xs text-slate-400">{counts.comments}</span> : null}
                </button>
                <button
                    type="button"
                    onClick={share}
                    disabled={shareBusy}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                    <HiOutlineArrowUpTray className="h-5 w-5" aria-hidden />
                    <span>{t('feed_share', 'Share')}</span>
                    {counts.shares ? <span className="text-xs text-slate-400">{counts.shares}</span> : null}
                </button>
                {post.can_delete ? (
                    <button
                        type="button"
                        onClick={remove}
                        disabled={deleting}
                        className="ms-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                        <HiOutlineTrash className="h-5 w-5" aria-hidden />
                        <span className="hidden sm:inline">{t('feed_delete', 'Delete')}</span>
                    </button>
                ) : null}
            </footer>

            {showComments ? (
                <CommentThread
                    postId={post.id}
                    onCountChange={(delta) => setCounts((c) => ({ ...c, comments: Math.max(0, (c.comments ?? 0) + delta) }))}
                />
            ) : null}
        </article>
    );
}
