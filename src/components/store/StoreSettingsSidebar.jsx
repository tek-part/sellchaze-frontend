import { useState } from 'react';
import { DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineBars3, HiOutlineCog6Tooth, HiOutlineMagnifyingGlass, HiOutlineXMark } from '../workspace/WorkspaceIcons';
import StoreSettingsNavigation from './StoreSettingsNavigation';
import './store-secondary-sidebar.css';

/** The contextual settings rail shares routes and permissions with the store workspace. */
export default function StoreSettingsSidebar({ items, uiBase, rel, label, collapsed = false, mobile = false, onToggle, onNavigate }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [query, setQuery] = useState('');
    const title = text('إعدادات المتجر', 'Store settings');
    if (collapsed && !mobile) return <aside className="ws-secondary-sidebar is-collapsed" aria-label={label}>
        <button type="button" className="ws-icon-button" onClick={onToggle} aria-label={text('توسيع شريط الإعدادات', 'Expand settings sidebar')} title={title} aria-expanded="false"><HiOutlineCog6Tooth aria-hidden /></button>
    </aside>;
    return <aside className={`ws-secondary-sidebar${mobile ? ' is-mobile' : ''}`} aria-label={label}>
        <header className="ws-secondary-sidebar-heading">
            {mobile ? <DialogTitle>{title}</DialogTitle> : <h2>{title}</h2>}
            <button type="button" className="ws-icon-button" onClick={onToggle} aria-label={mobile ? text('إغلاق قائمة الإعدادات', 'Close settings menu') : text('طي شريط الإعدادات', 'Collapse settings sidebar')} title={mobile ? text('إغلاق', 'Close') : text('طي', 'Collapse')} aria-expanded={mobile ? undefined : true}>{mobile ? <HiOutlineXMark aria-hidden /> : <HiOutlineBars3 aria-hidden />}</button>
        </header>
        <div className="ws-secondary-sidebar-search"><label><HiOutlineMagnifyingGlass aria-hidden /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={text('البحث في الإعدادات', 'Search settings')} aria-label={text('البحث في الإعدادات', 'Search settings')} /></label></div>
        <div className="ws-secondary-sidebar-scroll"><StoreSettingsNavigation items={items} uiBase={uiBase} rel={rel} label={label} query={query} onNavigate={onNavigate} /></div>
    </aside>;
}
