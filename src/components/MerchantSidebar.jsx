import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineBars3, HiOutlineEye, HiOutlineMagnifyingGlass } from './workspace/WorkspaceIcons';
import SidebarNav from './SidebarNav';
import MerchantSidebarFooter from './workspace/MerchantSidebarFooter';
import useWorkspaceCopy from './workspace/workspaceCopy';

/** One permission-aware, searchable rail for owners, employees and administrators. */
export default function MerchantSidebar({ me, permissions, storeUrl, onCollapse, onExpand, onSearch, toggleButtonRef, collapsed = false, admin = false }) {
    const { t } = useTranslation(); const ws = useWorkspaceCopy();
    const [expandedGroup, setExpandedGroup] = useState('');
    if (collapsed) return <aside className="ws-sidebar ws-sidebar-compact ws-desktop-sidebar" aria-label={ws('navigation')}>
        <div className="ws-sidebar-brand"><button ref={toggleButtonRef} type="button" onClick={onExpand} className="ws-icon-button" aria-label={ws('expand')} title={ws('expand')} aria-expanded="false" aria-controls="workspace-sidebar"><HiOutlineBars3 aria-hidden /></button></div>
        <div className="ws-sidebar-tools">
            {storeUrl ? <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="ws-icon-button" aria-label={t('view_store', 'View store')} title={t('view_store', 'View store')}><HiOutlineEye aria-hidden /></a> : null}
            <button type="button" className="ws-icon-button" onClick={onSearch} aria-label={ws('searchTitle')} title={ws('searchTitle')}><HiOutlineMagnifyingGlass aria-hidden /></button>
        </div>
        <div className="ws-sidebar-scroll"><SidebarNav exclusive={admin} isAdmin={me.roles?.includes('Admin')} isSupplier={me.roles?.includes('Supplier')} roles={me.roles ?? []} permissions={permissions} compact onExpand={(key) => { setExpandedGroup(key); onExpand(); }} /></div>
    </aside>;
    return <aside className="ws-sidebar ws-desktop-sidebar" aria-label={ws('navigation')}>
        <div className="ws-sidebar-brand"><Link to={admin ? '/admin/dashboard' : '/dashboard'}><img src="/icon.png" alt="" /><strong>Sellchaze</strong></Link><div className="ws-sidebar-brand-actions">{storeUrl ? <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="ws-icon-button" aria-label={t('view_store', 'View store')} title={t('view_store', 'View store')}><HiOutlineEye aria-hidden /></a> : null}<button ref={toggleButtonRef} type="button" onClick={onCollapse} className="ws-icon-button" aria-label={ws('collapse')} aria-expanded="true" aria-controls="workspace-sidebar"><HiOutlineBars3 aria-hidden /></button></div></div>
        <div className={`ws-sidebar-scroll${admin ? '' : ' ws-sidebar-scroll--merchant'}`}><SidebarNav exclusive={admin} isAdmin={me.roles?.includes('Admin')} isSupplier={me.roles?.includes('Supplier')} roles={me.roles ?? []} permissions={permissions} expandedGroup={expandedGroup} onNavigate={() => setExpandedGroup('')} />
            {!admin && me.roles?.some(role => ['Merchant', 'Supplier'].includes(role)) && !me.parent_user_id ? <MerchantSidebarFooter /> : null}
        </div>
    </aside>;
}
