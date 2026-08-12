import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheckBadge, HiOutlinePlus, HiOutlineCheck } from 'react-icons/hi2';
import api from '../../api/client';

/**
 * "Follow these" — companies in the member's own sector that they don't follow
 * yet. Shown in the community sidebar so a new member has someone to follow
 * from their first visit. Hides itself once there is nothing left to suggest.
 */
export default function FollowSuggestions() {
    const { t } = useTranslation();
    const [suggestions, setSuggestions] = useState([]);
    const [followed, setFollowed] = useState(() => new Set());
    const [busy, setBusy] = useState(null);

    useEffect(() => {
        let active = true;
        api.get('/me/follow-suggestions', { params: { limit: 5 } })
            .then((res) => { if (active) setSuggestions(res.data?.suggestions ?? []); })
            .catch(() => { if (active) setSuggestions([]); });
        return () => { active = false; };
    }, []);

    const follow = async (id) => {
        setBusy(id);
        try {
            await api.post('/follows', { user_id: id });
            setFollowed((prev) => new Set(prev).add(id));
        } catch {
            /* leave the row actionable so the member can retry */
        } finally {
            setBusy(null);
        }
    };

    if (suggestions.length === 0) return null;

    return (
        <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_-22px_rgba(15,23,42,.4)] ring-1 ring-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900">{t('feed_follow_title', 'Follow these')}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
                {t('feed_follow_hint', 'Companies in your sector.')}
            </p>

            <ul className="mt-4 space-y-3">
                {suggestions.map((s) => {
                    const isFollowed = followed.has(s.id);
                    const label = s.company || s.name;
                    return (
                        <li key={s.id} className="flex items-center gap-3">
                            <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand"
                                aria-hidden
                            >
                                {(label || '?').charAt(0)}
                            </span>
                            <span className="min-w-0 flex-1">
                                {s.username ? (
                                    <Link to={`/u/${s.username}`} className="block truncate text-sm font-semibold text-slate-800 hover:text-brand">
                                        {label}
                                    </Link>
                                ) : (
                                    <span className="block truncate text-sm font-semibold text-slate-800">{label}</span>
                                )}
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                    {s.is_verified ? <HiOutlineCheckBadge className="h-3.5 w-3.5 text-brand" aria-hidden /> : null}
                                    {s.city || t('feed_follow_member', 'Member')}
                                </span>
                            </span>
                            <button
                                type="button"
                                disabled={isFollowed || busy === s.id}
                                onClick={() => follow(s.id)}
                                className={`sc-press inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                                    isFollowed
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-brand text-white hover:bg-brand-dark disabled:opacity-50'
                                }`}
                            >
                                {isFollowed ? (
                                    <>
                                        <HiOutlineCheck className="h-3.5 w-3.5" aria-hidden />
                                        {t('feed_following', 'Following')}
                                    </>
                                ) : (
                                    <>
                                        <HiOutlinePlus className="h-3.5 w-3.5" aria-hidden />
                                        {t('feed_follow', 'Follow')}
                                    </>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
