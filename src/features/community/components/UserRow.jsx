import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheck, HiOutlineCheckBadge, HiOutlinePlus } from 'react-icons/hi2';
import api from '../../../api/client';
import notify from '../../../components/ui/notify';
import { initials } from '../../../components/feed/helpers';

/**
 * One member row — the UserCardPresenter shape from the API: avatar, name,
 * role, follows-you badge and a follow / follow-back / following button.
 * Used by the connections page and people search.
 */
export default function UserRow({ user }) {
    const { t } = useTranslation();
    const [following, setFollowing] = useState(!!user.is_following);
    const [busy, setBusy] = useState(false);

    const toggle = async () => {
        if (busy) return;
        setBusy(true);
        const next = !following;
        setFollowing(next);
        try {
            if (next) await api.post('/follows', { user_id: user.id });
            else await api.delete(`/follows/${user.id}`);
            if (next) notify.success(t('toast_following', 'Now following'));
        } catch {
            setFollowing(!next);
            notify.error(t('toast_failed', 'Something went wrong'));
        } finally {
            setBusy(false);
        }
    };

    const label = user.company || user.name;

    return (
        <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50">
            {user.username ? (
                <Link to={`/community/u/${user.username}`} className="shrink-0">
                    {user.photo ? (
                        <img src={user.photo} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-200" />
                    ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">{initials(label)}</span>
                    )}
                </Link>
            ) : user.photo ? (
                <img src={user.photo} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
            ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">{initials(label)}</span>
            )}

            <span className="min-w-0 flex-1">
                {user.username ? (
                    <Link to={`/community/u/${user.username}`} className="flex items-center gap-1 truncate text-sm font-bold text-slate-900 hover:underline">
                        {label}
                        {user.is_verified ? <HiOutlineCheckBadge className="h-4 w-4 shrink-0 text-brand" aria-hidden /> : null}
                    </Link>
                ) : (
                    <span className="block truncate text-sm font-bold text-slate-900">{label}</span>
                )}
                <span className="block truncate text-xs text-slate-500">
                    {t(`role_${user.role}`, user.role)}
                    {user.follows_you ? ` · ${t('follows_you', 'Follows you')}` : ''}
                </span>
            </span>

            <button
                type="button"
                disabled={busy}
                onClick={toggle}
                className={`sc-press inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                    following ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-brand text-white hover:bg-brand-dark'
                }`}
            >
                {following ? (
                    <><HiOutlineCheck className="h-3.5 w-3.5" aria-hidden />{t('feed_following', 'Following')}</>
                ) : (
                    <><HiOutlinePlus className="h-3.5 w-3.5" aria-hidden />{user.follows_you ? t('follow_back', 'Follow back') : t('feed_follow', 'Follow')}</>
                )}
            </button>
        </div>
    );
}
