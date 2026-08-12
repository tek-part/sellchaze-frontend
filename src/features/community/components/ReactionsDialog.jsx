import { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiHeart, HiOutlineCheckBadge, HiOutlineXMark } from 'react-icons/hi2';
import api from '../../../api/client';
import notify from '../../../components/ui/notify';
import { initials } from '../../../components/feed/helpers';

const TYPES = [
    { id: '', labelKey: 'reactions_all', emoji: null },
    { id: 'like', labelKey: 'feed_like', emoji: '❤️' },
    { id: 'celebrate', labelKey: 'feed_react_celebrate', emoji: '👏' },
    { id: 'insightful', labelKey: 'feed_react_insightful', emoji: '💡' },
    { id: 'support', labelKey: 'feed_react_support', emoji: '🤝' },
    { id: 'interested', labelKey: 'feed_react_interested', emoji: '🎯' },
];

const ROLE_KEYS = { supplier: 'role_supplier', merchant: 'role_merchant', user: 'role_user' };

/**
 * Who reacted to a post: tabs per reaction type with counts in the header,
 * rows with role + follow-back, straight from GET /posts/{id}/reactions.
 */
export default function ReactionsDialog({ postId, open, onClose }) {
    const { t } = useTranslation();
    const [type, setType] = useState('');
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(false);
    const [followBusy, setFollowBusy] = useState(null);

    useEffect(() => {
        if (!open) return undefined;
        let alive = true;
        setLoading(true);
        api.get(`/posts/${postId}/reactions`, { params: { ...(type ? { type } : {}), per_page: 30 } })
            .then(({ data }) => {
                if (!alive) return;
                setRows(data.data ?? []);
                setSummary(data.meta?.summary ?? {});
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
    }, [open, postId, type]);

    const follow = async (userId) => {
        setFollowBusy(userId);
        try {
            await api.post('/follows', { user_id: userId });
            setRows((prev) => prev.map((row) => (row.user.id === userId ? { ...row, user: { ...row.user, is_following: true } } : row)));
            notify.success(t('toast_following', 'Now following'));
        } catch {
            notify.error(t('toast_failed', 'Something went wrong'));
        } finally {
            setFollowBusy(null);
        }
    };

    const emojiFor = (rowType) => TYPES.find((entry) => entry.id === rowType)?.emoji ?? '❤️';

    return (
        <Dialog open={open} onClose={() => onClose?.()} className="relative z-[90]">
            <DialogBackdrop transition className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition duration-200 data-closed:opacity-0" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel
                    transition
                    className="flex max-h-[80dvh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 transition duration-200 data-closed:scale-95 data-closed:opacity-0"
                >
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
                                <HiHeart className="h-5 w-5" aria-hidden />
                            </span>
                            {t('reactions_title', 'Reactions')}
                        </DialogTitle>
                        <button type="button" onClick={() => onClose?.()} aria-label={t('action_cancel', 'Cancel')} className="sc-press rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
                            <HiOutlineXMark className="h-5 w-5" aria-hidden />
                        </button>
                    </div>

                    {/* Type tabs with live counts */}
                    <div className="sc-rail flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
                        {TYPES.map((entry) => {
                            const count = entry.id ? summary[entry.id] ?? 0 : Object.values(summary).reduce((sum, n) => sum + (Number(n) || 0), 0);
                            if (entry.id && !count) return null;
                            return (
                                <button
                                    key={entry.id || 'all'}
                                    type="button"
                                    onClick={() => setType(entry.id)}
                                    aria-pressed={type === entry.id}
                                    className={`sc-press shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                                        type === entry.id ? 'bg-brand text-white shadow-md shadow-brand/25' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                                    }`}
                                >
                                    {entry.emoji ? `${entry.emoji} ` : ''}{t(entry.labelKey)}{count ? ` ${count}` : ''}
                                </button>
                            );
                        })}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-3">
                        {loading ? (
                            <div className="space-y-2 p-2" aria-hidden>
                                {Array.from({ length: 4 }, (_, i) => <div key={i} className="sc-skeleton h-12 rounded-xl" />)}
                            </div>
                        ) : rows.length === 0 ? (
                            <p className="py-10 text-center text-sm text-slate-400">{t('no_results', 'No results')}</p>
                        ) : (
                            rows.map((row) => (
                                <div key={`${row.user.id}-${row.type}`} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50">
                                    <span className="relative shrink-0">
                                        {row.user.photo ? (
                                            <img src={row.user.photo} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200" />
                                        ) : (
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                                                {initials(row.user.company || row.user.name)}
                                            </span>
                                        )}
                                        <span className="absolute -bottom-1 -end-1 text-sm" aria-hidden>{emojiFor(row.type)}</span>
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        {row.user.username ? (
                                            <Link to={`/community/u/${row.user.username}`} onClick={() => onClose?.()} className="flex items-center gap-1 truncate text-sm font-bold text-slate-900 hover:underline">
                                                {row.user.company || row.user.name}
                                                {row.user.is_verified ? <HiOutlineCheckBadge className="h-4 w-4 shrink-0 text-brand" aria-hidden /> : null}
                                            </Link>
                                        ) : (
                                            <span className="block truncate text-sm font-bold text-slate-900">{row.user.company || row.user.name}</span>
                                        )}
                                        <span className="block truncate text-xs text-slate-500">
                                            {t(ROLE_KEYS[row.user.role] ?? 'role_user')}
                                            {row.user.follows_you ? ` · ${t('follows_you', 'Follows you')}` : ''}
                                        </span>
                                    </span>
                                    {!row.user.is_following ? (
                                        <button
                                            type="button"
                                            disabled={followBusy === row.user.id}
                                            onClick={() => follow(row.user.id)}
                                            className="sc-press shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
                                        >
                                            {row.user.follows_you ? t('follow_back', 'Follow back') : t('feed_follow', 'Follow')}
                                        </button>
                                    ) : null}
                                </div>
                            ))
                        )}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
