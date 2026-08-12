import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HiOutlineArrowPath, HiOutlineChevronDown, HiOutlineFunnel, HiOutlinePencilSquare, HiOutlineUsers } from 'react-icons/hi2';
import api from '../api/client';
import { langParam } from '../api/lang';
import PostCard from '../components/feed/PostCard';
import FollowSuggestions from '../components/feed/FollowSuggestions';
import CommunityShell from '../features/community/components/CommunityShell';
import CommunityHero from '../features/community/components/CommunityHero';
import QuickComposer from '../features/community/components/QuickComposer';
import BusinessHighlights from '../features/community/components/BusinessHighlights';
import FeedSkeleton from '../features/community/components/FeedSkeleton';

/**
 * The community feed, and — via `initialScope` / `titleKey` — the focused lists
 * behind it (following, saved, trending).
 *
 * The page reads top to bottom as one funnel: who we are (hero), what you can
 * publish (composer), where else to go (shortcuts), then the posts themselves
 * behind a filter bar that stays reachable while scrolling. The discovery
 * blocks only belong on the main feed; a focused list opens straight into a
 * titled result set instead.
 */
export default function FeedPage({ initialScope = 'all', titleKey = null, title = null }) {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [scope, setScope] = useState(initialScope);
    const [sector, setSector] = useState(''); // sector slug ('' = all sectors)
    const [sectors, setSectors] = useState([]);

    const [posts, setPosts] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [err, setErr] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    const heading = titleKey ? t(titleKey) : title;
    const isMainFeed = !heading;

    // Sector options for the filter dropdown.
    useEffect(() => {
        api.get('/public/sectors', { params: { lang } })
            .then(({ data }) => setSectors(data.sectors ?? []))
            .catch(() => setSectors([]));
    }, [lang]);

    const fetchPage = useCallback(
        (page) => {
            const params = { scope, page, per_page: 10, lang };
            if (sector) params.sector = sector;
            return api.get('/feed', { params });
        },
        [scope, sector, lang],
    );

    // Reload from page 1 whenever scope / sector / language changes.
    useEffect(() => {
        let alive = true;
        setLoading(true);
        setErr('');
        fetchPage(1)
            .then(({ data }) => {
                if (!alive) return;
                setPosts(data.data ?? []);
                setMeta(data.meta ?? null);
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
    }, [fetchPage, reloadKey]);

    const loadMore = async () => {
        if (!meta || loadingMore) return;
        const next = (meta.current_page ?? 1) + 1;
        setLoadingMore(true);
        try {
            const { data } = await fetchPage(next);
            setPosts((prev) => [...prev, ...(data.data ?? [])]);
            setMeta(data.meta ?? null);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoadingMore(false);
        }
    };

    const removePost = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));

    const hasMore = meta && (meta.current_page ?? 1) < (meta.last_page ?? 1);

    const scopeTabs = [
        { id: 'mine', label: t('feed_scope_mine', 'My sector') },
        { id: 'all', label: t('feed_scope_all', 'All') },
    ];
    // The focused lists arrive on their own scope; a scope switcher there would
    // silently navigate the member out of the list they opened.
    const showScopeTabs = scopeTabs.some((tab) => tab.id === scope);

    return (
        <CommunityShell>
            <div className="space-y-5">
                {isMainFeed ? (
                    <>
                        <CommunityHero />
                        <QuickComposer />
                        <BusinessHighlights />
                    </>
                ) : (
                    <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_8px_30px_-22px_rgba(15,23,42,.4)] ring-1 ring-slate-200/80">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                            <HiOutlineUsers className="h-5 w-5" aria-hidden />
                        </span>
                        <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">{heading}</h1>
                    </div>
                )}

                <div className="xl:hidden">
                    <FollowSuggestions />
                </div>

                {/* Filter bar — pinned flush under the app header.
                    The scroll container is the padded <main>, and `top: 0` would
                    park the bar one padding-step below the header; the negative
                    offsets cancel that padding (p-3 / md:p-5 / lg:p-7) so the bar
                    stops exactly at the top. Its own blurred backdrop covers the
                    band the posts scroll through underneath. */}
                <div className="sticky top-[-0.75rem] z-30 -mx-1 bg-surface/80 px-1 py-2 backdrop-blur-xl md:top-[-1.25rem] lg:top-[-1.75rem]">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-1.5 shadow-[0_10px_30px_-20px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                        {showScopeTabs ? (
                            <div className="inline-flex rounded-xl bg-slate-100/80 p-1">
                                {scopeTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setScope(tab.id)}
                                        aria-pressed={scope === tab.id}
                                        className={`sc-press rounded-lg px-4 py-1.5 text-sm font-bold transition duration-200 ${
                                            scope === tab.id
                                                ? 'bg-brand text-white shadow-md shadow-brand/25'
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <span className="ps-2 text-sm font-bold text-slate-400">{t('feed_filter_sector', 'Sector')}</span>
                        )}

                        {/* Native select, styled: an icon in front, our own chevron behind. */}
                        <label className="relative flex items-center">
                            <span className="sr-only">{t('feed_filter_sector', 'Sector')}</span>
                            <HiOutlineFunnel className="pointer-events-none absolute start-3 h-4 w-4 text-slate-400" aria-hidden />
                            <select
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                                className="appearance-none rounded-xl bg-slate-100/80 py-2 pe-9 ps-9 text-sm font-bold text-slate-700 outline-hidden transition hover:bg-slate-200/70 focus:ring-2 focus:ring-brand/30"
                            >
                                <option value="">{t('feed_all_sectors', 'All sectors')}</option>
                                {sectors.map((s) => (
                                    <option key={s.slug} value={s.slug}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <HiOutlineChevronDown className="pointer-events-none absolute end-3 h-4 w-4 text-slate-400" aria-hidden />
                        </label>
                    </div>
                </div>

                {err ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span>{err}</span>
                        <button
                            type="button"
                            onClick={() => setReloadKey((k) => k + 1)}
                            className="sc-press inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 transition hover:bg-red-100/60"
                        >
                            <HiOutlineArrowPath className="h-4 w-4" aria-hidden />
                            {t('feed_retry', 'Try again')}
                        </button>
                    </div>
                ) : null}

                {loading ? (
                    <FeedSkeleton />
                ) : posts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
                            <HiOutlineUsers className="h-7 w-7" aria-hidden />
                        </span>
                        <p className="mt-4 text-base font-bold text-slate-700">{t('feed_no_posts', 'No posts yet')}</p>
                        <p className="mt-1 text-sm text-slate-500">{t('feed_no_posts_hint', 'Be the first to share an opportunity with your sector.')}</p>
                        <Link
                            to="/community/create"
                            className="sc-press mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
                        >
                            <HiOutlinePencilSquare className="h-5 w-5" aria-hidden />
                            {t('community_hero_cta', 'Start a post')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {posts.map((p, i) => (
                            <PostCard key={p.id} post={p} index={i} onDeleted={removePost} />
                        ))}
                    </div>
                )}

                {hasMore ? (
                    <div className="flex justify-center pt-1">
                        <button
                            type="button"
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="sc-press inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-[0_8px_30px_-22px_rgba(15,23,42,.4)] ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <HiOutlineArrowPath className={`h-4 w-4 ${loadingMore ? 'animate-spin' : ''}`} aria-hidden />
                            {loadingMore ? t('loading', 'Loading…') : t('feed_load_more', 'Load more')}
                        </button>
                    </div>
                ) : null}
            </div>
        </CommunityShell>
    );
}
