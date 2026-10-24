import { useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowDown, HiOutlineArrowDownTray, HiOutlineArrowUp, HiOutlineArrowsRightLeft, HiOutlineChevronDown, HiOutlineEllipsisHorizontal,
    HiOutlineFunnel, HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineViewColumns, HiOutlineXMark,
} from '../workspace/WorkspaceIcons';
import { describeFilter, isEmptyValue, moveKey } from '../../features/data-table/state';

function useText() {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    return [(a, e) => (ar ? a : e), ar];
}
const errorText = (error) => Object.values(error?.response?.data?.errors || {}).flat().join(' ') || error?.response?.data?.message || error?.message || '';

function FilterEditor({ def, value, onApply, onClose }) {
    const [text] = useText();
    const [draft, setDraft] = useState(() => value ?? (def.type === 'multi' ? [] : def.type.endsWith('range') ? { min: '', max: '' } : ''));
    const inputType = def.type === 'date-range' ? 'date' : 'number';
    const apply = (next = draft) => { onApply(next); onClose?.(); };
    return <form className="ws-dt-filter-editor" onSubmit={(event) => { event.preventDefault(); apply(); }}>
        <strong>{def.label}</strong>
        {def.type === 'select' ? <div role="radiogroup" aria-label={def.label}>{def.options.map((option) => <label key={option.value}><input type="radio" name={`dt-${def.key}`} checked={draft === option.value} onChange={() => { setDraft(option.value); apply(option.value); }} />{option.label}</label>)}</div> : null}
        {def.type === 'multi' ? <div role="group" aria-label={def.label}>{def.options.map((option) => <label key={option.value}><input type="checkbox" checked={draft.includes(option.value)} onChange={(event) => setDraft(event.target.checked ? [...draft, option.value] : draft.filter((item) => item !== option.value))} />{option.label}</label>)}</div> : null}
        {def.type === 'text' ? <input autoFocus aria-label={def.label} value={draft} onChange={(event) => setDraft(event.target.value)} /> : null}
        {def.type.endsWith('range') ? <div className="ws-dt-range">
            <label>{def.type === 'date-range' ? text('من', 'From') : text('الحد الأدنى', 'Min')}<input type={inputType} min={inputType === 'number' ? 0 : undefined} dir="ltr" value={draft.min ?? ''} onChange={(event) => setDraft({ ...draft, min: event.target.value })} /></label>
            <label>{def.type === 'date-range' ? text('إلى', 'To') : text('الحد الأقصى', 'Max')}<input type={inputType} min={inputType === 'number' ? 0 : undefined} dir="ltr" value={draft.max ?? ''} onChange={(event) => setDraft({ ...draft, max: event.target.value })} /></label>
        </div> : null}
        {def.type !== 'select' ? <div className="ws-dt-editor-actions">
            <button type="button" className="ws-dt-link" onClick={() => apply(def.type === 'multi' ? [] : def.type.endsWith('range') ? { min: '', max: '' } : '')}>{text('مسح', 'Clear')}</button>
            <button type="submit" className="ws-dt-button ws-dt-button-primary">{text('تطبيق', 'Apply')}</button>
        </div> : null}
    </form>;
}

function ViewTabs({ table }) {
    const [text] = useText();
    const [naming, setNaming] = useState(null);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const allLabel = text('الكل', 'All');
    const submit = async (event) => {
        event.preventDefault();
        if (!name.trim() || busy) return;
        setBusy(true); setError('');
        try {
            if (naming === 'new') await table.saveViewAs(name.trim()); else await table.updateView(naming, { name: name.trim() });
            setNaming(null); setName('');
        } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
    };
    const saved = table.activeView && !table.activeView.builtIn ? table.activeView : null;
    const run = async (action) => { setBusy(true); setError(''); try { await action(); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } };

    return <div className="ws-dt-views">
        {/* Only tabs live in the tablist (ARIA); the active saved view's menu and "save as" sit beside it. */}
        <div className="ws-dt-tabs">
            <div className="ws-dt-tablist" role="tablist" aria-label={text('طرق العرض', 'Views')}>
                {table.views.map((view) => {
                    const active = view.id === table.activeView?.id;
                    return <div key={view.id} className={`ws-dt-tab ${active ? 'is-active' : ''}`}>
                        <button type="button" role="tab" aria-selected={active} onClick={() => table.selectView(view)}>{view.label || allLabel}{active && table.viewChanged ? <span className="ws-dt-dot" aria-label={text('تغييرات غير محفوظة', 'Unsaved changes')} /> : null}</button>
                    </div>;
                })}
            </div>
            {saved ? <Popover className="ws-dt-popover">
                <PopoverButton className="ws-dt-icon" aria-label={`${text('خيارات طريقة العرض', 'View options')}: ${saved.label}`}><HiOutlineEllipsisHorizontal aria-hidden /></PopoverButton>
                <PopoverPanel anchor="bottom start" className="ws-dt-menu">{({ close }) => <>
                    <button type="button" disabled={busy || !table.viewChanged} onClick={() => run(() => table.updateView(saved)).then(close)}>{text('حفظ التغييرات على طريقة العرض', 'Save changes to view')}</button>
                    <button type="button" disabled={busy} onClick={() => { setNaming(saved); setName(saved.label); close(); }}>{text('إعادة التسمية', 'Rename')}</button>
                    <button type="button" className="is-danger" disabled={busy} onClick={() => run(() => table.deleteView(saved)).then(close)}>{text('حذف طريقة العرض', 'Delete view')}</button>
                </>}</PopoverPanel>
            </Popover> : null}
            {table.savedViewsEnabled ? <button type="button" className="ws-dt-icon" aria-label={text('حفظ كطريقة عرض جديدة', 'Save as new view')} title={text('حفظ كطريقة عرض جديدة', 'Save as new view')} onClick={() => { setNaming('new'); setName(''); setError(''); }}><HiOutlinePlus aria-hidden /></button> : null}
        </div>
        {naming ? <form className="ws-dt-name" onSubmit={submit}>
            <input autoFocus maxLength={60} aria-label={text('اسم طريقة العرض', 'View name')} placeholder={text('اسم طريقة العرض', 'View name')} value={name} onChange={(event) => setName(event.target.value)} />
            <button type="submit" className="ws-dt-button ws-dt-button-primary" disabled={busy || !name.trim()}>{text('حفظ', 'Save')}</button>
            <button type="button" className="ws-dt-button" onClick={() => { setNaming(null); setError(''); }}>{text('إلغاء', 'Cancel')}</button>
        </form> : null}
        {error ? <p role="alert" className="ws-dt-error-inline">{error}</p> : null}
    </div>;
}

function SortMenu({ table, sortable }) {
    const [text] = useText();
    const current = table.state.sort;
    return <Popover className="ws-dt-popover">
        <PopoverButton className="ws-dt-button" aria-label={text('الترتيب', 'Sort')}><HiOutlineArrowsRightLeft className="rotate-90" aria-hidden /><span className="ws-dt-hide-sm">{text('ترتيب', 'Sort')}</span></PopoverButton>
        <PopoverPanel anchor="bottom end" className="ws-dt-menu ws-dt-sort">
            <strong>{text('ترتيب حسب', 'Sort by')}</strong>
            <div role="radiogroup">{sortable.map((column) => <label key={column.sortKey}><input type="radio" name="dt-sort" checked={current?.by === column.sortKey} onChange={() => table.setSort({ by: column.sortKey, direction: current?.direction ?? 'asc' })} />{column.header}</label>)}</div>
            <div className="ws-dt-direction">{['asc', 'desc'].map((direction) => <button key={direction} type="button" disabled={!current} className={current?.direction === direction ? 'is-active' : ''} onClick={() => table.setSort({ by: current.by, direction })}>{direction === 'asc' ? <HiOutlineArrowUp aria-hidden /> : <HiOutlineArrowDown aria-hidden />}{direction === 'asc' ? text('تصاعدي', 'Ascending') : text('تنازلي', 'Descending')}</button>)}</div>
        </PopoverPanel>
    </Popover>;
}

function ColumnsMenu({ table }) {
    const [text] = useText();
    const order = (table.columnPrefs?.order?.length ? table.columnPrefs.order : table.columns.map((column) => column.key))
        .filter((key) => table.columns.some((column) => column.key === key));
    const all = [...order, ...table.columns.map((column) => column.key).filter((key) => !order.includes(key))];
    const hidden = new Set(table.columnPrefs?.hidden ?? table.columns.filter((column) => column.defaultHidden).map((column) => column.key));
    const save = (nextOrder, nextHidden) => table.saveColumns({ order: nextOrder, hidden: [...nextHidden] });
    return <Popover className="ws-dt-popover">
        <PopoverButton className="ws-dt-button" aria-label={text('الأعمدة', 'Columns')}><HiOutlineViewColumns aria-hidden /><span className="ws-dt-hide-sm">{text('الأعمدة', 'Columns')}</span></PopoverButton>
        <PopoverPanel anchor="bottom end" className="ws-dt-menu ws-dt-columns">
            <strong>{text('إظهار الأعمدة وترتيبها', 'Show and order columns')}</strong>
            <ul>{all.map((key, index) => {
                const column = table.columns.find((item) => item.key === key);
                const locked = column.hideable === false;
                return <li key={key}>
                    <label><input type="checkbox" disabled={locked} checked={locked || !hidden.has(key)} onChange={(event) => { const next = new Set(hidden); if (event.target.checked) next.delete(key); else next.add(key); save(all, next); }} />{column.header || key}</label>
                    <span>
                        <button type="button" className="ws-dt-icon" disabled={index === 0} aria-label={text(`نقل ${column.header} لأعلى`, `Move ${column.header} up`)} onClick={() => save(moveKey(all, key, -1), hidden)}><HiOutlineArrowUp aria-hidden /></button>
                        <button type="button" className="ws-dt-icon" disabled={index === all.length - 1} aria-label={text(`نقل ${column.header} لأسفل`, `Move ${column.header} down`)} onClick={() => save(moveKey(all, key, 1), hidden)}><HiOutlineArrowDown aria-hidden /></button>
                    </span>
                </li>;
            })}</ul>
            <div className="ws-dt-density" role="radiogroup" aria-label={text('كثافة الصفوف', 'Row density')}>
                {[['comfortable', text('مريح', 'Comfortable')], ['compact', text('مضغوط', 'Compact')]].map(([value, label]) => <label key={value}><input type="radio" name="dt-density" checked={table.density === value} onChange={() => table.setDensity(value)} />{label}</label>)}
            </div>
            <button type="button" className="ws-dt-link" onClick={() => table.saveColumns(null)}>{text('استعادة الافتراضي', 'Reset to default')}</button>
        </PopoverPanel>
    </Popover>;
}

/**
 * Shopify-style toolbar for an index table: views as tabs, search, filter chips with an
 * "Add filter" menu, sort, columns/density and CSV export. Pair with `useIndexTable` and `IndexTable`.
 * Pass `searchable={false}` when the endpoint has no free-text search.
 */
export default function IndexFilters({ table, searchPlaceholder, onExport, exportDisabled, actions, showViews = true, searchable = true }) {
    const [text] = useText();
    const sortable = table.columns.filter((column) => column.sortKey);
    const applied = table.filterDefs.filter((def) => !isEmptyValue(table.state.filters[def.key]));
    const available = table.filterDefs.filter((def) => isEmptyValue(table.state.filters[def.key]));
    const words = { from: text('من', 'from'), to: text('حتى', 'up to') };

    return <div className="ws-dt-toolbar">
        {showViews ? <ViewTabs table={table} /> : null}
        <div className="ws-dt-controls">
            {searchable ? <label className="ws-dt-search">
                <HiOutlineMagnifyingGlass aria-hidden />
                <input type="search" aria-label={searchPlaceholder || text('بحث', 'Search')} placeholder={searchPlaceholder || text('بحث', 'Search')} value={table.searchInput} onChange={(event) => table.setSearch(event.target.value)} />
                {table.searchInput ? <button type="button" className="ws-dt-icon" aria-label={text('مسح البحث', 'Clear search')} onClick={() => table.setSearch('')}><HiOutlineXMark aria-hidden /></button> : null}
            </label> : null}
            {table.filterDefs.length ? <Popover className="ws-dt-popover">
                <PopoverButton className="ws-dt-button" aria-label={text('إضافة فلتر', 'Add filter')}><HiOutlineFunnel aria-hidden /><span className="ws-dt-hide-sm">{text('فلتر', 'Filter')}</span><HiOutlineChevronDown aria-hidden /></PopoverButton>
                <PopoverPanel anchor="bottom start" className="ws-dt-menu ws-dt-filter-menu">{({ close }) => <FilterPicker defs={available.length ? available : table.filterDefs} table={table} close={close} />}</PopoverPanel>
            </Popover> : null}
            <div className="ws-dt-spacer" />
            {actions}
            {sortable.length ? <SortMenu table={table} sortable={sortable} /> : null}
            <ColumnsMenu table={table} />
            {onExport ? <button type="button" className="ws-dt-button" disabled={exportDisabled} onClick={onExport} aria-label={text('تصدير CSV', 'Export CSV')}><HiOutlineArrowDownTray aria-hidden /><span className="ws-dt-hide-sm">{text('تصدير', 'Export')}</span></button> : null}
        </div>
        {applied.length || table.state.search ? <div className="ws-dt-chips">
            {applied.map((def) => <Popover key={def.key} className="ws-dt-popover">
                <span className="ws-dt-chip">
                    <PopoverButton className="ws-dt-chip-label">{describeFilter(def, table.state.filters[def.key], words)}</PopoverButton>
                    <button type="button" aria-label={text(`إزالة فلتر ${def.label}`, `Remove ${def.label} filter`)} onClick={() => table.removeFilter(def.key)}><HiOutlineXMark aria-hidden /></button>
                </span>
                <PopoverPanel anchor="bottom start" className="ws-dt-menu">{({ close }) => <FilterEditor def={def} value={table.state.filters[def.key]} onApply={(value) => table.setFilter(def.key, value)} onClose={close} />}</PopoverPanel>
            </Popover>)}
            <button type="button" className="ws-dt-link" onClick={table.clearFilters}>{text('مسح الكل', 'Clear all')}</button>
        </div> : null}
    </div>;
}

function FilterPicker({ defs, table, close }) {
    const [current, setCurrent] = useState(null);
    if (current) return <FilterEditor def={current} value={table.state.filters[current.key]} onApply={(value) => table.setFilter(current.key, value)} onClose={close} />;
    return <ul className="ws-dt-picker">{defs.map((def) => <li key={def.key}><button type="button" onClick={() => setCurrent(def)}>{def.label}</button></li>)}</ul>;
}
