import { Children, cloneElement, isValidElement, useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useWorkspaceCopy from './workspaceCopy';
import './compact-navigation.css';

function linksIn(node, links = []) {
    Children.forEach(node, element => {
        if (!isValidElement(element)) return;
        if (element.type === Link || element.type === NavLink) links.push(element);
        else linksIn(element.props.children, links);
    });
    return links;
}

/** Render the existing authorized tree once; opening a rail item never mounts another data consumer. */
export default function CompactNavigation({ rows, onNavigate }) {
    const { i18n } = useTranslation();
    const ws = useWorkspaceCopy();
    const { pathname, search } = useLocation();
    const rtl = i18n.language.startsWith('ar');
    const id = useId();
    const nav = useRef(null), panel = useRef(null), anchor = useRef(null);
    const timer = useRef(null), mode = useRef('hover'), ignoreFocus = useRef(false), focusAfterOpen = useRef(null);
    const [open, setOpen] = useState(null);
    const [position, setPosition] = useState(null);
    const prepared = useMemo(() => rows.map((row, index) => ({ ...row, index, links: row.Icon ? linksIn(row.children) : [] })), [rows]);
    const signature = prepared.map(row => `${row.label}:${row.element?.props.to || row.links.map(link => link.props.to).join(',')}`).join('|');
    const clearTimer = useCallback(() => { clearTimeout(timer.current); timer.current = null; }, []);
    const close = useCallback((restore = false) => {
        clearTimer();
        setOpen(null); setPosition(null);
        if (restore && anchor.current?.isConnected) {
            ignoreFocus.current = true;
            anchor.current.focus({ preventScroll: true });
            queueMicrotask(() => { ignoreFocus.current = false; });
        }
    }, [clearTimer]);
    const show = (row, target, source = 'hover', focus = null) => {
        clearTimer(); mode.current = source; anchor.current = target; focusAfterOpen.current = focus;
        setPosition(null); setOpen({ ...row });
    };
    const enter = (row, event) => {
        if (event.pointerType !== 'mouse') return;
        clearTimer(); const target = event.currentTarget;
        timer.current = setTimeout(() => show(row, target), 100);
    };
    const leave = () => {
        clearTimer();
        if (mode.current === 'click' || anchor.current === document.activeElement || panel.current?.contains(document.activeElement)) return;
        timer.current = setTimeout(() => close(), 120);
    };
    useLayoutEffect(() => { close(); return clearTimer; }, [pathname, search, i18n.language, signature, close, clearTimer]); // permission/locale/route changes cannot paint stale links
    useLayoutEffect(() => {
        if (!open) return;
        const place = () => {
            const trigger = anchor.current, popup = panel.current;
            if (!trigger?.isConnected || !popup) return;
            popup.setAttribute('data-workspace-theme', trigger.closest('[data-workspace-theme]')?.getAttribute('data-workspace-theme') || document.body.getAttribute('data-workspace-theme') || 'light');
            const viewport = window.visualViewport;
            const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
            const right = left + (viewport?.width || innerWidth), bottom = top + (viewport?.height || innerHeight);
            const rect = trigger.getBoundingClientRect();
            if (rect.bottom <= top || rect.top >= bottom) { close(); return; }
            popup.style.maxWidth = `${Math.max(0, right - left - 16)}px`;
            popup.style.maxHeight = `${Math.max(0, bottom - top - 16)}px`;
            const size = popup.getBoundingClientRect();
            let x = rtl ? rect.left - size.width - 8 : rect.right + 8;
            if (x < left + 8 || x + size.width > right - 8) x = rtl ? rect.right + 8 : rect.left - size.width - 8;
            setPosition({ left: Math.max(left + 8, Math.min(x, right - size.width - 8)), top: Math.max(top + 8, Math.min(rect.top - 8, bottom - size.height - 8)) });
        };
        place();
        const outside = event => { if (!panel.current?.contains(event.target) && !anchor.current?.contains(event.target)) close(); };
        const escape = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(panel.current?.contains(document.activeElement) || anchor.current === document.activeElement); } };
        const scroll = event => { if (!panel.current?.contains(event.target)) close(); };
        document.addEventListener('pointerdown', outside, true); document.addEventListener('focusin', outside);
        document.addEventListener('keydown', escape, true); window.addEventListener('scroll', scroll, true);
        window.addEventListener('resize', place); window.visualViewport?.addEventListener('resize', place); window.visualViewport?.addEventListener('scroll', place);
        const resize = new ResizeObserver(place); if (panel.current) resize.observe(panel.current);
        const themeObserver = new MutationObserver(place); themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-workspace-theme'] });
        return () => {
            document.removeEventListener('pointerdown', outside, true); document.removeEventListener('focusin', outside); document.removeEventListener('keydown', escape, true); window.removeEventListener('scroll', scroll, true);
            window.removeEventListener('resize', place); window.visualViewport?.removeEventListener('resize', place); window.visualViewport?.removeEventListener('scroll', place); resize.disconnect(); themeObserver.disconnect();
        };
    }, [open, rtl, close]);
    useLayoutEffect(() => {
        if (!position || !open?.Icon || focusAfterOpen.current === null) return;
        const links = panel.current?.querySelectorAll('a');
        const index = focusAfterOpen.current === 'last' ? links.length - 1 : 0;
        links?.[index]?.focus({ preventScroll: true });
        focusAfterOpen.current = null;
    }, [position, open]);
    const focusNeighbor = (offset) => {
        const triggers = [...nav.current.querySelectorAll('[data-compact-trigger]')];
        const index = triggers.indexOf(anchor.current);
        close(); triggers[(index + offset + triggers.length) % triggers.length]?.focus();
    };
    const key = (row, event) => {
        if (!row.Icon) return;
        if (['ArrowDown', 'ArrowUp', rtl ? 'ArrowLeft' : 'ArrowRight'].includes(event.key) || (event.key === 'Tab' && !event.shiftKey && open?.index === row.index)) {
            event.preventDefault(); show(row, event.currentTarget, 'keyboard', event.key === 'ArrowUp' ? 'last' : 'first');
        } else if (event.key === 'Tab' && event.shiftKey) close();
    };
    const sections = [...new Set(prepared.map(row => row.section || ''))];
    const theme = typeof document === 'undefined' ? 'light' : document.body.getAttribute('data-workspace-theme') || 'light';
    return <>
        <nav ref={nav} aria-label={ws('navigation')} className="ws-compact-nav">
            {sections.map(section => <div className="ws-compact-section" key={section} role="group" aria-label={section || undefined}>
                {prepared.filter(row => (row.section || '') === section).map(row => {
                    const active = open?.index === row.index;
                    const common = { 'data-compact-trigger': '', onPointerEnter: event => enter(row, event), onPointerLeave: leave, onFocus: event => { if (!ignoreFocus.current) show(row, event.currentTarget, 'focus'); }, onKeyDown: event => key(row, event) };
                    return row.Icon ? <button {...common} key={row.groupKey} type="button" aria-label={row.label} aria-current={row.active ? 'location' : undefined} aria-expanded={active} aria-controls={active ? id : undefined} onClick={event => { if (active && mode.current === 'click') close(); else show(row, event.currentTarget, 'click'); }}><row.Icon aria-hidden /></button>
                        : cloneElement(row.element, { ...common, key: `${row.element.props.to}-${row.index}`, title: undefined, 'aria-label': row.label, 'aria-describedby': active ? id : undefined, onClick: () => { close(); onNavigate?.(); } }, <>{row.icon}<span className="sr-only">{row.label}</span></>);
                })}
            </div>)}
        </nav>
        {open ? createPortal(<div ref={panel} id={id} dir={rtl ? 'rtl' : 'ltr'} data-workspace-theme={theme} className={open.Icon ? 'ws-compact-flyout' : 'ws-compact-tooltip'} role={open.Icon ? undefined : 'tooltip'} style={{ ...position, visibility: position ? 'visible' : 'hidden' }} onPointerEnter={clearTimer} onPointerLeave={leave}>
            {open.Icon ? <><header><open.Icon aria-hidden /><strong>{open.label}</strong></header><nav aria-label={open.label} onKeyDown={event => {
                const links = [...event.currentTarget.querySelectorAll('a')], index = links.indexOf(document.activeElement);
                let next = event.key === 'ArrowDown' ? (index + 1) % links.length : event.key === 'ArrowUp' ? (index - 1 + links.length) % links.length : event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : null;
                if (next !== null) { event.preventDefault(); links[next]?.focus(); }
                else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) { event.preventDefault(); close(true); }
                else if (event.key === 'Tab' && event.shiftKey && index === 0) { event.preventDefault(); close(true); }
                else if (event.key === 'Tab' && !event.shiftKey && index === links.length - 1) { event.preventDefault(); focusNeighbor(1); }
            }}>{open.links.map((link, index) => cloneElement(link, { key: `${link.props.to}-${index}`, onClick: event => { link.props.onClick?.(event); close(); onNavigate?.(); } }))}</nav></> : open.label}
        </div>, document.body) : null}
    </>;
}
