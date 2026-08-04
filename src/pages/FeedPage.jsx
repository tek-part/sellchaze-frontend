import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineUsers } from 'react-icons/hi2';
import api from '../api/client';
import { langParam } from '../api/lang';
import PostComposer from '../components/feed/PostComposer';
import PostCard from '../components/feed/PostCard';
import CommunityWelcome from '../components/feed/CommunityWelcome';
import FollowSuggestions from '../components/feed/FollowSuggestions';

export default function FeedPage() {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [scope, setScope] = useState('all'); // 'all' | 'mine'
    const [sector, setSector] = useState(''); // sector slug ('' = all sectors)
    const [sectors, setSectors] = useState([]);

    const [posts, setPosts] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [err, setErr] = useState('');

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
    }, [fetchPage]);

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

    const prependPost = (post) => {
        if (!post) return;
        setPosts((prev) => [post, ...prev]);
        setMeta((m) => (m ? { ...m, total: (m.total ?? 0) + 1 } : m));
    };

    const removePost = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));

    const hasMore = meta && (meta.current_page ?? 1) < (meta.last_page ?? 1);

    const scopeTabs = [
        { id: 'mine', label: t('feed_scope_mine', 'My sector') },
        { id: 'all', label: t('feed_scope_all', 'All') },
    ];

    return (
        <div className="mx-auto max-w-2xl space-y-5">
            <div className="flex items-center gap-3 border-s-4 border-brand ps-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
                        <HiOutlineUsers className="h-6 w-6 text-brand" aria-hidden />
                        {t('feed_title', 'Community')}
                    </h1>
                </div>
            </div>

            <PostComposer onCreated={prependPost} />

            {/* Welcome + "follow these" — the community on-ramp for new members. */}
            <CommunityWelcome />
            <FollowSuggestions />

            {/* Filter bar: scope tabs + sector select */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                    {scopeTabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setScope(tab.id)}
                            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                                scope === tab.id ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-hidden transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                    <option value="">{t('feed_all_sectors', 'All sectors')}</option>
                    {sectors.map((s) => (
                        <option key={s.slug} value={s.slug}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>

            {err ? (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            ) : null}

            {loading ? (
                <p className="py-10 text-center text-sm text-slate-400">{t('loading', 'Loading…')}</p>
            ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center">
                    <HiOutlineUsers className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
                    <p className="mt-3 text-sm font-medium text-slate-500">{t('feed_no_posts', 'No posts yet')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((p) => (
                        <PostCard key={p.id} post={p} onDeleted={removePost} />
                    ))}
                </div>
            )}

            {hasMore ? (
                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loadingMore ? t('loading', 'Loading…') : t('feed_load_more', 'Load more')}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
