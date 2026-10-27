/** Vertical category tabs retain the marketplace's Arrow/Home/End keyboard contract. */
export default function NavigationCategories({ title, items, selected, query, onSelect }) {
    const visible = items.filter(item => item.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
    const focusKey = visible.some(item => item.key === selected) ? selected : visible[0]?.key;
    return <div role="tablist" aria-label={title} aria-orientation="vertical" onKeyDown={event => {
        const buttons = [...event.currentTarget.querySelectorAll('[role=tab]')];
        if (!buttons.length) return;
        const current = buttons.indexOf(document.activeElement);
        const next = event.key === 'ArrowDown' ? (current + 1) % buttons.length : event.key === 'ArrowUp' ? (current - 1 + buttons.length) % buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : null;
        if (next !== null) { event.preventDefault(); buttons[next].focus(); buttons[next].click(); }
    }}>{visible.map(({ key, label, Icon }) => <button type="button" role="tab" aria-selected={selected === key} tabIndex={focusKey === key ? 0 : -1} key={key} onClick={() => onSelect(key)}>{Icon ? <Icon aria-hidden /> : null}<span>{label}</span></button>)}</div>;
}
