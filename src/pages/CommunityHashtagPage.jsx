import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineHashtag } from 'react-icons/hi2';
import api from '../api/client';
import { langParam } from '../api/lang';
import CommunityShell from '../features/community/components/CommunityShell';
import FeedSkeleton from '../features/community/components/FeedSkeleton';
import PostCard from '../components/feed/PostCard';

/** Every visible post under one #hashtag — where a tag link lands. */
export default function CommunityHashtagPage() {
    const { slug } = useParams();
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [tag, setTag] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(false);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setMissing(false);
        api.get(`/hashtags/${encodeURIComponent(slug)}/posts`, { params: { lang, per_page: 15 } })
            .then(({ data }) => {
                if (!alive) return;
                setTag(data.hashtag);
                setPosts(data.data ?? []);
            })
            .catch(() => {
                if (alive) setMissing(true);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [slug, lang]);

    return (
        <CommunityShell>
            <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                        <HiOutlineHashtag className="h-6 w-6" aria-hidden />
                    </span>
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">#{tag?.label ?? slug}</h1>
                        {tag ? <p className="text-xs font-semibold text-slate-500">{tag.posts_count} {t('posts_count_label', 'posts')}</p> : null}
                    </div>
                </div>

                {loading ? (
                    <FeedSkeleton count={2} />
                ) : missing || posts.length === 0 ? (
                    <p className="py-12 text-center text-sm text-slate-400">{t('feed_no_posts', 'No posts yet')}</p>
                ) : (
                    <div className="space-y-5">
                        {posts.map((post, index) => (
                            <PostCard key={post.id} post={post} index={index} onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />
                        ))}
                    </div>
                )}
            </div>
        </CommunityShell>
    );
}
