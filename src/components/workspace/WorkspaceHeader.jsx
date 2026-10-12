import { Menu, MenuButton, MenuItem, MenuItems, MenuSeparator } from '@headlessui/react';
import { useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowPath, HiOutlineBars3, HiOutlineMagnifyingGlass,
    HiOutlineLanguage, HiOutlineChevronDown, HiOutlineArrowTopRightOnSquare, HiOutlineEye, HiOutlineUserCircle, HiOutlineArrowRightOnRectangle,
    HiOutlineChatBubbleLeftRight, HiOutlineSignal, HiOutlineClipboardDocumentList,
} from './WorkspaceIcons';
import { FaWhatsapp } from 'react-icons/fa';
import UserAvatar from '../UserAvatar';
import NotificationsMenu from '../NotificationsMenu';
import NotificationBell from './NotificationBell';
import { CHAT_ENABLED } from '../../lib/features';
import useWorkspaceCopy from './workspaceCopy';
import WorkspaceAppearanceControl from './WorkspaceAppearanceControl';

const subscribeMobile = (listener) => {
    const query = window.matchMedia('(max-width: 767px)');
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
};
const getMobile = () => window.matchMedia('(max-width: 767px)').matches;

export default function WorkspaceHeader({ me, storeUrl, isSupplier, permissions, appearance, onLanguage, onNavigation, onToggleSidebar, sidebarToggleRef, collapsed, onSearch, onLogout, chatUnread, merchantWorkspace = false }) {
    const { t, i18n } = useTranslation(); const ws = useWorkspaceCopy();
    const mobile = useSyncExternalStore(subscribeMobile, getMobile, () => false);
    const iconButton = 'ws-icon-button'; const menuRow = 'ws-menu-row';
    const publicSlug = me.username || me.profile?.username || `user_${me.id}`;
    return <header className="ws-header">
        <div className="ws-header-start">
            <button type="button" className={`${iconButton} ws-mobile-menu`} onClick={onNavigation} aria-label={ws('openNavigation')}><HiOutlineBars3 aria-hidden /></button>
            <button ref={sidebarToggleRef} type="button" className={`${iconButton} ws-expand`} onClick={onToggleSidebar} aria-label={ws(collapsed ? 'expand' : 'collapse')} aria-expanded={!collapsed} aria-controls="workspace-sidebar"><HiOutlineBars3 aria-hidden /></button>
        </div>
        {mobile ? <Link className="ws-mobile-brand" to="/dashboard" aria-label={t('dashboard')}><img src="/icon.png" alt="" /><strong>Sellchaze</strong></Link> : null}
        <div className="ws-header-actions">
            {storeUrl ? <a href={storeUrl} target="_blank" rel="noopener noreferrer" className={`${iconButton} ws-store-link`} aria-label={t('view_store', 'View store')} title={t('view_store', 'View store')}><HiOutlineEye aria-hidden /></a> : null}
            <button type="button" className={`${iconButton} ws-refresh`} onClick={() => window.location.reload()} aria-label={ws('refresh')} title={ws('refresh')}><HiOutlineArrowPath aria-hidden /></button>
            {!mobile ? <WorkspaceAppearanceControl appearance={appearance} /> : null}
            {!mobile ? <button type="button" onClick={onLanguage} className={iconButton} aria-label={ws('language')} title={i18n.language.startsWith('ar') ? 'English' : 'العربية'}><HiOutlineLanguage aria-hidden /></button> : null}
            {merchantWorkspace ? <NotificationBell /> : <NotificationsMenu isSupplier={isSupplier} />}
            {!merchantWorkspace && CHAT_ENABLED ? <Link to="/chat" className={`${iconButton} ws-chat-link`} aria-label={t('nav_messages', 'Messages')}><HiOutlineChatBubbleLeftRight aria-hidden />{chatUnread > 0 ? <span className="ws-notification-dot">{chatUnread > 99 ? '99+' : chatUnread}</span> : null}</Link> : null}
            <Menu as="div" className="relative">
                <MenuButton className="ws-account-button" aria-label={t('user_menu_aria', { name: me.name })}>
                    <UserAvatar user={me} alt="" sizeClass="h-8 w-8" /><span className="ws-account-name"><small>{ws('hello')}</small><strong>{me.name}</strong></span><HiOutlineChevronDown aria-hidden className="ws-account-chevron" />
                </MenuButton>
                <MenuItems transition anchor="bottom end" className="ws-menu ws-account-menu">
                    <div className="ws-account-summary"><strong>{me.name}</strong><span>{me.email}</span></div>
                    <MenuItem><button type="button" onClick={onSearch} className={menuRow} aria-keyshortcuts="Control+K Meta+K"><HiOutlineMagnifyingGlass aria-hidden />{ws('searchTitle')}<kbd className="ws-menu-shortcut">Ctrl K</kbd></button></MenuItem>
                    <MenuItem><Link to="/settings/profile" className={menuRow}><HiOutlineUserCircle aria-hidden />{t('nav_profile', 'My profile')}</Link></MenuItem>
                    <MenuItem><Link to={`/u/${publicSlug}`} className={menuRow}><HiOutlineArrowTopRightOnSquare aria-hidden />{t('view_public_profile', 'View public profile')}</Link></MenuItem>
                    {!merchantWorkspace ? <MenuItem><Link to="/" className={menuRow}><HiOutlineArrowTopRightOnSquare aria-hidden />{t('nav_visit_website', 'Visit website')}</Link></MenuItem> : null}
                    {storeUrl ? <MenuItem><a href={storeUrl} target="_blank" rel="noopener noreferrer" className={menuRow}><HiOutlineArrowTopRightOnSquare aria-hidden />{t('view_store', 'View store')}</a></MenuItem> : null}
                    {!merchantWorkspace && permissions.includes('wavex-access') ? <MenuItem><Link to="/wavex/chats" className={menuRow}><FaWhatsapp aria-hidden />{t('wavex_nav_chats')}</Link></MenuItem> : null}
                    {!merchantWorkspace && permissions.includes('monitoring-live-view') ? <MenuItem><Link to="/admin/monitoring/live" className={menuRow}><HiOutlineSignal aria-hidden />{t('monitoring_live_title', 'Live monitoring')}</Link></MenuItem> : null}
                    {!merchantWorkspace && permissions.includes('activity-logs-list') ? <MenuItem><Link to="/admin/activity" className={menuRow}><HiOutlineClipboardDocumentList aria-hidden />{t('activity_logs', 'Activity logs')}</Link></MenuItem> : null}
                    <MenuSeparator className="ws-menu-separator" />
                    {!mobile ? <MenuItem><button type="button" onClick={onLanguage} className={menuRow}><HiOutlineLanguage aria-hidden />{i18n.language.startsWith('ar') ? 'English' : 'العربية'}</button></MenuItem> : null}
                    <MenuItem><button type="button" onClick={onLogout} className={`${menuRow} ws-menu-danger`}><HiOutlineArrowRightOnRectangle aria-hidden />{t('logout')}</button></MenuItem>
                </MenuItems>
            </Menu>
        </div>
    </header>;
}
