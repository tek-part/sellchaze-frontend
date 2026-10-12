import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineBell } from './WorkspaceIcons';
import useNotificationFeed from '../../hooks/useNotificationFeed';

export default function NotificationBell() {
    const { i18n } = useTranslation(); const { unreadCount } = useNotificationFeed({ perPage: 5 });
    return <Link to="/notifications" className="ws-icon-button relative" aria-label={`${i18n.language.startsWith('ar') ? 'مشاهدة الإشعارات' : 'View notifications'}${unreadCount ? ` (${unreadCount})` : ''}`}><HiOutlineBell aria-hidden />{unreadCount ? <span className="ws-notification-dot">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}</Link>;
}
