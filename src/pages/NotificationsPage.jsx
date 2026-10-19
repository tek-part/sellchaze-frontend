import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PaginationBar from '../components/table/PaginationBar';
import useNotificationFeed from '../hooks/useNotificationFeed';
import { mapServerNotification } from '../utils/mapServerNotification';
import { notificationDestination } from '../utils/notificationLinks';
import { HiCheck as HiOutlineCheck, HiOutlineArrowPath } from '../components/workspace/WorkspaceIcons';

export default function NotificationsPage() {
    const { t, i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const navigate = useNavigate(); const { isSupplier, me } = useOutletContext() ?? {};
    const admin = me?.roles?.includes('Admin') && !me.roles.some((role) => ['Merchant', 'Supplier'].includes(role));
    const [page, setPage] = useState(1); const [status, setStatus] = useState('all');
    const feed = useNotificationFeed({ page, status, onPageChange: setPage });
    const items = feed.items.map((row) => ({ ...mapServerNotification(row, t, { isSupplier }), row }));
    const date = (at) => Number.isFinite(at) ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(at)) : '';
    async function open(item) {
        const link = notificationDestination(item.link, window.location.origin, !admin);
        await feed.markRead(item.row);
        if (link) navigate(link);
    }
    return <div className="ws-notifications">
        <header className="ws-notifications-heading"><div><h1>{text('الإشعارات', 'Notifications')}</h1><p>{text('هنا تظهر الإشعارات والتنبيهات التي تساعدك في تطوير تجارتك', 'Notifications and alerts that help you grow your business appear here.')}</p></div>
            {(items.length > 0 || feed.unreadCount > 0) ? <div className="ws-notifications-actions"><button disabled={feed.loading || feed.busy} onClick={() => void feed.reload()} aria-label={text('إعادة تحميل الإشعارات', 'Reload notifications')}><HiOutlineArrowPath aria-hidden /></button>{feed.unreadCount > 0 ? <button disabled={feed.busy} onClick={() => void feed.markAllRead()}><HiOutlineCheck aria-hidden />{text('تحديد الكل كمقروء', 'Mark all as read')}</button> : null}</div> : null}
        </header>
        {feed.error ? <div role="alert" className="ws-notifications-error"><span>{feed.error}</span><button onClick={() => void feed.reload()}>{text('إعادة المحاولة', 'Retry')}</button></div> : null}
        {feed.loading ? <div role="status" className="ws-notifications-loading">{text('جارٍ تحميل الإشعارات…', 'Loading notifications…')}</div> : !feed.error && !items.length && status === 'all' ? <div className="ws-notifications-empty"><svg className="ws-notifications-empty-icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2m0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19z" /></svg><h2>{text('لا يوجد إشعارات حتى الآن', 'No notifications yet')}</h2></div> : <>
            <div className="ws-notifications-tabs" role="group" aria-label={text('حالة الإشعارات', 'Notification status')}>{[['all', text('الكل', 'All')], ['unread', text('غير مقروءة', 'Unread')], ['read', text('مقروءة', 'Read')]].map(([value, label]) => <button key={value} aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{label}{value === 'unread' && feed.unreadCount ? <span>{feed.unreadCount}</span> : null}</button>)}</div>
            {items.length ? <ul className="ws-notifications-list">{items.map((item) => {
                const link = notificationDestination(item.link, window.location.origin, !admin);
                return <li key={item.id} data-read={item.read}><span className="ws-notifications-indicator" role="img" aria-label={item.read ? text('مقروء', 'Read') : text('غير مقروء', 'Unread')} /><div><h2>{item.title}</h2><p>{item.body}</p><time dateTime={item.row.created_at}>{date(item.at)}</time></div><div className="ws-notifications-row-actions">{link ? <button disabled={feed.busy} onClick={() => void open(item)}>{text('مشاهدة', 'View')}</button> : null}{!item.read ? <button disabled={feed.busy} onClick={() => void feed.markRead(item.row)} aria-label={`${text('تحديد كمقروء', 'Mark as read')}: ${item.title}`}><HiOutlineCheck aria-hidden /></button> : null}</div></li>;
            })}</ul> : !feed.error ? <p className="ws-notifications-no-results">{text('لا توجد إشعارات بهذه الحالة.', 'No notifications with this status.')}</p> : null}
            <PaginationBar meta={feed.meta} onPageChange={setPage} loading={feed.loading || feed.busy} />
        </>}
    </div>;
}
