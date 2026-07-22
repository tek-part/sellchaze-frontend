import { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineBell } from 'react-icons/hi2';
import api from '../api/client';
import { useBrowserNotificationPermission } from '../hooks/useBrowserNotificationPermission';
import { followNotificationLink, mapServerNotification } from '../utils/mapServerNotification';

/** @typedef {{ id: string, title: string, body: string, read: boolean, at: number, link?: string }} DisplayItem */

const POLL_MS = 45000;

/**
 * @param {{ isSupplier?: boolean }} props
 */
export default function NotificationsMenu({ isSupplier = false }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [items, setItems] = useState(/** @type {DisplayItem[]} */ ([]));
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const nativeShownRef = useRef(new Set());
    const { permission, supported, requestPermission } = useBrowserNotificationPermission();

    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('sellchase_access_token');
        if (!token) {
            setItems([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get('/notifications', { params: { per_page: 30 } });
            const rows = Array.isArray(data?.data) ? data.data : [];
            const mapped = rows.map((row) => mapServerNotification(row, t, { isSupplier }));
            setItems(mapped);
            const uc = typeof data?.unread_count === 'number' ? data.unread_count : mapped.filter((i) => !i.read).length;
            setUnreadCount(uc);

            if (permission === 'granted' && typeof Notification !== 'undefined') {
                const newUnread = mapped.filter((i) => !i.read && !nativeShownRef.current.has(i.id));
                for (const n of newUnread.slice(0, 3)) {
                    nativeShownRef.current.add(n.id);
                    try {
                        new Notification(t('app_name'), {
                            body: `${n.title}: ${n.body}`.slice(0, 180),
                            icon: '/icon.png',
                        });
                    } catch {
                        /* ignore */
                    }
                }
            }
        } catch {
            /* offline or 401 */
        } finally {
            setLoading(false);
        }
    }, [t, permission, isSupplier]);

    useEffect(() => {
        void fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const id = setInterval(() => {
            void fetchNotifications();
        }, POLL_MS);
        return () => clearInterval(id);
    }, [fetchNotifications]);

    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === 'visible') {
                void fetchNotifications();
            }
        };
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, [fetchNotifications]);

    async function handleEnableBrowser() {
        const p = await requestPermission();
        if (p === 'granted') {
            toast.success(t('notifications_enabled_toast'));
            try {
                new Notification(t('app_name'), {
                    body: t('notifications_test_native'),
                    icon: '/icon.png',
                });
            } catch {
                /* ignore */
            }
        } else if (p === 'denied') {
            toast.error(t('notifications_denied_toast'));
        } else if (p === 'unsupported') {
            toast.error(t('notifications_unsupported'));
        }
    }

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
        } catch {
            /* ignore */
        }
    }

    function onItemClick(item, close) {
        void markRead(item.id);
        close?.();
        followNotificationLink(item.link, navigate);
    }

    const unread = unreadCount;

    return (
        <Menu as="div" className="relative">
            <MenuButton
                type="button"
                aria-label={t('notifications_aria')}
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-xs outline-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/30"
            >
                <HiOutlineBell className="h-5 w-5" aria-hidden />
                {unread > 0 ? (
                    <span className="absolute inset-e-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[10px] font-bold text-white shadow-xs">
                        {unread > 9 ? '9+' : unread}
                    </span>
                ) : null}
            </MenuButton>
            <MenuItems
                transition
                anchor="bottom end"
                modal={false}
                className="z-50 mt-2 flex max-h-[min(24rem,calc(100dvh-8rem))] w-[min(calc(100vw-2rem),20rem)] flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white py-1 shadow-lg outline-hidden transition duration-100 ease-out [--anchor-gap:0.5rem] data-closed:scale-95 data-closed:opacity-0"
            >
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                    <span className="text-sm font-semibold text-slate-900">{t('notifications_title')}</span>
                    {unread > 0 ? (
                        <button
                            type="button"
                            onClick={() => void markAllRead()}
                            className="text-xs font-medium text-brand hover:text-brand-dark"
                        >
                            {t('notifications_mark_all')}
                        </button>
                    ) : null}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {loading ? (
                        <p className="px-3 py-8 text-center text-sm text-slate-500">{t('loading')}</p>
                    ) : items.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-slate-500">{t('notifications_empty')}</p>
                    ) : (
                        items.map((item) => (
                            <MenuItem key={item.id}>
                                {({ focus, close }) => (
                                    <button
                                        type="button"
                                        onClick={() => onItemClick(item, close)}
                                        className={[
                                            'w-full border-b border-slate-50 px-3 py-2.5 text-start transition-colors last:border-b-0',
                                            focus ? 'bg-slate-50' : '',
                                            !item.read ? 'bg-brand-light/30' : 'bg-white',
                                            item.link ? 'cursor-pointer' : 'cursor-default',
                                        ].join(' ')}
                                    >
                                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.body}</p>
                                    </button>
                                )}
                            </MenuItem>
                        ))
                    )}
                </div>
                <div className="shrink-0 border-t border-slate-100 p-2">
                    <MenuItem>
                        {({ focus, close }) => (
                            <Link
                                to="/notifications"
                                onClick={() => close()}
                                className={[
                                    'block w-full rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-brand transition-colors',
                                    focus ? 'bg-brand-light/50 ring-1 ring-brand/20' : 'hover:bg-brand-light/30',
                                ].join(' ')}
                            >
                                {t('notifications_view_all')}
                            </Link>
                        )}
                    </MenuItem>
                </div>
                {supported && permission !== 'granted' ? (
                    <div className="shrink-0 border-t border-slate-100 p-2">
                        <button
                            type="button"
                            onClick={() => void handleEnableBrowser()}
                            className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                        >
                            {t('notifications_enable')}
                        </button>
                        <p className="mt-1.5 px-1 text-center text-[11px] text-slate-500">
                            {t('notifications_enable_hint')}
                        </p>
                    </div>
                ) : null}
                {supported && permission === 'granted' ? (
                    <div className="shrink-0 border-t border-slate-100 bg-accent-light/40 px-3 py-2 text-center text-[11px] font-medium text-accent-dark">
                        {t('notifications_browser_on')}
                    </div>
                ) : null}
                {!supported ? (
                    <div className="shrink-0 border-t border-slate-100 px-3 py-2 text-center text-[11px] text-slate-500">
                        {t('notifications_unsupported')}
                    </div>
                ) : null}
            </MenuItems>
        </Menu>
    );
}
