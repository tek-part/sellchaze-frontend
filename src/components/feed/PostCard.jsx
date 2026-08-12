import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineHeart,
    HiHeart,
    HiOutlineChatBubbleOvalLeft,
    HiOutlineArrowUpTray,
    HiOutlineTrash,
    HiCheckBadge,
    HiOutlineBookmark,
    HiBookmark,
    HiOutlineNoSymbol,
    HiOutlineFlag,
    HiOutlineUserMinus,
} from 'react-icons/hi2';
import api from '../../api/client';
import { langParam } from '../../api/lang';
import { initials, relativeTime } from './helpers';
import CommentThread from './CommentThread';
import { trackFeedEvent } from '../../features/community/api/events';

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

const mediaKind = (source) => {
    const path = String(source).split(/[?#]/)[0].toLowerCase();
    if (/\.(mp4|webm|ogg|mov)$/.test(path)) return 'video';
    if (/\.(pdf|docx?|xlsx?|pptx?|zip|csv)$/.test(path)) return 'document';
    return 'image';
};

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
    const [saved, setSaved] = useState(!!post.saved);
    const [safetyBusy, setSafetyBusy] = useState(false);
    const [reaction, setReaction] = useState(post.reaction || null);
    const [reactionSummary, setReactionSummary] = useState(post.reaction_summary || {});
    const cardRef = useRef(null);

    useEffect(() => {
        const node = cardRef.current;
        if (!node || !('IntersectionObserver' in window)) return undefined;
        let startedAt = 0; let viewed = false;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                startedAt = Date.now(); trackFeedEvent(post.id, 'impression');
                setTimeout(() => { if (!viewed && startedAt) { viewed = true; trackFeedEvent(post.id, 'view_2s'); } }, 2000);
            } else if (startedAt) { trackFeedEvent(post.id, 'dwell', { value_ms: Date.now() - startedAt }); startedAt = 0; }
        }, { threshold: [0.5] });
        observer.observe(node);
        return () => { observer.disconnect(); if (startedAt) trackFeedEvent(post.id, 'dwell', { value_ms: Date.now() - startedAt }); };
    }, [post.id]);

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
            if (nextLiked) trackFeedEvent(post.id, 'like');
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
            trackFeedEvent(post.id, 'share');
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

    const toggleSave = async () => {
        const next = !saved;
        setSaved(next);
        try {
            if (next) await api.post(`/posts/${post.id}/save`);
            else await api.delete(`/posts/${post.id}/save`);
            if (next) trackFeedEvent(post.id, 'save');
        } catch { setSaved(!next); }
    };

    const safetyAction = async (type) => {
        if (!author.id || safetyBusy) return;
        setSafetyBusy(true);
        try {
            await api.post(`/users/${author.id}/${type}`);
            onDeleted?.(post.id);
        } finally { setSafetyBusy(false); }
    };

    const report = async () => {
        const details = window.prompt(t('feed_report_details', 'Describe the problem (optional)'));
        if (details === null) return;
        await api.post('/reports', { target_type: 'post', target_id: post.id, reason: 'spam', details });
    };

    const chooseReaction = async (type) => {
        try {
            const { data } = reaction === type ? await api.delete(`/posts/${post.id}/reaction`) : await api.post(`/posts/${post.id}/reaction`, { type });
            setReaction(data.reaction); setReactionSummary(data.summary || {});
        } catch { /* keep previous selection */ }
    };

    return (
        <article ref={cardRef} className="rounded-[22px] bg-white p-5 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80 transition-shadow hover:shadow-[0_16px_45px_-28px_rgba(15,23,42,.55)]">
            {/* Author header */}
            <header className="flex items-start gap-3">
                <Avatar name={author.name || author.company} photo={author.photo} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="truncate text-sm font-semibold text-slate-900">{post.acting_as?.type === 'organization' ? post.acting_as.name : author.name}</span>
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

            {post.location_name ? <p className="mt-2 text-xs font-medium text-slate-500">📍 {post.location_name}</p> : null}

            {Array.isArray(post.media) && post.media.length > 0 ? (
                <div className={`mt-4 grid overflow-hidden rounded-2xl bg-slate-950 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1`}>
                    {post.media.map((media) => media.kind === 'video'
                        ? <video key={media.id} src={media.variants?.web?.url || media.url} poster={media.variants?.poster?.url} controls preload="metadata" playsInline className="max-h-[560px] w-full bg-black object-contain" />
                        : media.kind === 'document'
                            ? <a key={media.id} href={media.url} target="_blank" rel="noreferrer" className="flex min-h-32 items-center justify-center bg-blue-50 p-6 text-sm font-bold text-blue-700">فتح {media.name || 'المستند'}</a>
                            : <img key={media.id} src={media.url} alt={media.alt_text || ''} loading="lazy" decoding="async" className="max-h-[560px] w-full object-cover" />)}
                </div>
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

            {/* Image, video and document attachments */}
            {Array.isArray(post.attachments) && post.attachments.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {post.attachments.map((src, i) => mediaKind(src) === 'video'
                        ? <video key={i} src={src} controls preload="metadata" className="h-32 w-full rounded-xl bg-black object-cover ring-1 ring-slate-200" />
                        : mediaKind(src) === 'document'
                            ? <a key={i} href={src} target="_blank" rel="noreferrer" className="flex h-32 items-center justify-center rounded-xl bg-slate-50 p-3 text-center text-xs font-semibold text-brand ring-1 ring-slate-200">{decodeURIComponent(String(src).split('/').pop()?.split('?')[0] || 'Open document')}</a>
                            : <img key={i} src={src} alt="" loading="lazy" decoding="async" className="h-32 w-full rounded-xl object-cover ring-1 ring-slate-200" />)}
                </div>
            ) : null}

            {post.cta ? <a href={post.cta.url || '#'} target={post.cta.url ? '_blank' : undefined} rel="noreferrer" className="mt-3 flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">{post.cta.label || (post.cta.type === 'request_quote' ? 'طلب عرض سعر' : 'تواصل الآن')}</a> : null}

            <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="تفاعلات المنشور">
                {Object.entries({ celebrate: ['👏', 'أحسنت'], insightful: ['💡', 'مفيد'], support: ['🤝', 'دعم'], interested: ['🎯', 'مهتم'] }).map(([type, [icon, label]]) => <button key={type} type="button" onClick={() => chooseReaction(type)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${reaction === type ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{icon} {label}{reactionSummary[type] ? ` ${reactionSummary[type]}` : ''}</button>)}
            </div>

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
                <button type="button" onClick={toggleSave} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${saved ? 'text-brand' : 'text-slate-600'}`}>{saved ? <HiBookmark className="h-5 w-5" /> : <HiOutlineBookmark className="h-5 w-5" />}<span className="hidden sm:inline">{t('feed_save', 'Save')}</span></button>
                {!post.can_delete && <div className="ms-auto flex items-center"><button type="button" disabled={safetyBusy} onClick={() => safetyAction('mute')} title={t('feed_mute', 'Mute')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><HiOutlineNoSymbol className="h-5 w-5" /></button><button type="button" disabled={safetyBusy} onClick={() => safetyAction('block')} title={t('feed_block', 'Block')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><HiOutlineUserMinus className="h-5 w-5" /></button><button type="button" onClick={report} title={t('feed_report', 'Report')} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><HiOutlineFlag className="h-5 w-5" /></button></div>}
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

            {showComments && post.comments_enabled !== false ? (
                <CommentThread
                    postId={post.id}
                    onCountChange={(delta) => setCounts((c) => ({ ...c, comments: Math.max(0, (c.comments ?? 0) + delta) }))}
                />
            ) : null}
        </article>
    );
}
