import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useOutletContext } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import useWorkspaceDesktop from '../../hooks/useWorkspaceDesktop';
import { HiOutlineBars3, HiOutlineMagnifyingGlass, HiOutlineXMark } from '../workspace/WorkspaceIcons';
import '../store/store-secondary-sidebar.css';
import './secondary-navigation.css';

/** One navigation tree: a shell column on desktop, a drawer or the existing inline list on phones. */
export default function SecondaryNavigation({ title, children, search = true, width = 288, inlineOnMobile = false, enabled = true, ownScroll = false }) {
    const { secondaryNavigationTarget } = useOutletContext() ?? {};
    const desktop = useWorkspaceDesktop();
    const location = useLocation();
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const copy = (a, e) => ar ? a : e;
    const id = useId();
    const [collapsed, setCollapsed] = useState(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const toggle = useRef(null);
    const previousCollapsed = useRef(collapsed);
    useLayoutEffect(() => {
        if (previousCollapsed.current !== collapsed) toggle.current?.focus();
        previousCollapsed.current = collapsed;
    }, [collapsed]);
    useEffect(() => { setOpen(false); }, [location.pathname, location.search, desktop]);
    const close = () => setOpen(false);
    useLayoutEffect(() => {
        if (!desktop || !enabled || !secondaryNavigationTarget) return;
        const column = secondaryNavigationTarget.parentElement?.querySelector('.ws-main-column');
        if (!column) return;
        const update = () => column.toggleAttribute('data-secondary-narrow', column.getBoundingClientRect().width <= 700);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(column);
        return () => { observer.disconnect(); column.removeAttribute('data-secondary-narrow'); };
    }, [desktop, enabled, secondaryNavigationTarget]);
    const body = typeof children === 'function' ? children(query, close) : children;
    if (!enabled || (!desktop && inlineOnMobile) || !secondaryNavigationTarget) return body;
    const pane = (mobile) => <aside className={`ws-secondary-sidebar ws-context-navigation${mobile ? ' is-mobile' : ''}${collapsed && !mobile ? ' is-collapsed' : ''}`} aria-label={title} style={{ '--ws-secondary-width': `${width}px` }}>
        <header className="ws-secondary-sidebar-heading">
            {mobile ? <DialogTitle>{title}</DialogTitle> : <h2 hidden={collapsed}>{title}</h2>}
            <button ref={mobile ? undefined : toggle} type="button" className="ws-icon-button" onClick={mobile ? close : () => setCollapsed(value => !value)} aria-expanded={mobile ? undefined : !collapsed} aria-label={mobile ? copy('إغلاق القائمة', 'Close menu') : `${collapsed ? copy('توسيع', 'Expand') : copy('طي', 'Collapse')} ${title}`} title={title}>{mobile ? <HiOutlineXMark aria-hidden /> : <HiOutlineBars3 aria-hidden />}</button>
        </header>
        <div className="ws-context-navigation-body" hidden={collapsed && !mobile}>
            {search ? <div className="ws-secondary-sidebar-search"><label><HiOutlineMagnifyingGlass aria-hidden /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={copy('بحث', 'Search')} aria-label={`${copy('بحث في', 'Search')} ${title}`} /></label></div> : null}
            <div className={ownScroll ? 'ws-context-native-scroll' : 'ws-secondary-sidebar-scroll'}>{body}</div>
        </div>
    </aside>;
    return desktop ? createPortal(pane(false), secondaryNavigationTarget) : <>
        <div className="ws-settings-mobile-toolbar"><strong>{title}</strong><button type="button" className="ws-secondary-button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls={id}><HiOutlineBars3 aria-hidden />{copy('فتح القائمة', 'Open menu')}</button></div>
        <Dialog open={open} onClose={close} className="fixed inset-0 z-60">
            <DialogBackdrop transition className="fixed inset-0 bg-slate-900/40 transition duration-200 data-closed:opacity-0" />
            <div className="fixed inset-0 flex" dir={ar ? 'rtl' : 'ltr'}><DialogPanel transition id={id} className="ws-settings-mobile-drawer w-[min(86vw,20rem)] h-full transition duration-200 data-closed:-translate-x-full data-closed:rtl:translate-x-full">{pane(true)}</DialogPanel></div>
        </Dialog>
    </>;
}
