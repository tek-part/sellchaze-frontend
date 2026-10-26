import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlineChevronUpDown, HiOutlineMagnifyingGlass, HiOutlineXMark } from '../workspace/WorkspaceIcons';

const INTERACTIVE = 'a,button,input,select,textarea,label,[role="button"],[data-row-ignore]';

/**
 * Shopify-style index table. Pair with `useIndexTable` (state) and `IndexFilters` (toolbar).
 *
 * Columns: { key, header, render(row, { loading }), sortKey?, align?: 'start'|'end'|'center', width?, hideable?, defaultHidden?, primary? }
 * Bulk actions: { key, label, icon?, tone?: 'danger', onAction(rows, clear), disabled?(rows) }
 * Rows keep showing while a new page loads (no flash); first load shows skeleton rows.
 */
export default function IndexTable({
    table, rows = [], rowKey = (row) => row.id, loading = false, error = '', onRetry, meta, label,
    bulkActions = [], selectable = bulkActions.length > 0, rowHref, emptyState, maxSelection,
}) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => (ar ? a : e);
    const navigate = useNavigate();
    const columns = table.visibleColumns;
    const { selected } = table;
    const pageIds = rows.map(rowKey);
    const allOnPage = rows.length > 0 && pageIds.every((id) => selected.has(id));
    const someOnPage = pageIds.some((id) => selected.has(id));
    const firstLoad = loading && rows.length === 0;
    const filtered = Boolean(table.state.search) || Object.keys(table.state.filters).length > 0;
    const selectedRows = [...selected.values()];
    const overLimit = maxSelection && selected.size > maxSelection;
    const span = columns.length + (selectable ? 1 : 0);

    const sortHeader = (column) => {
        const active = table.state.sort?.by === column.sortKey;
        const direction = active ? table.state.sort.direction : null;
        const next = active && direction === 'asc' ? 'desc' : 'asc';
        return <button type="button" className="ws-dt-sort" onClick={() => table.setSort({ by: column.sortKey, direction: next })}
            aria-label={`${text('ترتيب حسب', 'Sort by')} ${column.header} ${next === 'asc' ? text('تصاعديًا', 'ascending') : text('تنازليًا', 'descending')}`}>
            {column.header}{direction === 'asc' ? <HiOutlineArrowUp aria-hidden /> : direction === 'desc' ? <HiOutlineArrowDown aria-hidden /> : <HiOutlineChevronUpDown aria-hidden className="ws-dt-sort-idle" />}
        </button>;
    };
    const onRowClick = (event, row) => {
        if (!rowHref || event.target.closest(INTERACTIVE) || window.getSelection?.()?.toString()) return;
        const href = rowHref(row);
        if (!href) return;
        if (event.metaKey || event.ctrlKey) window.open(href, '_blank', 'noopener'); else navigate(href);
    };

    return <div className={`ws-dt ws-dt-${table.density}`}>
        {selectable && selected.size ? <div className="ws-dt-bulk" role="region" aria-label={text('إجراءات جماعية', 'Bulk actions')}>
            <label className="ws-dt-check"><input type="checkbox" checked={allOnPage} ref={(input) => { if (input) input.indeterminate = someOnPage && !allOnPage; }} onChange={(event) => table.togglePage(rows, rowKey, event.target.checked)} aria-label={text('تحديد كل عناصر الصفحة', 'Select all on this page')} /></label>
            <span className="ws-dt-bulk-count">{text(`${selected.size} محدد`, `${selected.size} selected`)}</span>
            <div className="ws-dt-bulk-actions">{bulkActions.map((action) => <button key={action.key} type="button" className={action.tone === 'danger' ? 'is-danger' : ''}
                disabled={Boolean(overLimit) || (action.disabled ? action.disabled(selectedRows) : false)} onClick={() => action.onAction(selectedRows, table.clearSelection)}>
                {action.icon ? <action.icon aria-hidden /> : null}{action.label}</button>)}</div>
            <button type="button" className="ws-dt-icon" onClick={table.clearSelection} aria-label={text('إلغاء التحديد', 'Clear selection')}><HiOutlineXMark aria-hidden /></button>
            {overLimit ? <p className="ws-dt-bulk-note" role="status">{text(`اختر ${maxSelection} عنصرًا أو أقل.`, `Select up to ${maxSelection} items.`)}</p> : null}
        </div> : null}
        {error ? <div className="ws-dt-error" role="alert"><p>{error}</p>{onRetry ? <button type="button" className="ws-dt-button" onClick={onRetry}>{text('إعادة المحاولة', 'Retry')}</button> : null}</div> : <div className="ws-dt-scroll" aria-busy={loading}>
            <table className="ws-dt-table" aria-label={label}>
                <thead><tr>
                    {selectable ? <th className="ws-dt-check-cell"><label className="ws-dt-check"><input type="checkbox" disabled={!rows.length} checked={allOnPage} ref={(input) => { if (input) input.indeterminate = someOnPage && !allOnPage; }} onChange={(event) => table.togglePage(rows, rowKey, event.target.checked)} aria-label={text('تحديد كل عناصر الصفحة', 'Select all on this page')} /></label></th> : null}
                    {columns.map((column) => <th key={column.key} scope="col" style={column.width ? { width: column.width } : undefined} className={column.align ? `is-${column.align}` : undefined}
                        aria-sort={column.sortKey && table.state.sort?.by === column.sortKey ? (table.state.sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                        {column.sortKey ? sortHeader(column) : column.header}
                    </th>)}
                </tr></thead>
                <tbody className={loading && rows.length ? 'is-reloading' : undefined}>
                    {firstLoad ? Array.from({ length: 6 }, (_, index) => <tr key={`skeleton-${index}`} className="ws-dt-skeleton" aria-hidden>
                        {selectable ? <td className="ws-dt-check-cell"><span /></td> : null}
                        {columns.map((column) => <td key={column.key}><span /></td>)}
                    </tr>) : rows.map((row) => {
                        const id = rowKey(row);
                        const isSelected = selected.has(id);
                        return <tr key={id} className={`${isSelected ? 'is-selected' : ''} ${rowHref ? 'is-clickable' : ''}`} onClick={(event) => onRowClick(event, row)}>
                            {selectable ? <td className="ws-dt-check-cell"><label className="ws-dt-check"><input type="checkbox" checked={isSelected}
                                onMouseDown={(event) => { if (event.shiftKey) event.preventDefault(); }}
                                onClick={(event) => { event.stopPropagation(); if (event.shiftKey) window.getSelection?.()?.removeAllRanges(); table.toggleRow(row, rows, rowKey, event.currentTarget.checked, event.shiftKey); }} onChange={() => {}}
                                aria-label={text('تحديد الصف', 'Select row')} /></label></td> : null}
                            {columns.map((column) => <td key={column.key} data-label={column.primary || typeof column.header !== 'string' ? undefined : column.header} className={[column.align ? `is-${column.align}` : '', column.primary ? 'is-primary' : ''].join(' ').trim() || undefined}>{column.render(row, { loading })}</td>)}
                        </tr>;
                    })}
                    {!loading && !rows.length ? <tr className="ws-dt-empty-row"><td colSpan={span}><div className="ws-dt-empty">
                        {filtered ? <>
                            <HiOutlineMagnifyingGlass aria-hidden />
                            <strong>{text('لا توجد نتائج مطابقة', 'No matching results')}</strong>
                            <p>{text('جرّب تغيير الفلاتر أو كلمات البحث.', 'Try changing the filters or search term.')}</p>
                            <button type="button" className="ws-dt-button" onClick={table.clearFilters}>{text('مسح الفلاتر', 'Clear filters')}</button>
                        </> : <>
                            {emptyState?.icon ? <emptyState.icon aria-hidden /> : null}
                            <strong>{emptyState?.title ?? text('لا توجد عناصر بعد', 'Nothing here yet')}</strong>
                            {emptyState?.description ? <p>{emptyState.description}</p> : null}
                            {emptyState?.action ?? null}
                        </>}
                    </div></td></tr> : null}
                </tbody>
            </table>
        </div>}
        {meta && !error ? <Pagination table={table} meta={meta} loading={loading} text={text} ar={ar} /> : null}
    </div>;
}

function Pagination({ table, meta, loading, text, ar }) {
    const { page, perPage } = table.state;
    // Some endpoints have a fixed page size (one option: no picker) or omit the total (no range text).
    const hasTotal = meta.total !== undefined && meta.total !== null;
    const total = Number(meta.total ?? 0);
    const last = Number(meta.last_page ?? 1);
    const from = total ? (page - 1) * perPage + 1 : 0;
    const to = Math.min(page * perPage, total);
    const options = table.defaults.perPageOptions ?? [25, 50, 100];
    return <footer className="ws-dt-footer">
        {options.length > 1 ? <label className="ws-dt-per">{text('صفوف لكل صفحة', 'Rows per page')}
            <select value={perPage} onChange={(event) => table.setPerPage(Number(event.target.value))}>{options.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        </label> : null}
        {hasTotal ? <span className="ws-dt-range-text"><bdi dir="ltr">{from}–{to}</bdi> {text('من', 'of')} <bdi dir="ltr">{total}</bdi></span> : null}
        <div className="ws-dt-pager">
            <button type="button" className="ws-dt-icon" disabled={loading || page <= 1} onClick={() => table.setPage(page - 1)} aria-label={text('الصفحة السابقة', 'Previous page')}>{ar ? '›' : '‹'}</button>
            <span><bdi dir="ltr">{page}</bdi> / <bdi dir="ltr">{Math.max(last, 1)}</bdi></span>
            <button type="button" className="ws-dt-icon" disabled={loading || page >= last} onClick={() => table.setPage(page + 1)} aria-label={text('الصفحة التالية', 'Next page')}>{ar ? '‹' : '›'}</button>
        </div>
    </footer>;
}
