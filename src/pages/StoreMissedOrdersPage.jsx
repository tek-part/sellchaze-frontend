import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { useDebounced } from '../hooks/useDebounced';
import { fetchAllPages } from '../utils/fetchAllPages';

export default function StoreMissedOrdersPage() {
    const { apiBase } = useStoreScope();
    return <MissedOrders key={apiBase} apiBase={apiBase} />;
}

function MissedOrders({ apiBase }) {
    const tabsId = useId(); const tabButtons = useRef([]);
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [status, setStatus] = useState(''); const [query, setQuery] = useState(''); const search = useDebounced(query, 300);
    const [source, setSource] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [filters, setFilters] = useState(false);
    const [page, setPage] = useState(1); const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
    const [selected, setSelected] = useState(new Map()); const [busy, setBusy] = useState(false);
    const path = `${apiBase}/missed-orders`;
    const params = { ...(status ? { status } : {}), ...(search ? { search } : {}), ...(source ? { source } : {}), ...(from ? { date_from: from } : {}), ...(to ? { date_to: to } : {}) };
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(path, { params: { status, search, source, date_from: from, date_to: to, page, per_page: 25 } }).then(({ data }) => { if (active) setResult(data); }).catch((e) => { if (active) setError(e.response?.data?.message || e.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [path, status, search, source, from, to, page, reload]);
    useEffect(() => { const timer = window.setInterval(() => { if (document.visibilityState !== 'hidden' && !busy) setReload((value) => value + 1); }, 45000); return () => window.clearInterval(timer); }, [busy]);
    const pending = loading || query !== search; const rows = result?.data || [];
    const count = (result?.counts?.under_review || 0) + (result?.counts?.completed || 0);
    const tabs = [['', text('جميع الطلبات', 'All orders'), count], ['completed', text('مكتمل', 'Completed'), result?.counts?.completed || 0], ['under_review', text('تحت المراجعة', 'Under review'), result?.counts?.under_review || 0]];
    const resetPage = (setter, value) => { setter(value); setPage(1); setSelected(new Map()); };
    const moveTab = (event, index) => {
        let next;
        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else if (event.key === 'ArrowRight') next = (index + (ar ? -1 : 1) + tabs.length) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index + (ar ? 1 : -1) + tabs.length) % tabs.length;
        if (next === undefined) return;
        event.preventDefault(); resetPage(setStatus, tabs[next][0]); tabButtons.current[next]?.focus();
    };
    const toggle = (row, checked) => setSelected((current) => { const next = new Map(current); if (checked) next.set(row.id, row); else next.delete(row.id); return next; });
    async function updateStatus(nextStatus, selections) {
        if (busy || !selections.length) return; setBusy(true); setError('');
        try { await api.post(`${path}/bulk-status`, { status: nextStatus, leads: selections.map((row) => ({ id: row.id, version: row.edit_version })) }); setSelected(new Map()); setReload((value) => value + 1); }
        catch (e) { setError(e.response?.data?.message || e.message); } finally { setBusy(false); }
    }
    async function exportRows() {
        if (busy || pending) return; setBusy(true); setError('');
        try {
            if (!selected.size && result?.meta?.total > 10000) throw new Error(text('ضيّق الفلاتر لتصدير 10,000 محاولة أو أقل.', 'Narrow filters to export 10,000 checkouts or fewer.'));
            const data = selected.size ? [...selected.values()] : await fetchAllPages(path, { ...params, per_page: 100 });
            const href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })); const link = document.createElement('a'); link.href = href; link.download = 'missed-orders.json'; link.click(); URL.revokeObjectURL(href);
        } catch (e) { setError(e.message); } finally { setBusy(false); }
    }
    return <div className="ws-missed">
        <header className="ws-missed-heading"><h1>{text('الطلبات المفقودة', 'Missed orders')}</h1><p>{text('الطلبات المفقودة هي الطلبات التي لم يتم إرسالها لمتجرك بسبب عدم إكمال العميل للطلب.', 'Missed orders are checkouts the customer did not complete.')}</p></header>
        {error ? <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-red-700">{error}<button className="ms-3 underline" onClick={() => setReload((value) => value + 1)}>{text('إعادة التحميل', 'Reload')}</button></p> : null}
        {pending && !result ? <p role="status" className="py-20 text-center">{text('جارٍ التحميل…', 'Loading…')}</p> : !count && !error ? <div className="ws-missed-empty"><h2>{text('لا توجد طلبات مفقودة حتى الآن', 'No missed orders yet')}</h2></div> : <>
            <div className="ws-missed-toolbar"><div className="ws-missed-tabs" role="tablist" aria-label={text('حالة المراجعة', 'Review status')}>{tabs.map(([value, label, total], index) => <button key={value} ref={(element) => { tabButtons.current[index] = element; }} id={`${tabsId}-tab-${index}`} aria-controls={`${tabsId}-panel`} tabIndex={status === value ? 0 : -1} role="tab" type="button" aria-selected={status === value} onKeyDown={(event) => moveTab(event, index)} onClick={() => resetPage(setStatus, value)}>{label}<span>{total}</span></button>)}</div><div className="ws-catalog-actions"><button className="ws-catalog-button" disabled={busy || pending || (!selected.size && !result?.meta?.total)} onClick={exportRows}>{text('تصدير', 'Export')}</button><button className="ws-catalog-button" aria-expanded={filters} onClick={() => setFilters((value) => !value)}>{text('إضافة فلتر', 'Add filter')}</button></div></div>
            <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-tab-${tabs.findIndex(([value]) => value === status)}`} aria-busy={pending} tabIndex={0}>
            {filters ? <section className="ws-missed-filters" aria-label={text('الفلاتر', 'Filters')}><label>{text('بحث', 'Search')}<input className="ws-catalog-filter" value={query} placeholder={text('الاسم أو الهاتف أو البريد الإلكتروني', 'Name, phone or email')} onChange={(event) => resetPage(setQuery, event.target.value)} /></label><label>{text('المصدر', 'Source')}<select className="ws-catalog-filter" value={source} onChange={(event) => resetPage(setSource, event.target.value)}><option value="">{text('الكل', 'All')}</option><option value="storefront">{text('المتجر', 'Storefront')}</option><option value="funnel">Funnels</option></select></label><label>{text('من تاريخ', 'From date')}<input className="ws-catalog-filter" type="date" value={from} onChange={(event) => resetPage(setFrom, event.target.value)} /></label><label>{text('إلى تاريخ', 'To date')}<input className="ws-catalog-filter" type="date" value={to} min={from || undefined} onChange={(event) => resetPage(setTo, event.target.value)} /></label><button className="ws-catalog-button" onClick={() => { setQuery(''); setSource(''); setFrom(''); setTo(''); setPage(1); setSelected(new Map()); }}>{text('مسح الفلاتر', 'Clear filters')}</button></section> : null}
            {selected.size ? <div className="ws-missed-selection"><span>{selected.size} {text('محدد', 'selected')}</span><button className="ws-catalog-button" disabled={busy || selected.size > 100} onClick={() => updateStatus('completed', [...selected.values()])}>{text('تحديد كمكتمل', 'Mark completed')}</button><button className="ws-catalog-button" disabled={busy || selected.size > 100} onClick={() => updateStatus('under_review', [...selected.values()])}>{text('إعادة للمراجعة', 'Return to review')}</button></div> : null}
            <section className="ws-catalog-card"><div className="ws-catalog-table"><table><thead><tr><th><input type="checkbox" disabled={pending || !rows.length} checked={rows.length > 0 && rows.every((row) => selected.has(row.id))} aria-label={text('اختيار الصفحة', 'Select page')} onChange={(event) => rows.forEach((row) => toggle(row, event.target.checked))} /></th><th>{text('العميل', 'Customer')}</th><th>{text('المنتجات', 'Products')}</th><th>{text('قيمة المنتجات', 'Product subtotal')}</th><th>{text('آخر نشاط', 'Last activity')}</th><th>{text('الحالة', 'Status')}</th><th>{text('إجراءات', 'Actions')}</th></tr></thead><tbody>{pending ? <tr><td colSpan={7} role="status">{text('جارٍ التحميل…', 'Loading…')}</td></tr> : rows.length ? rows.map((row) => <tr key={row.id}><td><input type="checkbox" aria-label={`${text('اختيار', 'Select')} ${row.customer_name || row.id}`} checked={selected.has(row.id)} onChange={(event) => toggle(row, event.target.checked)} /></td><td><strong>{row.customer_name || '—'}</strong>{row.customer_phone ? <div dir="ltr"><a href={`tel:${(row.phone_dial || row.customer_phone).replace(/[^+\d]/g, '')}`}>{row.customer_phone}</a></div> : null}{row.customer_email ? <div>{row.customer_email}</div> : null}{row.shipping_address || row.notes || row.coupon_code || row.shipping_selection?.region_name || row.shipping_selection?.option_name ? <details><summary>{text('تفاصيل التواصل', 'Contact details')}</summary><p>{Object.values(row.shipping_address || {}).filter(Boolean).join(' · ')}</p>{row.shipping_selection?.region_name ? <p>{row.shipping_selection.region_name}</p> : null}{row.shipping_selection?.option_name ? <p>{row.shipping_selection.option_name}</p> : null}{row.coupon_code ? <p>{text('الكوبون', 'Coupon')}: {row.coupon_code}</p> : null}{row.notes ? <p>{row.notes}</p> : null}</details> : null}</td><td>{row.items.map((item, index) => <div key={`${item.product_id}:${item.variant_id}:${index}`}>{item.name} × {item.quantity}</div>)}<small>{row.source === 'funnel' ? 'Funnels' : text('المتجر', 'Storefront')}</small></td><td>{new Intl.NumberFormat(ar ? 'ar-EG' : 'en-GB', { style: 'currency', currency: row.currency }).format(Number(row.subtotal))}<small className="block">{text('قبل الخصم والتوصيل', 'Before discounts and delivery')}</small></td><td>{new Date(row.last_activity_at).toLocaleString(ar ? 'ar-EG' : 'en-GB')}</td><td><span className={`ws-missed-status ws-missed-status--${row.status}`}>{row.status === 'completed' ? text('مكتمل', 'Completed') : text('تحت المراجعة', 'Under review')}</span></td><td><button className="ws-catalog-button" disabled={busy} onClick={() => updateStatus(row.status === 'completed' ? 'under_review' : 'completed', [row])}>{row.status === 'completed' ? text('إعادة للمراجعة', 'Return to review') : text('تحديد كمكتمل', 'Mark completed')}</button></td></tr>) : <tr><td colSpan={7}>{text('لا توجد نتائج لهذه الفلاتر.', 'No results for these filters.')}</td></tr>}</tbody></table></div>
                <footer className="ws-catalog-pagination"><span>{result?.meta?.total || 0} · {page}/{result?.meta?.last_page || 1}</span><button disabled={pending || page <= 1} onClick={() => setPage(page - 1)}>{text('السابق', 'Previous')}</button><button disabled={pending || page >= (result?.meta?.last_page || 1)} onClick={() => setPage(page + 1)}>{text('التالي', 'Next')}</button></footer>
            </section>
            </div>
        </>}
    </div>;
}
