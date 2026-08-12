import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
    HiOutlineHeart,
    HiHeart,
    HiOutlineChatBubbleOvalLeft,
    HiOutlineArrowUpTray,
    HiOutlineArrowPathRoundedSquare,
    HiOutlineArchiveBox,
    HiOutlineTrash,
    HiCheckBadge,
    HiOutlineBookmark,
    HiBookmark,
    HiOutlineLink,
    HiOutlineNoSymbol,
    HiOutlineFlag,
    HiOutlinePencilSquare,
    HiOutlineUserMinus,
    HiOutlineEllipsisHorizontal,
    HiOutlineMapPin,
    HiOutlineDocumentText,
} from 'react-icons/hi2';
import api from '../../api/client';
import { langParam } from '../../api/lang';
import notify from '../ui/notify';
import { confirmDialog } from '../ui/confirmDialog';
import { initials, relativeTime } from './helpers';
import CommentThread from './CommentThread';
import MediaCarousel from '../../features/community/components/MediaCarousel';
import Lightbox from '../../features/community/components/Lightbox';
import ReportDialog from '../../features/community/components/ReportDialog';
import PostEditDialog from '../../features/community/components/PostEditDialog';
import ReactionsDialog from '../../features/community/components/ReactionsDialog';
import { decorateSocialHtml } from '../../features/community/social/socialText';
import { trackFeedEvent } from '../../features/community/api/events';

/** The four business reactions, offered from the picker above the Like button. */
const REACTIONS = [
    { type: 'celebrate', emoji: '👏', labelKey: 'feed_react_celebrate' },
    { type: 'insightful', emoji: '💡', labelKey: 'feed_react_insightful' },
    { type: 'support', emoji: '🤝', labelKey: 'feed_react_support' },
    { type: 'interested', emoji: '🎯', labelKey: 'feed_react_interested' },
];

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

/** Shared shape for the four controls in the action bar. */
const ACTION_CLASS =
    'sc-press inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition hover:bg-slate-50';

/**
 * One post in the feed. Owns its own like/reaction/comment/share/delete state so
 * the parent list only needs to remove the card when deleted (via onDeleted).
 *
 * Interaction model follows the one members already know from social apps:
 * clicking the primary button likes the post, hovering (or focusing) it opens a
 * picker for the four business reactions. Everything destructive or rare —
 * mute, block, report, delete — lives behind the overflow menu in the header,
 * which keeps the action bar down to the four things people actually do.
 */
export default function PostCard({ post: postProp, onDeleted, index = 0 }) {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    // An in-place edit (PATCH) hands back a fresh card; it overrides the prop
    // until the parent list reloads.
    const [override, setOverride] = useState(null);
    const post = override ?? postProp;

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
    const [pickerOpen, setPickerOpen] = useState(false);
    const [burst, setBurst] = useState(false);
    const [lightboxAt, setLightboxAt] = useState(null); // image index | null
    const [reportTarget, setReportTarget] = useState(null); // ReportDialog control
    const [editOpen, setEditOpen] = useState(false);
    const [repostOpen, setRepostOpen] = useState(false);
    const [repostCaption, setRepostCaption] = useState('');
    const [reactionsOpen, setReactionsOpen] = useState(false);
    const [bodyExpanded, setBodyExpanded] = useState(false);
    const [bodyOverflows, setBodyOverflows] = useState(false);
    const bodyRef = useRef(null);
    const cardRef = useRef(null);
    const pickerTimer = useRef(null);

    useEffect(() => {
        const node = cardRef.current;
        if (!node || !('IntersectionObserver' in window)) return undefined;
        let startedAt = 0; let viewed = false;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                startedAt = Date.now(); trackFeedEvent(post.id, 'impression');
                setTimeout(() => { if (!viewed && startedAt) { viewed = true; trackFeedEvent(post.id, 'view_2s'); } }, 2000);
            } else {
                // A video must not keep talking off-screen: the moment the card
                // scrolls (mostly) out of view, everything playing inside stops.
                node.querySelectorAll('video').forEach((video) => { if (!video.paused) video.pause(); });
                if (startedAt) { trackFeedEvent(post.id, 'dwell', { value_ms: Date.now() - startedAt }); startedAt = 0; }
            }
        }, { threshold: [0.5] });
        observer.observe(node);
        return () => { observer.disconnect(); if (startedAt) trackFeedEvent(post.id, 'dwell', { value_ms: Date.now() - startedAt }); };
    }, [post.id]);

    // The picker must not vanish while the pointer travels from the button to it.
    useEffect(() => () => clearTimeout(pickerTimer.current), []);

    // Show the "more" toggle only when the clamped body actually overflows.
    useEffect(() => {
        const node = bodyRef.current;
        if (!node || bodyExpanded) return;
        setBodyOverflows(node.scrollHeight > node.clientHeight + 2);
    }, [post.body, bodyExpanded]);

    const openPicker = () => {
        clearTimeout(pickerTimer.current);
        setPickerOpen(true);
    };

    const closePicker = () => {
        clearTimeout(pickerTimer.current);
        pickerTimer.current = setTimeout(() => setPickerOpen(false), 220);
    };

    const author = post.author ?? {};
    const typeLabel = t(`feed_type_${post.type}`, post.type);
    const activeReaction = REACTIONS.find((r) => r.type === reaction) ?? null;

    const reactionTotal = Object.values(reactionSummary).reduce((sum, n) => sum + (Number(n) || 0), 0);
    const responses = (counts.likes ?? 0) + reactionTotal;
    const topReactions = REACTIONS.filter((r) => (reactionSummary[r.type] ?? 0) > 0).slice(0, 3);

    const celebrate = () => {
        setBurst(true);
        setTimeout(() => setBurst(false), 480);
    };

    const toggleLike = async () => {
        if (likeBusy) return;
        setLikeBusy(true);
        // Optimistic flip.
        const nextLiked = !liked;
        setLiked(nextLiked);
        if (nextLiked) celebrate();
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

    const postUrl = () => `${window.location.origin}/community/post/${post.id}`;

    const recordShare = async (caption) => {
        if (shareBusy) return;
        setShareBusy(true);
        try {
            const { data } = await api.post(`/posts/${post.id}/share`, caption ? { caption } : {});
            if (data && typeof data.shares_count === 'number') {
                setCounts((c) => ({ ...c, shares: data.shares_count }));
            } else {
                setCounts((c) => ({ ...c, shares: (c.shares ?? 0) + 1 }));
            }
            trackFeedEvent(post.id, 'share');
            notify.success(t('share_done', 'Shared'));
        } catch (error) {
            notify.error(t('toast_failed', 'Something went wrong'), error?.response?.data?.message || '');
        } finally {
            setShareBusy(false);
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(postUrl());
            notify.success(t('reels_link_copied', 'Link copied'));
        } catch {
            notify.error(t('toast_failed', 'Something went wrong'));
        }
    };

    const shareVia = async () => {
        try {
            await navigator.share({ url: postUrl() });
            recordShare('');
        } catch {
            /* member dismissed the sheet */
        }
    };

    const submitRepost = async (event) => {
        event.preventDefault();
        await recordShare(repostCaption.trim());
        setRepostCaption('');
        setRepostOpen(false);
    };

    const toggleArchive = async () => {
        const archived = post.lifecycle_status === 'archived';
        const ok = await confirmDialog({
            title: archived ? t('post_unarchive_confirm', 'Unarchive this post?') : t('post_archive_confirm', 'Archive this post?'),
            text: archived ? t('post_unarchive_hint', 'It becomes visible to its audience again.') : t('post_archive_hint', 'Only you will see it, under the Archive tab of your profile.'),
            danger: false,
            icon: 'question',
        });
        if (!ok) return;
        try {
            await api.patch(`/posts/${post.id}`, { lifecycle_status: archived ? 'published' : 'archived' });
            notify.success(archived ? t('post_unarchived_toast', 'Post is live again') : t('post_archived_toast', 'Post archived'));
            onDeleted?.(post.id); // leaves whichever list it no longer belongs to
        } catch (error) {
            notify.error(t('toast_failed', 'Something went wrong'), error?.response?.data?.message || '');
        }
    };

    const remove = async () => {
        if (deleting) return;
        const ok = await confirmDialog({
            title: t('feed_confirm_delete_post', 'Delete this post?'),
            text: t('feed_confirm_delete_post_hint', 'This cannot be undone.'),
            danger: true,
        });
        if (!ok) return;
        setDeleting(true);
        try {
            await api.delete(`/posts/${post.id}`);
            notify.success(t('toast_post_deleted', 'Post deleted'));
            onDeleted?.(post.id);
        } catch (error) {
            setDeleting(false);
            notify.error(t('toast_failed', 'Something went wrong'), error?.response?.data?.message || t('toast_failed_hint', 'Please try again.'));
        }
    };

    const toggleSave = async () => {
        const next = !saved;
        setSaved(next);
        try {
            if (next) await api.post(`/posts/${post.id}/save`);
            else await api.delete(`/posts/${post.id}/save`);
            if (next) {
                trackFeedEvent(post.id, 'save');
                notify.success(t('toast_saved', 'Saved'), t('toast_saved_hint', 'Find it under Saved posts.'));
            } else {
                notify.info(t('toast_unsaved', 'Removed from saved'));
            }
        } catch {
            setSaved(!next);
            notify.error(t('toast_failed', 'Something went wrong'), t('toast_failed_hint', 'Please try again.'));
        }
    };

    const safetyAction = async (type) => {
        if (!author.id || safetyBusy) return;
        setSafetyBusy(true);
        try {
            await api.post(`/users/${author.id}/${type}`);
            if (type === 'mute') notify.success(t('toast_muted', 'Muted'), t('toast_muted_hint', 'Their posts will stay out of your feed.'));
            else notify.success(t('toast_blocked', 'Blocked'));
            onDeleted?.(post.id);
        } catch {
            notify.error(t('toast_failed', 'Something went wrong'), t('toast_failed_hint', 'Please try again.'));
        } finally { setSafetyBusy(false); }
    };

    const report = () => setReportTarget({ type: 'post', id: post.id });

    const chooseReaction = async (type) => {
        clearTimeout(pickerTimer.current);
        setPickerOpen(false);
        const removing = reaction === type;
        if (!removing) celebrate();
        try {
            const { data } = removing
                ? await api.delete(`/posts/${post.id}/reaction`)
                : await api.post(`/posts/${post.id}/reaction`, { type });
            setReaction(data.reaction); setReactionSummary(data.summary || {});
        } catch { /* keep previous selection */ }
    };

    const media = Array.isArray(post.media) ? post.media : [];

    return (
        <article
            ref={cardRef}
            style={{ '--sc-delay': `${Math.min(index, 6) * 55}ms` }}
            className="sc-rise rounded-2xl bg-white shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80 transition-shadow hover:shadow-[0_16px_45px_-28px_rgba(15,23,42,.55)]"
        >
            {/* Author header — the photo and the name both open the profile. */}
            <header className="flex items-start gap-3 px-5 pt-5">
                {author.username ? (
                    <Link to={`/community/u/${author.username}`} aria-label={author.name || author.company} className="shrink-0">
                        <Avatar name={author.name || author.company} photo={author.photo} />
                    </Link>
                ) : (
                    <Avatar name={author.name || author.company} photo={author.photo} />
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-1.5">
                        {author.username ? (
                            <Link to={`/community/u/${author.username}`} className="truncate text-sm font-bold text-slate-900 hover:underline">
                                {post.acting_as?.type === 'organization' ? post.acting_as.name : author.name}
                            </Link>
                        ) : (
                            <span className="truncate text-sm font-bold text-slate-900">
                                {post.acting_as?.type === 'organization' ? post.acting_as.name : author.name}
                            </span>
                        )}
                        {author.is_verified ? (
                            <HiCheckBadge className="h-4 w-4 shrink-0 text-brand" title={t('feed_verified', 'Verified')} aria-label={t('feed_verified', 'Verified')} />
                        ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-slate-500">
                        {/* The member's type leads the meta row — supplier or merchant, not just "member". */}
                        {author.role ? (
                            <>
                                <span className="font-semibold text-slate-600">{t(`role_${author.role}`, author.role)}</span>
                                <span className="text-slate-300" aria-hidden>·</span>
                            </>
                        ) : null}
                        <span>{relativeTime(post.created_at, lang)}</span>
                        {post.edited_at ? (
                            <>
                                <span className="text-slate-300" aria-hidden>·</span>
                                <span className="italic text-slate-400">{t('post_edited', 'Edited')}</span>
                            </>
                        ) : null}
                        <span className="text-slate-300" aria-hidden>·</span>
                        <span className="font-semibold text-brand">{typeLabel}</span>
                        {post.sector ? (
                            <>
                                <span className="text-slate-300" aria-hidden>·</span>
                                <span className="truncate">{post.sector.name}</span>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Everything rare or destructive lives here, not in the action bar. */}
                <Menu as="div" className="relative shrink-0">
                    <MenuButton
                        className="sc-press rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={t('feed_more_actions', 'More actions')}
                    >
                        <HiOutlineEllipsisHorizontal className="h-5 w-5" aria-hidden />
                    </MenuButton>
                    <MenuItems
                        transition
                        anchor="bottom end"
                        className="z-50 w-52 origin-top rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200 transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0 [--anchor-gap:6px]"
                    >
                        <MenuItem>
                            <button type="button" onClick={toggleSave} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 data-focus:bg-slate-100">
                                {saved ? <HiBookmark className="h-5 w-5 text-brand" aria-hidden /> : <HiOutlineBookmark className="h-5 w-5 text-slate-400" aria-hidden />}
                                {saved ? t('feed_saved', 'Saved') : t('feed_save', 'Save')}
                            </button>
                        </MenuItem>
                        {post.can_delete ? (
                            <>
                                {post.can_edit ? (
                                    <MenuItem>
                                        <button type="button" onClick={() => setEditOpen(true)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 data-focus:bg-slate-100">
                                            <HiOutlinePencilSquare className="h-5 w-5 text-slate-400" aria-hidden />
                                            {t('post_edit', 'Edit post')}
                                        </button>
                                    </MenuItem>
                                ) : null}
                                <MenuItem>
                                    <button type="button" onClick={toggleArchive} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 data-focus:bg-slate-100">
                                        <HiOutlineArchiveBox className="h-5 w-5 text-slate-400" aria-hidden />
                                        {post.lifecycle_status === 'archived' ? t('post_unarchive', 'Unarchive') : t('post_archive', 'Archive')}
                                    </button>
                                </MenuItem>
                                <MenuItem>
                                    <button type="button" onClick={remove} disabled={deleting} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-50 data-focus:bg-red-50">
                                        <HiOutlineTrash className="h-5 w-5" aria-hidden />
                                        {t('feed_delete', 'Delete')}
                                    </button>
                                </MenuItem>
                            </>
                        ) : (
                            <>
                                <MenuItem>
                                    <button type="button" disabled={safetyBusy} onClick={() => safetyAction('mute')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 data-focus:bg-slate-100">
                                        <HiOutlineNoSymbol className="h-5 w-5 text-slate-400" aria-hidden />
                                        {t('feed_mute', 'Mute')}
                                    </button>
                                </MenuItem>
                                <MenuItem>
                                    <button type="button" disabled={safetyBusy} onClick={() => safetyAction('block')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 data-focus:bg-slate-100">
                                        <HiOutlineUserMinus className="h-5 w-5 text-slate-400" aria-hidden />
                                        {t('feed_block', 'Block')}
                                    </button>
                                </MenuItem>
                                <MenuItem>
                                    <button type="button" onClick={report} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 data-focus:bg-red-50">
                                        <HiOutlineFlag className="h-5 w-5" aria-hidden />
                                        {t('feed_report', 'Report')}
                                    </button>
                                </MenuItem>
                            </>
                        )}
                    </MenuItems>
                </Menu>
            </header>

            {/* Body (HTML from the rich editor), with hashtags linkified and
                mention anchors styled at render time. Long text clamps to two
                lines with a "show more" toggle — the Facebook rhythm. */}
            {post.body ? (
                <div className="px-5">
                    <div
                        ref={bodyRef}
                        className={`prose prose-sm mt-3 max-w-none break-words text-slate-700 prose-p:my-1.5 prose-a:text-brand prose-headings:text-slate-900 ${
                            bodyExpanded ? '' : 'line-clamp-2'
                        }`}
                        dangerouslySetInnerHTML={{ __html: decorateSocialHtml(post.body) }}
                    />
                    {bodyOverflows || bodyExpanded ? (
                        <button
                            type="button"
                            onClick={() => setBodyExpanded((v) => !v)}
                            className="mt-0.5 text-xs font-bold text-slate-500 transition hover:text-brand"
                        >
                            {bodyExpanded ? t('reels_show_less', 'less') : t('reels_show_more', 'more')}
                        </button>
                    ) : null}
                </div>
            ) : null}

            {post.location_name ? (
                <p className="mt-2 flex items-center gap-1 px-5 text-xs font-medium text-slate-500">
                    <HiOutlineMapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    {post.location_name}
                </p>
            ) : null}

            {(() => {
                const images = media.filter((item) => item.kind === 'image');
                const videos = media.filter((item) => item.kind === 'video');
                const documents = media.filter((item) => item.kind === 'document');
                const isCarousel = post.format === 'carousel' && images.length >= 2;
                const extra = images.length - 2;

                return (
                    <>
                        {/* Reels keep the tall 9:16 frame they were shot for;
                            ordinary post videos stay capped like images. */}
                        {videos.map((item) => post.format === 'reel' ? (
                            <div key={item.id} className="mt-4 flex justify-center bg-black">
                                <video
                                    src={item.variants?.web?.url || item.url}
                                    poster={item.variants?.poster?.url}
                                    controls
                                    preload="metadata"
                                    playsInline
                                    className="aspect-[9/16] max-h-[600px] w-auto max-w-full object-contain"
                                />
                            </div>
                        ) : (
                            <video
                                key={item.id}
                                src={item.variants?.web?.url || item.url}
                                poster={item.variants?.poster?.url}
                                controls
                                preload="metadata"
                                playsInline
                                className="mt-4 max-h-[420px] w-full bg-black object-contain"
                            />
                        ))}

                        {isCarousel ? (
                            <div className="mt-4">
                                <MediaCarousel media={media} onOpen={(i) => setLightboxAt(i)} />
                            </div>
                        ) : images.length > 0 ? (
                            // The feed shows at most two tiles; the rest hide
                            // behind a "+N" veil and everything opens the viewer.
                            <div className={`mt-4 grid gap-0.5 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {images.slice(0, 2).map((item, i) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setLightboxAt(i)}
                                        className="relative block w-full cursor-zoom-in"
                                    >
                                        <img
                                            src={item.url}
                                            alt={item.alt_text || ''}
                                            loading="lazy"
                                            decoding="async"
                                            className={`w-full object-cover ${images.length === 1 ? 'max-h-[420px]' : 'aspect-[4/3]'}`}
                                        />
                                        {i === 1 && extra > 0 ? (
                                            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-bold text-white">
                                                +{extra}
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        {documents.map((item) => (
                            <a
                                key={item.id}
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mx-5 mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-light p-4 text-sm font-bold text-brand-dark transition hover:bg-brand-light/70"
                            >
                                <HiOutlineDocumentText className="h-5 w-5 shrink-0" aria-hidden />
                                <span className="truncate">{item.name || t('feed_open_document', 'Open document')}</span>
                            </a>
                        ))}

                        {lightboxAt !== null ? (
                            <Lightbox images={images} index={lightboxAt} onClose={() => setLightboxAt(null)} />
                        ) : null}
                    </>
                );
            })()}

            <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} />

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
                    const cls = 'mx-5 mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5';
                    return author.username ? (
                        <Link to={`/community/u/${author.username}`} className={`${cls} transition hover:bg-slate-100`}>
                            {inner}
                        </Link>
                    ) : (
                        <div className={cls}>{inner}</div>
                    );
                })()
            ) : null}

            {/* Image, video and document attachments */}
            {Array.isArray(post.attachments) && post.attachments.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2 px-5 sm:grid-cols-3">
                    {post.attachments.map((src, i) => mediaKind(src) === 'video'
                        ? <video key={i} src={src} controls preload="metadata" className="h-32 w-full rounded-xl bg-black object-cover ring-1 ring-slate-200" />
                        : mediaKind(src) === 'document'
                            ? <a key={i} href={src} target="_blank" rel="noreferrer" className="flex h-32 items-center justify-center rounded-xl bg-slate-50 p-3 text-center text-xs font-semibold text-brand ring-1 ring-slate-200">{decodeURIComponent(String(src).split('/').pop()?.split('?')[0] || t('feed_open_document', 'Open document'))}</a>
                            : <img key={i} src={src} alt="" loading="lazy" decoding="async" className="h-32 w-full rounded-xl object-cover ring-1 ring-slate-200" />)}
                </div>
            ) : null}

            {post.cta ? (
                <a
                    href={post.cta.url || '#'}
                    target={post.cta.url ? '_blank' : undefined}
                    rel="noreferrer"
                    className="sc-press mx-5 mt-4 flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                    {post.cta.label || (post.cta.type === 'request_quote' ? t('feed_cta_request_quote', 'Request a quote') : t('feed_cta_contact', 'Contact now'))}
                </a>
            ) : null}

            {/* Engagement summary — who responded, how many talked about it */}
            {responses > 0 || counts.comments > 0 || counts.shares > 0 ? (
                <div className="mt-4 flex items-center justify-between gap-3 px-5 text-xs text-slate-500">
                    {responses > 0 ? (
                        // Opens the who-reacted viewer, exactly like tapping the
                        // reaction cluster on the big networks.
                        <button
                            type="button"
                            onClick={() => setReactionsOpen(true)}
                            aria-label={t('reactions_title', 'Reactions')}
                            className="sc-press flex items-center gap-1.5 rounded-lg px-1 py-0.5 transition hover:bg-slate-50"
                        >
                            <span className="flex items-center gap-0.5">
                                {counts.likes > 0 ? (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white ring-2 ring-white" aria-hidden>
                                        <HiHeart className="h-3 w-3" />
                                    </span>
                                ) : null}
                                {topReactions.map((r) => (
                                    <span key={r.type} className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] ring-2 ring-white" aria-hidden>
                                        {r.emoji}
                                    </span>
                                ))}
                            </span>
                            <span className="font-semibold">{responses}</span>
                        </button>
                    ) : <span />}
                    {/* Counts sit next to their icon rather than a noun, so the
                        row never needs plural rules in either language. */}
                    <span className="flex items-center gap-3">
                        {counts.comments ? (
                            <button
                                type="button"
                                onClick={() => setShowComments(true)}
                                aria-label={t('feed_comment', 'Comment')}
                                className="inline-flex items-center gap-1 font-semibold transition hover:text-brand"
                            >
                                <HiOutlineChatBubbleOvalLeft className="h-4 w-4" aria-hidden />
                                {counts.comments}
                            </button>
                        ) : null}
                        {counts.shares ? (
                            <span className="inline-flex items-center gap-1 font-semibold" aria-label={t('feed_share', 'Share')}>
                                <HiOutlineArrowUpTray className="h-4 w-4" aria-hidden />
                                {counts.shares}
                            </span>
                        ) : null}
                    </span>
                </div>
            ) : null}

            {/* Action bar */}
            <footer className="mt-2 flex items-center gap-1 border-t border-slate-100 px-3 py-1.5">
                {/* Click likes; hover or focus opens the reaction picker. */}
                <div
                    className="relative flex flex-1"
                    onMouseEnter={openPicker}
                    onMouseLeave={closePicker}
                    onFocus={openPicker}
                    onBlur={closePicker}
                >
                    {pickerOpen ? (
                        <div
                            className="sc-pop absolute bottom-full start-0 z-30 mb-2 flex gap-1 rounded-full bg-white p-1.5 shadow-xl ring-1 ring-slate-200"
                            role="group"
                            aria-label={t('feed_reactions_label', 'Post reactions')}
                        >
                            {REACTIONS.map((r) => (
                                <button
                                    key={r.type}
                                    type="button"
                                    onClick={() => chooseReaction(r.type)}
                                    title={t(r.labelKey)}
                                    aria-label={t(r.labelKey)}
                                    aria-pressed={reaction === r.type}
                                    className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition duration-150 hover:-translate-y-1 hover:scale-110 ${
                                        reaction === r.type ? 'bg-brand-light ring-1 ring-brand/25' : 'hover:bg-slate-100'
                                    }`}
                                >
                                    {r.emoji}
                                </button>
                            ))}
                        </div>
                    ) : null}

                    <button
                        type="button"
                        onClick={toggleLike}
                        disabled={likeBusy}
                        aria-pressed={liked}
                        className={`${ACTION_CLASS} ${liked || activeReaction ? 'text-red-600' : 'text-slate-600'}`}
                    >
                        <span className={`relative flex items-center justify-center ${burst ? 'sc-burst sc-halo' : ''}`}>
                            {activeReaction ? (
                                <span className="text-lg leading-none" aria-hidden>{activeReaction.emoji}</span>
                            ) : liked ? (
                                <HiHeart className="h-5 w-5" aria-hidden />
                            ) : (
                                <HiOutlineHeart className="h-5 w-5" aria-hidden />
                            )}
                        </span>
                        <span className="truncate">{activeReaction ? t(activeReaction.labelKey) : t('feed_like', 'Like')}</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setShowComments((v) => !v)}
                    aria-expanded={showComments}
                    className={`${ACTION_CLASS} ${showComments ? 'text-brand' : 'text-slate-600'}`}
                >
                    <HiOutlineChatBubbleOvalLeft className="h-5 w-5" aria-hidden />
                    <span className="truncate">{t('feed_comment', 'Comment')}</span>
                </button>

                {/* Share is a popover of real choices — no prompt() in sight. */}
                <Menu as="div" className="relative flex flex-1">
                    <MenuButton disabled={shareBusy} className={`${ACTION_CLASS} text-slate-600 disabled:opacity-50`}>
                        <HiOutlineArrowUpTray className="h-5 w-5" aria-hidden />
                        <span className="truncate">{t('feed_share', 'Share')}</span>
                    </MenuButton>
                    <MenuItems
                        transition
                        anchor="top"
                        className="z-50 w-56 origin-bottom rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200 transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0 [--anchor-gap:6px]"
                    >
                        <MenuItem>
                            <button type="button" onClick={copyLink} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 data-focus:bg-slate-100">
                                <HiOutlineLink className="h-5 w-5 text-slate-400" aria-hidden />
                                {t('share_copy_link', 'Copy link')}
                            </button>
                        </MenuItem>
                        {typeof navigator !== 'undefined' && navigator.share ? (
                            <MenuItem>
                                <button type="button" onClick={shareVia} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 data-focus:bg-slate-100">
                                    <HiOutlineArrowUpTray className="h-5 w-5 text-slate-400" aria-hidden />
                                    {t('share_via', 'Share via…')}
                                </button>
                            </MenuItem>
                        ) : null}
                        <MenuItem>
                            <button type="button" onClick={() => setRepostOpen(true)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 data-focus:bg-slate-100">
                                <HiOutlineArrowPathRoundedSquare className="h-5 w-5 text-slate-400" aria-hidden />
                                {t('share_repost', 'Repost with caption')}
                            </button>
                        </MenuItem>
                    </MenuItems>
                </Menu>

                <button type="button" onClick={toggleSave} aria-pressed={saved} className={`${ACTION_CLASS} ${saved ? 'text-brand' : 'text-slate-600'}`}>
                    {saved ? <HiBookmark className="h-5 w-5" aria-hidden /> : <HiOutlineBookmark className="h-5 w-5" aria-hidden />}
                    <span className="hidden truncate sm:inline">{saved ? t('feed_saved', 'Saved') : t('feed_save', 'Save')}</span>
                </button>
            </footer>

            {showComments && post.comments_enabled !== false ? (
                <div className="px-5 pb-4">
                    <CommentThread
                        postId={post.id}
                        onCountChange={(delta) => setCounts((c) => ({ ...c, comments: Math.max(0, (c.comments ?? 0) + delta) }))}
                    />
                </div>
            ) : null}

            {post.can_edit ? (
                <PostEditDialog post={post} open={editOpen} onClose={() => setEditOpen(false)} onUpdated={(fresh) => setOverride(fresh)} />
            ) : null}
            <ReactionsDialog postId={post.id} open={reactionsOpen} onClose={() => setReactionsOpen(false)} />

            {/* Repost with caption */}
            <Dialog open={repostOpen} onClose={() => setRepostOpen(false)} className="relative z-[90]">
                <DialogBackdrop transition className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition duration-200 data-closed:opacity-0" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel transition className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200/80 transition duration-200 data-closed:scale-95 data-closed:opacity-0">
                        <DialogTitle className="text-base font-bold text-slate-900">{t('share_repost', 'Repost with caption')}</DialogTitle>
                        <form onSubmit={submitRepost} className="mt-3 space-y-3">
                            <textarea
                                rows={3}
                                value={repostCaption}
                                onChange={(event) => setRepostCaption(event.target.value)}
                                maxLength={500}
                                placeholder={t('share_repost_ph', 'Say something about this…')}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setRepostOpen(false)} className="sc-press rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200/70">
                                    {t('action_cancel', 'Cancel')}
                                </button>
                                <button type="submit" disabled={shareBusy} className="sc-press rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-50">
                                    {t('share_repost_submit', 'Repost')}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </article>
    );
}
