import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import notify from '../../../components/ui/notify';
import {
    HiCheckBadge,
    HiHeart,
    HiOutlineArrowUpTray,
    HiOutlineBookmark,
    HiBookmark,
    HiOutlineChatBubbleOvalLeft,
    HiOutlineHeart,
    HiOutlinePause,
    HiOutlinePlay,
    HiOutlineShoppingBag,
    HiOutlineSpeakerWave,
    HiOutlineSpeakerXMark,
    HiOutlineXMark,
} from 'react-icons/hi2';
import api from '../../../api/client';
import { initials } from '../../../components/feed/helpers';
import CommentThread from '../../../components/feed/CommentThread';
import { trackFeedEvent } from '../api/events';

/** Compact counts — 1.3K rather than 1284, the way every video feed shows them. */
function shortCount(n, locale) {
    const value = Number(n) || 0;
    try {
        return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    } catch {
        return String(value);
    }
}

/** One control in the right-hand rail: a glass button with its count underneath. */
function RailAction({ icon, label, count, onClick, locale }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <button
                type="button"
                onClick={onClick}
                title={label}
                aria-label={label}
                className="sc-press flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
            >
                {icon}
            </button>
            {count > 0 ? <span className="text-[11px] font-bold text-white drop-shadow">{shortCount(count, locale)}</span> : null}
        </div>
    );
}

/**
 * A single reel: video, overlays and every interaction that belongs to it.
 *
 * Two things keep this cheap while a long list is mounted. The <video> element
 * only exists while the reel is the active one or its immediate neighbour
 * (`near`) — everything further away renders as a poster image. And playback is
 * driven purely by the `active` flag the page derives from an
 * IntersectionObserver, so scrolling never triggers a layout read.
 */
export default function Reel({ post, index, active, near, muted, onToggleMute, locale }) {
    const { t } = useTranslation();
    const videoRef = useRef(null);
    const tapTimer = useRef(null);

    const [liked, setLiked] = useState(!!post.liked);
    const [saved, setSaved] = useState(!!post.saved);
    const [counts, setCounts] = useState(post.counts ?? { likes: 0, comments: 0, shares: 0 });
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);
    // Both overlays clear themselves once their animation is done, so a
    // finished burst never lingers in the DOM (and never reappears at full
    // opacity for members who have animations turned off).
    const [heart, setHeart] = useState(null); // { key }
    const [flash, setFlash] = useState(null); // { kind: 'play' | 'pause', key }

    const media = post.media?.find((item) => item.kind === 'video');
    const poster = media?.variants?.poster?.url;
    const author = post.acting_as?.type === 'organization' ? post.acting_as : post.author;
    const displayName = author?.name ?? '';

    // Play only the reel in view; pause and rewind everything else so a reel
    // always restarts from the top when it comes back around.
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (active) {
            video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
            trackFeedEvent(post.id, 'impression');
        } else {
            video.pause();
            video.currentTime = 0;
            setPlaying(false);
            setProgress(0);
        }
    }, [active, post.id]);

    useEffect(() => () => clearTimeout(tapTimer.current), []);

    // A reel scrolled away from should not keep its comment sheet open.
    useEffect(() => {
        if (!active) {
            setCommentsOpen(false);
            setExpanded(false);
        }
    }, [active]);

    const showFlash = (kind) => {
        const key = Date.now();
        setFlash({ kind, key });
        setTimeout(() => setFlash((f) => (f?.key === key ? null : f)), 600);
    };

    const celebrate = () => {
        const key = Date.now();
        setHeart({ key });
        setTimeout(() => setHeart((h) => (h?.key === key ? null : h)), 900);
    };

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play().then(() => setPlaying(true)).catch(() => {});
            showFlash('play');
        } else {
            video.pause();
            setPlaying(false);
            showFlash('pause');
        }
    };

    const like = useCallback(
        async (fromDoubleTap = false) => {
            // Double-tapping an already-liked reel still celebrates, but must
            // not toggle the like back off.
            if (fromDoubleTap && liked) {
                celebrate();
                return;
            }
            const next = fromDoubleTap ? true : !liked;
            setLiked(next);
            setCounts((c) => ({ ...c, likes: Math.max(0, (c.likes ?? 0) + (next ? 1 : -1)) }));
            if (next) celebrate();
            try {
                const { data } = next ? await api.post(`/posts/${post.id}/like`) : await api.delete(`/posts/${post.id}/like`);
                if (data && typeof data.likes_count === 'number') setCounts((c) => ({ ...c, likes: data.likes_count }));
                if (data && typeof data.liked === 'boolean') setLiked(data.liked);
                if (next) trackFeedEvent(post.id, 'like');
            } catch {
                setLiked(!next);
                setCounts((c) => ({ ...c, likes: Math.max(0, (c.likes ?? 0) + (next ? -1 : 1)) }));
            }
        },
        [liked, post.id],
    );

    // Single tap plays/pauses, double tap likes — so the first tap of a double
    // tap waits to see whether a second one is coming.
    const onSurfaceClick = () => {
        if (tapTimer.current) {
            clearTimeout(tapTimer.current);
            tapTimer.current = null;
            like(true);
            return;
        }
        tapTimer.current = setTimeout(() => {
            tapTimer.current = null;
            togglePlay();
        }, 240);
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

    const share = async () => {
        const url = `${window.location.origin}/community/post/${post.id}`;
        try {
            if (navigator.share) await navigator.share({ url, title: displayName });
            else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                notify.success(t('reels_link_copied', 'Link copied'));
            } else {
                return; // nothing we can do on this browser; leave the count alone
            }
            setCounts((c) => ({ ...c, shares: (c.shares ?? 0) + 1 }));
            trackFeedEvent(post.id, 'share');
        } catch {
            /* the member dismissed the share sheet */
        }
    };

    if (!media) return null;

    const videoSrc = media.variants?.web?.url || media.url;

    return (
        <article
            data-index={index}
            className="relative flex h-full w-full shrink-0 snap-start snap-always items-center justify-center"
        >
            {/* Full-bleed on a phone; a centred 9:16 frame once the screen is
                wider than the video, the way full-screen viewers letterbox. */}
            <div className="relative h-full w-full overflow-hidden bg-black sm:aspect-[9/16] sm:h-full sm:w-auto sm:rounded-2xl">
                {/* Any aspect ratio sits on a blurred bed of its own poster
                    instead of being cropped or hard-letterboxed. */}
                {poster ? (
                    <div
                        className="absolute inset-0 scale-110 bg-cover bg-center opacity-50 blur-2xl"
                        style={{ backgroundImage: `url(${poster})` }}
                        aria-hidden
                    />
                ) : null}

                {near ? (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        poster={poster}
                        loop
                        playsInline
                        muted={muted}
                        preload={active ? 'auto' : 'metadata'}
                        onTimeUpdate={(e) => {
                            const { currentTime, duration } = e.currentTarget;
                            if (duration) setProgress((currentTime / duration) * 100);
                        }}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        className="relative h-full w-full object-contain"
                    />
                ) : (
                    <img src={poster} alt="" loading="lazy" decoding="async" className="relative h-full w-full object-contain" />
                )}

                {/* Tap surface — above the video, below every control. */}
                <button
                    type="button"
                    onClick={onSurfaceClick}
                    aria-label={playing ? t('reels_pause', 'Pause') : t('reels_play', 'Play')}
                    className="absolute inset-0 z-10 cursor-default"
                />

                {flash ? (
                    <span key={flash.key} className="sc-reel-flash pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur">
                            {flash.kind === 'play' ? <HiOutlinePlay className="h-10 w-10" /> : <HiOutlinePause className="h-10 w-10" />}
                        </span>
                    </span>
                ) : null}

                {heart ? (
                    <span key={heart.key} className="sc-reel-heart pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                        <HiHeart className="h-28 w-28 text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.5)]" />
                    </span>
                ) : null}

                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-transparent to-black/35" />

                {/* Author, caption and the product the reel is selling */}
                <div className="absolute inset-x-0 bottom-0 z-20 p-4 pe-16 text-white sm:p-5 sm:pe-20">
                    <div className="flex items-center gap-2.5">
                        {author?.photo || author?.logo_url ? (
                            <img src={author.photo || author.logo_url} alt="" loading="lazy" className="h-9 w-9 rounded-full object-cover ring-2 ring-white/70" />
                        ) : (
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold backdrop-blur">
                                {initials(displayName)}
                            </span>
                        )}
                        {post.author?.username ? (
                            <Link to={`/u/${post.author.username}`} className="flex items-center gap-1 text-sm font-bold hover:underline">
                                {displayName}
                                {author?.is_verified ? <HiCheckBadge className="h-4 w-4 text-sky-300" aria-hidden /> : null}
                            </Link>
                        ) : (
                            <span className="flex items-center gap-1 text-sm font-bold">
                                {displayName}
                                {author?.is_verified ? <HiCheckBadge className="h-4 w-4 text-sky-300" aria-hidden /> : null}
                            </span>
                        )}
                    </div>

                    {post.body ? (
                        <div className="mt-2 text-sm leading-6 text-white/90">
                            <div className={expanded ? 'max-h-40 overflow-y-auto' : 'line-clamp-2'} dangerouslySetInnerHTML={{ __html: post.body }} />
                            <button
                                type="button"
                                onClick={() => setExpanded((v) => !v)}
                                className="mt-0.5 text-xs font-bold text-white/70 transition hover:text-white"
                            >
                                {expanded ? t('reels_show_less', 'less') : t('reels_show_more', 'more')}
                            </button>
                        </div>
                    ) : null}

                    {post.product ? (
                        <Link
                            to={`/products/${post.product.id}`}
                            className="sc-press mt-3 inline-flex max-w-full items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold backdrop-blur transition hover:bg-white/25"
                        >
                            <HiOutlineShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="truncate">
                                {t('reels_view_product', 'View product')} · {post.product.name}
                            </span>
                        </Link>
                    ) : null}
                </div>

                {/* Action rail */}
                <div className="absolute bottom-4 end-2 z-20 flex flex-col items-center gap-3 sm:bottom-5 sm:end-3">
                    <RailAction
                        icon={liked ? <HiHeart className="h-6 w-6 text-red-500" /> : <HiOutlineHeart className="h-6 w-6" />}
                        label={t('feed_like', 'Like')}
                        count={counts.likes}
                        onClick={() => like()}
                        locale={locale}
                    />
                    <RailAction
                        icon={<HiOutlineChatBubbleOvalLeft className="h-6 w-6" />}
                        label={t('feed_comment', 'Comment')}
                        count={counts.comments}
                        onClick={() => setCommentsOpen(true)}
                        locale={locale}
                    />
                    <RailAction
                        icon={<HiOutlineArrowUpTray className="h-6 w-6" />}
                        label={t('feed_share', 'Share')}
                        count={counts.shares}
                        onClick={share}
                        locale={locale}
                    />
                    <RailAction
                        icon={saved ? <HiBookmark className="h-6 w-6" /> : <HiOutlineBookmark className="h-6 w-6" />}
                        label={saved ? t('feed_saved', 'Saved') : t('feed_save', 'Save')}
                        onClick={toggleSave}
                        locale={locale}
                    />
                    <RailAction
                        icon={muted ? <HiOutlineSpeakerXMark className="h-6 w-6" /> : <HiOutlineSpeakerWave className="h-6 w-6" />}
                        label={muted ? t('reels_sound_on', 'Turn sound on') : t('reels_sound_off', 'Turn sound off')}
                        onClick={onToggleMute}
                        locale={locale}
                    />
                </div>

                {/* Playback progress */}
                <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-white/20">
                    <div className="h-full bg-white/90" style={{ width: `${progress}%` }} />
                </div>

                {/* Comments slide up over the video and dismiss on the backdrop. */}
                {commentsOpen ? (
                    <>
                        <button
                            type="button"
                            aria-hidden
                            tabIndex={-1}
                            onClick={() => setCommentsOpen(false)}
                            className="absolute inset-0 z-30 bg-black/50"
                        />
                        <section className="sc-pop absolute inset-x-0 bottom-0 z-40 flex max-h-[72%] flex-col rounded-t-2xl bg-white shadow-2xl">
                            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                <h2 className="text-sm font-bold text-slate-900">{t('feed_comment', 'Comment')}</h2>
                                <button
                                    type="button"
                                    onClick={() => setCommentsOpen(false)}
                                    aria-label={t('cancel', 'Cancel')}
                                    className="sc-press rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100"
                                >
                                    <HiOutlineXMark className="h-5 w-5" aria-hidden />
                                </button>
                            </header>
                            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                                <CommentThread
                                    postId={post.id}
                                    onCountChange={(delta) => setCounts((c) => ({ ...c, comments: Math.max(0, (c.comments ?? 0) + delta) }))}
                                />
                            </div>
                        </section>
                    </>
                ) : null}
            </div>
        </article>
    );
}
