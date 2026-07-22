import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineBell } from 'react-icons/hi2';
import api from '../api/client';
import PaginationBar from '../components/table/PaginationBar';
import { followNotificationLink, mapServerNotification } from '../utils/mapServerNotification';

const PER_PAGE = 25;

export default function NotificationsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isSupplier } = useOutletContext() ?? {};
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [err, setErr] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setErr('');
        try {
            const { data } = await api.get('/notifications', { params: { per_page: PER_PAGE, page } });
            const rows = Array.isArray(data?.data) ? data.data : [];
            const mapped = rows.map((row) => mapServerNotification(row, t, { isSupplier }));
            setItems(mapped);
            setMeta(data?.meta ?? null);
            const uc =
                typeof data?.unread_count === 'number' ? data.unread_count : mapped.filter((i) => !i.read).length;
            setUnreadCount(uc);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
            setItems([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    }, [t, page, isSupplier]);

    useEffect(() => {
        void load();
    }, [load]);

    async function markRead(id) {
        try {
            await api.post(`/notifications/${encodeURIComponent(id)}/read`);
            setItems((prev) => prev.map((it) => (it.id === id ? { ...it, read: true } : it)));
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            /* ignore */
        }
    }

    async function markAllRead() {
        try {
            await api.post('/notifications/read-all');
            setItems((prev) => prev.map((it) => ({ ...it, read: true })));
            setUnreadCount(0);
            toast.success(t('notifications_all_read_toast'));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    }

    function onRowClick(item) {
        void markRead(item.id);
        followNotificationLink(item.link, navigate);
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-8"
            >
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/15">
                        <HiOutlineBell className="h-6 w-6" aria-hidden />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            {t('notifications_page_title')}
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">{t('notifications_page_subtitle')}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    {unreadCount > 0 ? (
                        <button
                            type="button"
                            onClick={() => void markAllRead()}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand shadow-xs transition hover:bg-slate-50"
                        >
                            {t('notifications_mark_all')}
                        </button>
                    ) : null}
                    <Link
                        to="/dashboard"
                        className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
                    >
                        {t('dashboard')}
                    </Link>
                </div>
            </motion.div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                {err ? (
                    <p className="p-6 text-center text-sm text-red-600">{err}</p>
                ) : loading && items.length === 0 ? (
                    <p className="p-10 text-center text-sm text-slate-500">{t('loading')}</p>
                ) : items.length === 0 ? (
                    <p className="p-10 text-center text-sm text-slate-500">{t('notifications_empty')}</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {items.map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    onClick={() => onRowClick(item)}
                                    className={[
                                        'flex w-full gap-4 px-4 py-4 text-start transition hover:bg-slate-50/90 sm:px-6',
                                        !item.read ? 'bg-brand-light/25' : '',
                                        item.link ? 'cursor-pointer' : 'cursor-default',
                                    ].join(' ')}
                                >
                                    <span
                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-slate-200' : 'bg-accent'}`}
                                        aria-hidden
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
                                        <p className="mt-2 text-xs text-slate-400">
                                            {new Date(item.at).toLocaleString()}
                                        </p>
                                        {!item.link ? (
                                            <p className="mt-1 text-xs text-slate-400">{t('notifications_no_link_hint')}</p>
                                        ) : null}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <PaginationBar meta={meta} onPageChange={setPage} loading={loading} />
            </div>
        </div>
    );
}
