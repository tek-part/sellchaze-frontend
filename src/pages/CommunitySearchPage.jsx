import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineHashtag, HiOutlineMagnifyingGlass, HiOutlineUserGroup } from 'react-icons/hi2';
import api from '../api/client';
import { langParam } from '../api/lang';
import { useDebounced } from '../hooks/useDebounced';
import CommunityShell from '../features/community/components/CommunityShell';
import FeedSkeleton from '../features/community/components/FeedSkeleton';
import PostCard from '../components/feed/PostCard';
import UserRow from '../features/community/components/UserRow';

const TABS = ['all', 'posts', 'reels', 'users', 'groups', 'hashtags'];

/**
 * Unified community search: one box, six lenses. type=all renders capped
 * sections; a specific tab paginates its vertical. The query lives in the URL
 * so results are shareable and survive refresh.
 */
export default function CommunitySearchPage() {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);
    const [params, setParams] = useSearchParams();

    const [q, setQ] = useState(params.get('q') ?? '');
    const [tab, setTab] = useState(TABS.includes(params.get('type')) ? params.get('type') : 'all');
    const debounced = useDebounced(q, 350);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Keep the URL in sync so a result set can be shared or refreshed.
    useEffect(() => {
        const next = {};
        if (debounced.trim().length >= 2) next.q = debounced.trim();
        if (tab !== 'all') next.type = tab;
        setParams(next, { replace: true });
    }, [debounced, tab, setParams]);

    useEffect(() => {
        const term = debounced.trim();
        if (term.length < 2) {
            setResult(null);
            return undefined;
        }
        let alive = true;
        setLoading(true);
        api.get('/search', { params: { q: term, type: tab, lang, per_page: 15 } })
            .then(({ data }) => {
                if (alive) setResult(data);
            })
            .catch(() => {
                if (alive) setResult(null);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [debounced, tab, lang]);

    const hashtagChip = (tag) => (
        <Link
            key={tag.id}
            to={`/community/tag/${encodeURIComponent(tag.slug)}`}
            className="sc-press inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-2 text-sm font-bold text-brand-dark transition hover:bg-brand/15"
        >
            <HiOutlineHashtag className="h-4 w-4" aria-hidden />
            {tag.label}
            <span className="text-xs font-semibold text-brand/70">{tag.posts_count}</span>
        </Link>
    );

    const groupRow = (group) => (
        <Link
            key={group.id}
            to={`/community/groups/${group.id}`}
            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50"
        >
            {group.avatar_url ? (
                <img src={group.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-slate-200" />
            ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <HiOutlineUserGroup className="h-5 w-5" aria-hidden />
                </span>
            )}
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900">{group.name}</span>
                <span className="block truncate text-xs text-slate-500">{group.members_count}</span>
            </span>
        </Link>
    );

    const section = (title, children) => (
        <section className="rounded-2xl bg-white p-4 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
            <h2 className="mb-2 px-1 text-sm font-bold text-slate-900">{title}</h2>
            {children}
        </section>
    );

    const term = debounced.trim();
    const sections = result?.data && !Array.isArray(result.data) ? result.data : null;
    const list = Array.isArray(result?.data) ? result.data : null;

    return (
        <CommunityShell rightRail={false}>
            <div className="space-y-5">
                {/* Search head */}
                <div className="rounded-2xl bg-white shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                    <label className="flex items-center gap-3 px-5 pt-5">
                        <HiOutlineMagnifyingGlass className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                        <input
                            autoFocus
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder={t('community_search_placeholder', 'Search posts, reels, people, hashtags…')}
                            className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold outline-hidden transition focus:ring-2 focus:ring-brand/30"
                        />
                    </label>
                    <div className="sc-rail mt-3 flex gap-1 overflow-x-auto border-t border-slate-100 px-3">
                        {TABS.map((id) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                aria-pressed={tab === id}
                                className={`sc-press relative shrink-0 px-4 py-3 text-sm font-bold transition ${
                                    tab === id ? 'text-brand' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {t(`search_tab_${id}`)}
                                <span className={`absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-brand transition-transform duration-300 ${tab === id ? 'scale-x-100' : 'scale-x-0'}`} aria-hidden />
                            </button>
                        ))}
                    </div>
                </div>

                {term.length < 2 ? (
                    <p className="py-12 text-center text-sm font-semibold text-slate-400">{t('search_min_chars', 'Type at least 2 characters')}</p>
                ) : loading ? (
                    <FeedSkeleton count={2} />
                ) : sections ? (
                    <>
                        {sections.users?.length ? section(t('search_tab_users', 'People'), sections.users.map((u) => <UserRow key={u.id} user={u} />)) : null}
                        {sections.hashtags?.length ? section(t('search_tab_hashtags', 'Hashtags'), <div className="flex flex-wrap gap-2 px-1">{sections.hashtags.map(hashtagChip)}</div>) : null}
                        {sections.groups?.length ? section(t('search_tab_groups', 'Groups'), sections.groups.map(groupRow)) : null}
                        {sections.posts?.length ? (
                            <div className="space-y-5">{sections.posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
                        ) : null}
                        {sections.reels?.length ? (
                            <div className="space-y-5">{sections.reels.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
                        ) : null}
                        {!sections.users?.length && !sections.posts?.length && !sections.reels?.length && !sections.groups?.length && !sections.hashtags?.length ? (
                            <p className="py-12 text-center text-sm text-slate-400">{t('search_empty', 'No results for "{{q}}"', { q: term })}</p>
                        ) : null}
                    </>
                ) : list ? (
                    list.length === 0 ? (
                        <p className="py-12 text-center text-sm text-slate-400">{t('search_empty', 'No results for "{{q}}"', { q: term })}</p>
                    ) : tab === 'users' ? (
                        <div className="rounded-2xl bg-white p-3 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                            {list.map((u) => <UserRow key={u.id} user={u} />)}
                        </div>
                    ) : tab === 'groups' ? (
                        <div className="rounded-2xl bg-white p-3 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                            {list.map(groupRow)}
                        </div>
                    ) : tab === 'hashtags' ? (
                        <div className="flex flex-wrap gap-2">{list.map(hashtagChip)}</div>
                    ) : (
                        <div className="space-y-5">{list.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
                    )
                ) : (
                    <p className="py-12 text-center text-sm text-slate-400">{t('search_empty', 'No results for "{{q}}"', { q: term })}</p>
                )}
            </div>
        </CommunityShell>
    );
}
