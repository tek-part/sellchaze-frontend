import { Children, isValidElement } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HiOutlineArrowUpRight, HiOutlineMagnifyingGlass } from './WorkspaceIcons';
import useWorkspaceCopy from './workspaceCopy';
import CompactNavigation from './CompactNavigation';

export function navigationText(node) {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(navigationText).join(' ');
    if (isValidElement(node)) return navigationText(node.props.children);
    return '';
}
export function normalizeNavigationText(value) {
    return String(value).normalize('NFKD').replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, '').replace(/[إأآ]/g, 'ا').toLocaleLowerCase().trim();
}
/** Walk the already permission-filtered React tree, including closed groups. */
export function collectNavigation(node, group = '', items = new Map()) {
    Children.forEach(node, (element) => {
        if (!isValidElement(element)) return;
        const nextGroup = element.props.title ?? group;
        if ((element.type === Link || element.type === NavLink) && typeof element.props.to === 'string') {
            const label = navigationText(element.props.children).replace(/\s+/g, ' ').trim();
            if (label && !items.has(element.props.to)) items.set(element.props.to, { to: element.props.to, label, group });
        } else collectNavigation(element.props.children, nextGroup, items);
    });
    return [...items.values()];
}
/** Compact rail uses the same permission-filtered groups and links as the full menu. */
export function collectCompactNavigation(node, rows = [], section = '') {
    let currentSection = section;
    Children.forEach(node, (element) => {
        if (!isValidElement(element)) return;
        if (element.props.navigationSection) { currentSection = navigationText(element.props.children); return; }
        if (element.props.title && element.props.icon) {
            rows.push({ label: element.props.title, groupKey: element.props.groupKey || element.props.title, Icon: element.props.icon, active: Boolean(element.props.groupActive), section: currentSection, children: element.props.children });
        } else if (element.type === Link || element.type === NavLink) {
            const label = navigationText(element.props.children).replace(/\s+/g, ' ').trim();
            const icon = Children.toArray(element.props.children).find(isValidElement);
            if (label && icon) rows.push({ label, element, icon, section: currentSection });
        } else collectCompactNavigation(element.props.children, rows, currentSection);
    });
    return rows;
}
export default function NavigationResults({ query = '', search = false, compact = false, additionalItems = [], children, onNavigate }) {
    const ws = useWorkspaceCopy();
    if (compact) return <CompactNavigation rows={collectCompactNavigation(children)} onNavigate={onNavigate} />;
    if (!search && !query.trim()) return children;
    const needle = normalizeNavigationText(query);
    const indexed = new Map(additionalItems.map((item) => [item.to, item]));
    collectNavigation(children, '', indexed);
    const rows = [...indexed.values()].filter((row) => normalizeNavigationText(`${row.label} ${row.group} ${row.to}`).includes(needle));
    return <nav aria-label={ws('navigation')} className="ws-search-results">
        {rows.length ? rows.map((row) => <Link key={row.to} to={row.to} onClick={onNavigate} className="ws-search-result">
            <HiOutlineMagnifyingGlass aria-hidden /><span><strong>{row.label}</strong>{row.group ? <small>{row.group}</small> : null}</span><HiOutlineArrowUpRight aria-hidden className="ws-search-arrow" />
        </Link>) : <p role="status" className="ws-empty">{ws('noResults')}</p>}
    </nav>;
}
