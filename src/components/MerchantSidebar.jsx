import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineBars3, HiOutlineEye, HiOutlineMagnifyingGlass, HiOutlineQuestionMarkCircle } from './workspace/WorkspaceIcons';
import SidebarNav from './SidebarNav';
import useWorkspaceCopy from './workspace/workspaceCopy';

/** One permission-aware, searchable rail for owners, employees and administrators. */
export default function MerchantSidebar({ me, permissions, storeUrl, onCollapse, onExpand, onSearch, collapsed = false, admin = false }) {
    const { t } = useTranslation(); const ws = useWorkspaceCopy(); const [query, setQuery] = useState('');
    const [expandedGroup, setExpandedGroup] = useState('');
    if (collapsed) return <aside className="ws-sidebar ws-sidebar-compact ws-desktop-sidebar" aria-label={ws('navigation')}>
        <div className="ws-sidebar-brand"><button type="button" onClick={onExpand} className="ws-icon-button" aria-label={ws('expand')} title={ws('expand')}><HiOutlineBars3 aria-hidden /></button></div>
        <div className="ws-sidebar-tools">
            {storeUrl ? <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="ws-icon-button" aria-label={t('view_store', 'View store')} title={t('view_store', 'View store')}><HiOutlineEye aria-hidden /></a> : null}
            <button type="button" className="ws-icon-button" onClick={onSearch} aria-label={ws('searchTitle')} title={ws('searchTitle')}><HiOutlineMagnifyingGlass aria-hidden /></button>
        </div>
        <div className="ws-sidebar-scroll"><SidebarNav isAdmin={me.roles?.includes('Admin')} isSupplier={me.roles?.includes('Supplier')} roles={me.roles ?? []} permissions={permissions} compact onExpand={(label) => { setExpandedGroup(label); onExpand(); }} /></div>
        <div className="ws-sidebar-footer"><Link to="/contact" aria-label={ws('help')} title={ws('help')}><HiOutlineQuestionMarkCircle aria-hidden /></Link></div>
    </aside>;
    return <aside className="ws-sidebar ws-desktop-sidebar" aria-label={ws('navigation')}>
        <div className="ws-sidebar-brand"><Link to={admin ? '/admin/dashboard' : '/dashboard'}><img src="/icon.png" alt="" /><strong>Sellchaze</strong></Link><button type="button" onClick={onCollapse} className="ws-icon-button" aria-label={ws('collapse')}><HiOutlineBars3 aria-hidden /></button></div>
        <div className="ws-sidebar-tools">
            {storeUrl ? <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="ws-view-store">{t('view_store', 'View store')}<HiOutlineEye aria-hidden /></a> : null}
            <label className="ws-sidebar-search"><HiOutlineMagnifyingGlass aria-hidden /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ws('search')} aria-label={ws('search')} /></label>
        </div>
        <div className="ws-sidebar-scroll"><SidebarNav isAdmin={me.roles?.includes('Admin')} isSupplier={me.roles?.includes('Supplier')} roles={me.roles ?? []} permissions={permissions} query={query} expandedGroup={expandedGroup} onNavigate={() => { setQuery(''); setExpandedGroup(''); }} /></div>
        <div className="ws-sidebar-footer"><Link to="/contact"><HiOutlineQuestionMarkCircle aria-hidden />{ws('help')}</Link><small>{admin ? ws('admin') : ws('workspace')} · Sellchaze</small></div>
    </aside>;
}
