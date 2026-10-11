import { Children, isValidElement } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HiOutlineArrowUpRight, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import useWorkspaceCopy from './workspaceCopy';

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
export default function NavigationResults({ query = '', search = false, children, onNavigate }) {
    const ws = useWorkspaceCopy();
    if (!search && !query.trim()) return children;
    const needle = normalizeNavigationText(query);
    const rows = collectNavigation(children).filter((row) => normalizeNavigationText(`${row.label} ${row.group} ${row.to}`).includes(needle));
    return <nav aria-label={ws('navigation')} className="ws-search-results">
        {rows.length ? rows.map((row) => <Link key={row.to} to={row.to} onClick={onNavigate} className="ws-search-result">
            <HiOutlineMagnifyingGlass aria-hidden /><span><strong>{row.label}</strong>{row.group ? <small>{row.group}</small> : null}</span><HiOutlineArrowUpRight aria-hidden className="ws-search-arrow" />
        </Link>) : <p role="status" className="ws-empty">{ws('noResults')}</p>}
    </nav>;
}
