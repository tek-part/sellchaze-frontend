import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineUsers } from 'react-icons/hi2';
import api from '../api/client';
import CommunityShell from '../features/community/components/CommunityShell';
import UserRow from '../features/community/components/UserRow';

/**
 * A member's follow graph: followers / following in two tabs. With no
 * username in the URL it shows the viewer's own connections.
 */
export default function CommunityConnectionsPage() {
    const { username } = useParams();
    const [params] = useSearchParams();
    const { t } = useTranslation();

    const [tab, setTab] = useState(params.get('tab') === 'following' ? 'following' : 'followers');
    const [userId, setUserId] = useState(null);
    const [missing, setMissing] = useState(false);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    // Resolve the subject: the given username, or the viewer themself.
    useEffect(() => {
        let alive = true;
        setMissing(false);
        setUserId(null);
        const request = username
            ? api.get(`/public/profile/${encodeURIComponent(username)}`).then(({ data }) => data.user?.id)
            : api.get('/auth/me').then(({ data }) => (data.user || data)?.id);
        request
            .then((id) => {
                if (!alive) return;
                if (id) setUserId(id);
                else setMissing(true);
            })
            .catch(() => {
                if (alive) setMissing(true);
            });
        return () => {
            alive = false;
        };
    }, [username]);

    useEffect(() => {
        if (!userId) return undefined;
        let alive = true;
        setLoading(true);
        api.get(`/users/${userId}/${tab}`, { params: { per_page: 30 } })
            .then(({ data }) => {
                if (alive) setRows(data.data ?? []);
            })
            .catch(() => {
                if (alive) setRows([]);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [userId, tab]);

    return (
        <CommunityShell rightRail={false}>
            <div className="space-y-5">
                <div className="rounded-2xl bg-white shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                    <h1 className="flex items-center gap-2 px-5 pt-5 text-lg font-bold tracking-tight text-slate-900">
                        <HiOutlineUsers className="h-5 w-5 text-brand" aria-hidden />
                        {t('connections_title', 'Connections')}
                        {username ? <span className="text-sm font-semibold text-slate-400">@{username}</span> : null}
                    </h1>
                    <div className="mt-3 flex gap-1 border-t border-slate-100 px-3">
                        {[['followers', t('followers_title', 'Followers')], ['following', t('following_title', 'Following')]].map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                aria-pressed={tab === id}
                                className={`sc-press relative px-4 py-3 text-sm font-bold transition ${
                                    tab === id ? 'text-brand' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {label}
                                <span className={`absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-brand transition-transform duration-300 ${tab === id ? 'scale-x-100' : 'scale-x-0'}`} aria-hidden />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-3 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                    {missing ? (
                        <p className="py-12 text-center text-sm font-bold text-slate-500">{t('profile_not_found', 'This profile is not available')}</p>
                    ) : loading ? (
                        <div className="space-y-2 p-2" aria-hidden>
                            {Array.from({ length: 5 }, (_, i) => <div key={i} className="sc-skeleton h-14 rounded-xl" />)}
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="py-12 text-center text-sm text-slate-400">{t('no_results', 'No results')}</p>
                    ) : (
                        rows.map((user) => <UserRow key={user.id} user={user} />)
                    )}
                </div>
            </div>
        </CommunityShell>
    );
}
