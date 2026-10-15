import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import useStoreContext from '../../hooks/useStoreContext';
import { equalTraffic, trafficTotal } from './ab-traffic';
import './merchant-catalog.css';
import './merchant-ab-tests.css';

const failureText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
function Icon({ name }) { return <svg aria-hidden viewBox="0 0 24 24"><path d={name === 'close' ? 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' : name === 'save' ? 'M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6m3-10H5V5h10z' : 'M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z'} /></svg>; }
export default function StoreAbTestsPage() {
    const context = useStoreContext();
    return <AbTests key={context.apiBase} context={context} />;
}
function AbTests({ context: { apiBase, uiBase, access } }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [rows, setRows] = useState([]); const [page, setPage] = useState(1); const [last, setLast] = useState(1); const [origin, setOrigin] = useState('');
    const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
    const [editor, setEditor] = useState(null); const [detail, setDetail] = useState(null); const [busy, setBusy] = useState(false); const [deleting, setDeleting] = useState(null); const [notice, setNotice] = useState('');
    const operation = useRef(0); const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        if (!access.canStoreProducts) return;
        let active = true; setLoading(true); setError('');
        api.get(`${apiBase}/ab-tests`, { params: { page } }).then(({ data }) => { if (active) { setRows(data.data); setLast(data.meta.last_page); setOrigin(data.storefront_url.replace(/\/$/, "")); } }).catch((e) => { if (active) setError(failureText(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, access.canStoreProducts, page, reload]);
    if (!access.canStoreProducts) return <Navigate to={`${uiBase}/overview`} replace />;
    const open = async (row, edit, revisionsPage = 1) => {
        if (busy) return;
        const request = ++operation.current; setBusy(true); setError('');
        try { const { data } = await api.get(`${apiBase}/ab-tests/${row.id}`, { params: { revisions_page: revisionsPage } }); if (!mounted.current || request !== operation.current) return;
            if (edit) setEditor({ ...data.data, active: Boolean(data.data.active), targets: data.revisions[0].targets.map(({ product_id, weight, name }) => ({ product_id, weight, name })) }); else setDetail(data);
        } catch (e) { if (mounted.current && request === operation.current) setError(failureText(e)); }
        finally { if (mounted.current && request === operation.current) setBusy(false); }
    };
    return <div className="ws-ab-tests" dir={ar ? 'rtl' : 'ltr'}>
        <header className="ws-catalog-header"><div><h1>{text('اختبارات A/B', 'A/B Tests')}</h1><p>{text('قم بإنشاء وإدارة اختبارات A/B لمنتجاتك لمعرفة أي منها يحقق أفضل النتائج.', 'Create and manage A/B tests for your products to find which perform best.')}</p></div></header>
        {error ? <div role="alert" className="ws-catalog-error">{error}<button onClick={() => setReload((n) => n + 1)}>{text('إعادة المحاولة', 'Try again')}</button></div> : null}
        {notice ? <p role="status">{notice}</p> : null}
        {loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : <>{!rows.length ? <div className="ws-ab-empty"><h2>{text('لا يوجد A/b tests حتي الان', 'No A/b tests yet')}</h2></div> : <div className="ws-ab-table-wrap"><table><thead><tr><th>{text('الاسم', 'Name')}</th><th>{text('الحالة', 'Status')}</th><th>{text('الرابط', 'Link')}</th><th>{text('الإجراءات', 'Actions')}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.active ? text('نشط', 'Active') : text('غير نشط', 'Inactive')}</td><td><a dir="ltr" href={`${origin}/ab/${row.slug}`} target="_blank" rel="noreferrer">/ab/{row.slug}</a></td><td><div className="ws-ab-actions"><button disabled={busy} onClick={() => open(row, false)}>{text('النتائج', 'Results')}</button><button disabled={busy} onClick={() => open(row, true)}>{text('تعديل', 'Edit')}</button><button disabled={busy} onClick={() => setDeleting(row)}>{text('حذف', 'Delete')}</button></div></td></tr>)}</tbody></table></div>}
            {last > 1 ? <nav className="ws-ab-actions" aria-label={text('صفحات التجارب', 'Test pages')}><button disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>{text('السابق', 'Previous')}</button><span>{page}/{last}</span><button disabled={page >= last} onClick={() => setPage((n) => n + 1)}>{text('التالي', 'Next')}</button></nav> : null}
            <button className="ws-ab-create" onClick={() => { setNotice(''); setEditor({ name: '', slug: '', active: true, targets: [] }); }}><Icon />{text('إنشاء', 'Create')}</button></>}
        {editor ? <AbEditor apiBase={apiBase} initial={editor} ar={ar} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setPage(1); setReload((n) => n + 1); setNotice(text('تم حفظ اختبار A/B', 'A/B test saved')); }} /> : null}
        {detail ? <AbModal title={`${text('النتائج', 'Results')}: ${detail.data.name}`} ar={ar} onClose={() => setDetail(null)} wide><p>{text('كل إصدار يعرض زواره وطلباته بشكل مستقل. التحويل هو أول طلب يحتوي المنتج لكل زائر خلال 30 يومًا. المبالغ أدناه للطلبات المدفوعة غير الملغاة؛ الطلب المسجل لا يعني تحصيل الدفع.', 'Each revision has separate visits and orders. A conversion is the first order containing the assigned product per visitor within 30 days. Amounts below are paid, non-cancelled order totals; placing an order does not mean payment was collected.')}</p>{detail.revisions.map((revision) => <section key={revision.id}><h3>{text('الإصدار', 'Revision')} {revision.version}</h3><div className="ws-ab-table-wrap"><table><thead><tr>{[text('المنتج', 'Product'), text('نسبة الترافيك', 'Traffic'), text('الزوار', 'Visitors'), text('الطلبات', 'Orders'), text('الملغاة', 'Cancelled'), text('التحويل', 'Conversion'), text('إجمالي الطلبات المدفوعة', 'Paid order totals')].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{revision.targets.map((target) => <tr key={target.product_id}><td>{target.name}</td><td>{target.weight / 100}%</td><td>{target.visits}</td><td>{target.orders}</td><td>{target.cancelled_orders}</td><td>{target.visits ? (100 * target.orders / target.visits).toFixed(2) : '0'}%</td><td>{target.paid.length ? target.paid.map((sum) => `${sum.total} ${sum.currency}`).join(' / ') : '—'}</td></tr>)}</tbody></table></div></section>)}{detail.meta.last_page > 1 ? <nav className="ws-ab-actions" aria-label={text('صفحات الإصدارات', 'Revision pages')}><button disabled={busy || detail.meta.current_page <= 1} onClick={() => open(detail.data, false, detail.meta.current_page - 1)}>{text('السابق', 'Previous')}</button><span>{detail.meta.current_page}/{detail.meta.last_page}</span><button disabled={busy || detail.meta.current_page >= detail.meta.last_page} onClick={() => open(detail.data, false, detail.meta.current_page + 1)}>{text('التالي', 'Next')}</button></nav> : null}{error ? <p role="alert" className="ws-ab-error">{error}</p> : null}</AbModal> : null}
        {deleting ? <AbModal title={text('حذف اختبار A/B', 'Delete A/B test')} ar={ar} onClose={() => { if (!busy) setDeleting(null); }}><p>{text('سيتوقف الرابط عن استقبال زيارات جديدة. تبقى بيانات الإسناد السابقة محفوظة.', 'The link will stop receiving new visits. Previous attribution data is retained.')}</p><p>{deleting.name}</p>{error ? <p role="alert" className="ws-ab-error">{error}</p> : null}<button disabled={busy} className="ws-ab-create" onClick={async () => { setBusy(true); setError(''); try { await api.delete(`${apiBase}/ab-tests/${deleting.id}`, { data: { version: deleting.version } }); if (mounted.current) { setDeleting(null); setPage(1); setReload((n) => n + 1); } } catch (e) { if (mounted.current) setError(failureText(e)); } finally { if (mounted.current) setBusy(false); } }}>{text('تأكيد الحذف', 'Confirm deletion')}</button></AbModal> : null}
    </div>;
}
function AbModal({ title, ar, onClose, wide, children }) {
    return <Dialog open onClose={onClose} className="ws-ab-dialog" dir={ar ? 'rtl' : 'ltr'}><DialogBackdrop className="ws-ab-backdrop" transition /><div className="ws-ab-dialog-position"><DialogPanel className={`ws-ab-modal ${wide ? 'ws-ab-wide' : ''}`} transition><header><DialogTitle>{title}</DialogTitle><button aria-label={ar ? 'إغلاق' : 'Close'} onClick={onClose}><Icon name="close" /></button></header>{children}</DialogPanel></div></Dialog>;
}
function AbEditor({ apiBase, initial, ar, onClose, onSaved }) {
    const text = (a, e) => ar ? a : e;
    const [draft, setDraft] = useState(initial); const [options, setOptions] = useState([]); const [query, setQuery] = useState(''); const [page, setPage] = useState(1); const [last, setLast] = useState(1); const [picker, setPicker] = useState(false);
    const [error, setError] = useState(''); const [loadError, setLoadError] = useState(''); const [loading, setLoading] = useState(false); const [retry, setRetry] = useState(0); const [busy, setBusy] = useState(false); const [stale, setStale] = useState(false); const saving = useRef(false);
    useEffect(() => {
        if (!picker) return;
        let active = true; setLoading(true); setLoadError('');
        const timer = setTimeout(() => { api.get(`${apiBase}/ab-tests/products`, { params: { q: query, page } }).then(({ data }) => { if (active) { setOptions(data.data); setLast(data.meta.last_page); } }).catch((e) => { if (active) setLoadError(failureText(e)); }).finally(() => { if (active) setLoading(false); }); }, 180);
        return () => { active = false; clearTimeout(timer); };
    }, [apiBase, query, page, picker, retry]);
    const total = trafficTotal(draft.targets); const update = (field, value) => setDraft((old) => ({ ...old, [field]: value }));
    const save = async (event) => {
        event.preventDefault(); if (saving.current || stale || total !== 10000 || !draft.targets.length) return;
        saving.current = true; setBusy(true); setError('');
        try { const payload = { ...draft, targets: draft.targets.map(({ product_id, weight }) => ({ product_id, weight })) }; await api[initial.id ? 'put' : 'post'](`${apiBase}/ab-tests${initial.id ? `/${initial.id}` : ''}`, payload); onSaved(); }
        catch (e) { setError(failureText(e)); if (e.response?.status === 409) setStale(true); }
        finally { saving.current = false; setBusy(false); }
    };
    return <AbModal title={initial.id ? text('تعديل اختبار A/B', 'Edit A/B test') : text('إنشاء اختبار A/B', 'Create A/B test')} ar={ar} onClose={() => { if (!saving.current) onClose(); }}><form onSubmit={save}>
        <div className="ws-ab-form"><label className="ws-ab-active"><input type="checkbox" role="switch" checked={draft.active} onChange={(e) => update('active', e.target.checked)} /><span>{text('نشط', 'Active')}</span></label>
            <label className="ws-ab-field"><span>{text('الاسم', 'Name')} *</span><input required maxLength={160} value={draft.name} onChange={(e) => update('name', e.target.value)} /></label>
            <label className="ws-ab-field"><span>{text('المعرف (slug)', 'Identifier (slug)')} *</span><input required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" dir="ltr" value={draft.slug} onChange={(e) => update('slug', e.target.value)} /><small>{text('معرف فريد يستخدم في الرابط (مثال: summer-sale)', 'A unique identifier used in the link (e.g. summer-sale)')}</small></label>
            <div className="ws-ab-picker"><label className="ws-ab-field"><span>{text('اختر المنتجات', 'Choose products')}</span><input aria-expanded={picker} aria-controls="ab-products" placeholder={text('ابحث عن منتج', 'Search for a product')} value={query} onFocus={() => setPicker(true)} onChange={(e) => { setQuery(e.target.value); setPage(1); setPicker(true); }} /></label>
                {picker ? <div id="ab-products" className="ws-ab-options"><button type="button" onClick={() => setPicker(false)}>{text('إغلاق القائمة', 'Close list')}</button>{loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : loadError ? <div role="alert">{loadError}<button type="button" onClick={() => setRetry((n) => n + 1)}>{text('إعادة المحاولة', 'Try again')}</button></div> : <>{options.length ? options.map((product) => <button type="button" key={product.id} aria-pressed={draft.targets.some((target) => target.product_id === product.id)} onClick={() => setDraft((old) => ({ ...old, targets: old.targets.some((target) => target.product_id === product.id) ? old.targets.filter((target) => target.product_id !== product.id) : old.targets.length < 20 ? [...old.targets, { product_id: product.id, name: product.name, weight: 5000 }] : old.targets }))}>{draft.targets.some((target) => target.product_id === product.id) ? '✓ ' : ''}{product.name}</button>) : <p>{text('لا توجد منتجات', 'No products')}</p>}{last > 1 ? <div className="ws-ab-actions"><button type="button" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>{text('السابق', 'Previous')}</button><span>{page}/{last}</span><button type="button" disabled={page >= last} onClick={() => setPage((n) => n + 1)}>{text('التالي', 'Next')}</button></div> : null}</>}</div> : null}
            </div>
            <div className="ws-ab-allocation"><span>{text('التحكم في نسبة الترافيك', 'Traffic allocation')}</span><button type="button" onClick={() => update('targets', equalTraffic(draft.targets))}>{text('توزيع النسبة بالتساوي', 'Distribute equally')}</button></div>
            <div className="ws-ab-table-wrap"><table><thead><tr><th>{text('المنتج', 'Product')}</th><th>{text('نسبة الترافيك', 'Traffic percentage')}</th></tr></thead><tbody>{draft.targets.map((target) => <tr key={target.product_id}><td>{target.name}<button type="button" aria-label={`${text('إزالة', 'Remove')} ${target.name}`} onClick={() => update('targets', draft.targets.filter((row) => row.product_id !== target.product_id))}>×</button></td><td><input type="number" aria-label={`${text('نسبة الترافيك', 'Traffic percentage')} ${target.name}`} min="0" max="100" step="0.01" required value={target.weight / 100} onChange={(e) => update('targets', draft.targets.map((row) => row.product_id === target.product_id ? { ...row, weight: Math.round(Number(e.target.value) * 100) } : row))} /> %</td></tr>)}</tbody><tfoot><tr><td>{text('المجموع', 'Total')}</td><td aria-live="polite">{total / 100}%</td></tr></tfoot></table></div>
            {total !== 10000 ? <p role="status" className="ws-ab-warning">⚠ {text('يجب أن يكون مجموع النسب 100%', 'Traffic percentages must total 100%')}</p> : null}
            {initial.id ? <small>{text('الحفظ ينشئ إصدارًا جديدًا بنتائج مستقلة. الإيقاف يمنع الزيارات الجديدة مع الاحتفاظ بإسناد الزيارات السابقة.', 'Saving creates a new revision with separate results. Pausing stops new visits and preserves attribution for existing visits.')}</small> : null}
            {error ? <p role="alert" className="ws-ab-error">{error}</p> : null}
        </div><footer><button className="ws-ab-save" disabled={busy || stale || total !== 10000 || !draft.targets.length}><Icon name="save" />{text('حفظ', 'Save')}</button><button type="button" disabled={busy} onClick={onClose}>{text('إلغاء', 'Cancel')}</button></footer>
    </form></AbModal>;
}
