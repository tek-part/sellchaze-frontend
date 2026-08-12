import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowLeft, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlinePlayCircle, HiOutlinePlus } from 'react-icons/hi2';
import api from '../api/client';
import { langParam } from '../api/lang';
import Reel from '../features/community/components/Reel';

/** How many reels either side of the active one keep a real <video> mounted. */
const WINDOW = 1;

/**
 * The reels viewer — a full-screen, black, one-video-at-a-time surface.
 *
 * It deliberately escapes the dashboard chrome: reels are watched, not browsed
 * next to a sidebar, so the page paints over the whole viewport and offers a
 * back button instead of the usual navigation.
 *
 * Which reel plays is decided by an IntersectionObserver rather than by
 * measuring scroll offsets, so fast flicks never land between two reels and the
 * scroll handler does no layout work at all. Only the active reel and its
 * neighbours mount a <video>; the rest stay as poster images, which is what
 * keeps the page responsive once a few dozen reels have loaded.
 */
export default function ReelsPage() {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);
    const navigate = useNavigate();
    const location = useLocation();

    const [posts, setPosts] = useState([]);
    const [active, setActive] = useState(0);
    const [loading, setLoading] = useState(true);
    const [muted, setMuted] = useState(true);

    const stageRef = useRef(null);
    const cursorRef = useRef(null);
    const busyRef = useRef(false);
    const exhaustedRef = useRef(false);

    const load = useCallback(async () => {
        if (busyRef.current || exhaustedRef.current) return;
        busyRef.current = true;
        try {
            const { data } = await api.get('/reels', { params: cursorRef.current ? { cursor: cursorRef.current } : {} });
            const batch = data.data ?? [];
            setPosts((old) => [...old, ...batch]);
            cursorRef.current = data.meta?.next_cursor || null;
            if (!cursorRef.current || batch.length === 0) exhaustedRef.current = true;
        } catch {
            exhaustedRef.current = true;
        } finally {
            busyRef.current = false;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Whichever reel covers most of the stage is the one that plays.
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || posts.length === 0) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                        setActive(Number(entry.target.dataset.index));
                    }
                });
            },
            { root: stage, threshold: [0.6] },
        );
        Array.from(stage.children).forEach((child) => {
            if (child.dataset?.index !== undefined) observer.observe(child);
        });
        return () => observer.disconnect();
    }, [posts.length]);

    // Fetch the next page while there are still two reels left to watch.
    useEffect(() => {
        if (posts.length && active >= posts.length - 2) load();
    }, [active, posts.length, load]);

    const goTo = useCallback((index) => {
        const stage = stageRef.current;
        const child = stage?.children?.[index];
        if (!stage || !child) return;
        stage.scrollTo({ top: child.offsetTop, behavior: 'smooth' });
    }, []);

    // Leaving the viewer should feel like closing it, not like a fresh page
    // load — go back where the member came from when there is a history entry.
    const close = useCallback(() => {
        if (location.key && location.key !== 'default') navigate(-1);
        else navigate('/feed');
    }, [location.key, navigate]);

    // Arrow keys step between reels; Escape closes the viewer.
    useEffect(() => {
        const onKey = (event) => {
            const tag = event.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                goTo(Math.min(active + 1, posts.length - 1));
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                goTo(Math.max(active - 1, 0));
            } else if (event.key === 'Escape') {
                close();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [active, posts.length, goTo, close]);

    return (
        <div className="fixed inset-0 z-50 bg-black">
            {/* Floating chrome, so the video keeps the full height */}
            <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={close}
                        aria-label={t('reels_back', 'Back')}
                        className="sc-press flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                    >
                        <HiOutlineArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
                    </button>
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white drop-shadow">
                        <HiOutlinePlayCircle className="h-5 w-5" aria-hidden />
                        {t('reels_title', 'Reels')}
                    </span>
                </div>

                <Link
                    to="/community/create?format=reel"
                    className="sc-press inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/25"
                >
                    <HiOutlinePlus className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">{t('reels_create', 'Create a reel')}</span>
                </Link>
            </div>

            <div ref={stageRef} className="sc-reel-stage relative h-full w-full overflow-y-auto">
                {posts.map((post, index) => (
                    <Reel
                        key={post.id}
                        post={post}
                        index={index}
                        active={index === active}
                        near={Math.abs(index - active) <= WINDOW}
                        muted={muted}
                        onToggleMute={() => setMuted((v) => !v)}
                        locale={lang}
                    />
                ))}

                {posts.length === 0 && !loading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                            <HiOutlinePlayCircle className="h-7 w-7" aria-hidden />
                        </span>
                        <p className="text-base font-bold text-white">{t('reels_empty', 'No reels yet')}</p>
                        <p className="max-w-xs text-sm text-white/60">
                            {t('reels_empty_hint', 'Publish a short video of your product and it will show up here.')}
                        </p>
                        <Link
                            to="/community/create?format=reel"
                            className="sc-press mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900"
                        >
                            <HiOutlinePlus className="h-5 w-5" aria-hidden />
                            {t('reels_create', 'Create a reel')}
                        </Link>
                    </div>
                ) : null}

                {posts.length === 0 && loading ? (
                    <div className="flex h-full items-center justify-center">
                        <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" aria-label={t('loading', 'Loading…')} />
                    </div>
                ) : null}
            </div>

            {/* Desktop step controls, parked beside the 9:16 frame. */}
            {posts.length > 1 ? (
                <div className="absolute end-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
                    <button
                        type="button"
                        onClick={() => goTo(Math.max(active - 1, 0))}
                        disabled={active === 0}
                        aria-label={t('reels_previous', 'Previous reel')}
                        className="sc-press flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-30"
                    >
                        <HiOutlineChevronUp className="h-5 w-5" aria-hidden />
                    </button>
                    <button
                        type="button"
                        onClick={() => goTo(Math.min(active + 1, posts.length - 1))}
                        disabled={active >= posts.length - 1}
                        aria-label={t('reels_next', 'Next reel')}
                        className="sc-press flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-30"
                    >
                        <HiOutlineChevronDown className="h-5 w-5" aria-hidden />
                    </button>
                </div>
            ) : null}
        </div>
    );
}
