import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowLeft, HiOutlineChatBubbleOvalLeft } from 'react-icons/hi2';
import api from '../api/client';
import PostCard from '../components/feed/PostCard';
import CommentThread from '../components/feed/CommentThread';
import FeedSkeleton from '../features/community/components/FeedSkeleton';

/**
 * A single post as a destination: the post on one side, its conversation on
 * the other — the Facebook detail shape. The comments panel scrolls on its
 * own on desktop; on a phone the two stack. Deleting the post exits back to
 * the feed.
 */
export default function CommunityPostPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [post, setPost] = useState(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        let alive = true;
        setPost(null);
        setErr('');
        api.get(`/posts/${id}`)
            .then(({ data }) => {
                if (alive) setPost(data.data);
            })
            .catch((e) => {
                if (alive) setErr(e.response?.data?.message || e.message);
            });
        return () => {
            alive = false;
        };
    }, [id]);

    return (
        <div className="mx-auto w-full max-w-[1100px]">
            <button
                type="button"
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/community'))}
                className="sc-press mb-4 inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-[0_8px_30px_-22px_rgba(15,23,42,.4)] ring-1 ring-slate-200/80 transition hover:bg-slate-50"
            >
                <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                {t('reels_back', 'Back')}
            </button>

            {err ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-20 text-center">
                    <p className="text-base font-bold text-slate-600">{t('profile_not_found', 'This profile is not available')}</p>
                </div>
            ) : !post ? (
                <FeedSkeleton count={1} />
            ) : (
                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
                    <PostCard post={post} onDeleted={() => navigate('/community')} />

                    {/* The conversation panel — its own card, its own scroll. */}
                    <aside className="rounded-2xl bg-white shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80 lg:sticky lg:top-1 lg:flex lg:max-h-[calc(100dvh/0.9-2rem)] lg:flex-col">
                        <h2 className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-bold text-slate-900">
                            <HiOutlineChatBubbleOvalLeft className="h-5 w-5 text-brand" aria-hidden />
                            {t('comments_title', 'Comments')}
                            {post.counts?.comments ? <span className="text-slate-400">({post.counts.comments})</span> : null}
                        </h2>
                        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                            {post.comments_enabled !== false ? (
                                <CommentThread
                                    postId={post.id}
                                    onCountChange={(delta) =>
                                        setPost((prev) => prev && ({
                                            ...prev,
                                            counts: { ...prev.counts, comments: Math.max(0, (prev.counts?.comments ?? 0) + delta) },
                                        }))
                                    }
                                />
                            ) : (
                                <p className="py-8 text-center text-sm text-slate-400">{t('feed_no_comments', 'No comments yet')}</p>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
