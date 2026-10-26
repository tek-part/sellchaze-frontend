import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import useWorkspaceAppearance from '../components/workspace/useWorkspaceAppearance';
import { HiOutlineArrowPath, HiOutlinePrinter, HiOutlinePlus, HiOutlineShoppingBag } from '../components/workspace/WorkspaceIcons';
import { IndexFilters, IndexTable, useIndexTable } from '../components/data-table';
import OrderExportDialog from '../components/store/orders/OrderExportDialog';
import { OrderBotWarning } from '../components/store/orders/OrderBotVerification';
import OrderBulkPaymentReview from '../components/store/orders/OrderBulkPaymentReview';
import OrderProductFilter from '../components/store/orders/OrderProductFilter';
import { ORDER_STATUSES, ORDER_BULK_STATUSES, ORDER_PAYMENT_TARGETS, ORDER_RISK_STATUSES, ORDER_RETURN_STATUSES, orderAddress, orderStatusLabel } from '../components/store/orders/order-workspace';
import { PAYMENT_STATUS_LABELS } from '../components/store/orders/order-refunds';
import '../components/store/orders/orders-workspace.css';

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const DEFAULTS = { sort: { by: 'created_at', direction: 'desc' }, perPage: 25, perPageOptions: [25, 50, 100] };
// Refund states are set by recorded refunds (partially_refunded / refunded), never by a gateway.
const PAYMENT_LABELS = PAYMENT_STATUS_LABELS;
const PAYMENT_FILTERS = ['pending', 'paid', 'failed', 'partially_refunded', 'refunded'];

function ExportFile({ id, apiBase, ar, onClose, theme }) {
    const text = (a, e) => ar ? a : e; const [row, setRow] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
    const unavailable = text('التصدير غير متاح لهذا الحساب أو المتجر.', 'This export is unavailable for this account or store.');
    useEffect(() => { let active = true; const load = () => api.get(`${apiBase}/orders/exports/${id}`).then(({ data }) => { if (active) setRow(data.data); }).catch(() => { if (active) setError(unavailable); }); void load(); const timer = window.setInterval(() => { if (document.visibilityState !== 'hidden') void load(); }, 5000); return () => { active = false; window.clearInterval(timer); }; }, [id, apiBase, unavailable]);
    async function download() {
        setBusy(true); setError('');
        try { const { data } = await api.get(`${apiBase}/orders/exports/${id}/download`, { responseType: 'blob' }); const href = URL.createObjectURL(data); const link = document.createElement('a'); link.href = href; link.download = `orders-${id}.csv`; link.click(); window.setTimeout(() => URL.revokeObjectURL(href), 1000); }
        catch { setError(text('تعذر تنزيل الملف. ربما انتهت صلاحيته أو تغيرت صلاحية الوصول إلى الطلبات.', 'The file could not be downloaded. It may have expired or order access may have changed.')); }
        finally { setBusy(false); }
    }
    const labels = { queued: text('التصدير في انتظار المعالجة', 'Export queued'), processing: text('جارٍ تجهيز الملف', 'Preparing file'), ready: text('الملف جاهز للتنزيل', 'File ready to download'), failed: text('تعذر إنشاء الملف. جرّب فترة زمنية أصغر أو أعد المحاولة.', 'Could not generate the file. Try a smaller date range or request it again.'), expired: text('انتهت صلاحية الملف. اطلب تصديرًا جديدًا.', 'The file expired. Request a new export.') };
    return <Dialog open onClose={onClose} className="ws-orders-dialog" dir={ar ? 'rtl' : 'ltr'} data-workspace-theme={theme}><DialogBackdrop className="ws-orders-backdrop" /><div className="ws-orders-dialog-position"><DialogPanel className="ws-orders-export-panel"><DialogTitle>{text('تصدير الطلبات', 'Order export')}</DialogTitle><div className="ws-orders-export-content"><p role="status">{row ? labels[row.status] || row.status : text('جارٍ التحميل…', 'Loading…')}</p>{row?.status === 'ready' ? <><p>{text('عدد الطلبات', 'Orders')}: {row.row_count}</p><p>{text('متاح حتى', 'Available until')}: {new Date(row.expires_at).toLocaleString(ar ? 'ar-EG' : 'en-GB')}</p><button type="button" className="ws-primary-button" disabled={busy} onClick={() => void download()}>{text('تنزيل الملف', 'Download file')}</button></> : null}{error ? <p role="alert">{error}</p> : null}</div><footer><button type="button" onClick={onClose}>{text('إغلاق', 'Close')}</button></footer></DialogPanel></div></Dialog>;
}

export default function StoreOrdersPage() {
    const { apiBase, uiBase } = useStoreScope(); const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const { permissions = [], me, store } = useOutletContext(); const { theme } = useWorkspaceAppearance(); const [urlParams, setUrlParams] = useSearchParams();
    const scopeIdentity = `${apiBase}:${me?.id ?? ''}:${store?.id ?? ''}`;
    const [reload, setReload] = useState(0); const [result, setResult] = useState(null); const [loadError, setLoadError] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
    const [exportOpen, setExportOpen] = useState(false); const [statusOpen, setStatusOpen] = useState(false); const [nextStatus, setNextStatus] = useState(''); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
    const productNames = useRef(new Map());
    const activeResult = result?.scope === scopeIdentity ? result.payload : null;
    const canManage = permissions.includes('store.orders.manage');
    const rows = useMemo(() => activeResult?.data || [], [activeResult]);

    // Older links (customers page, notifications) used ?search=; the table reads ?q=.
    useEffect(() => {
        if (!urlParams.has('search') || urlParams.has('q')) return;
        const next = new URLSearchParams(urlParams); next.set('q', String(urlParams.get('search')).slice(0, 200)); next.delete('search'); setUrlParams(next, { replace: true });
    }, [urlParams, setUrlParams]);

    const option = ([value, a, e]) => ({ value, label: ar ? a : e });
    const filters = useMemo(() => [
        { key: 'status', label: text('حالة الطلب', 'Order status'), type: 'select', options: ORDER_STATUSES.map(option) },
        { key: 'payment', param: 'payment_status', label: text('حالة الدفع', 'Payment status'), type: 'select', options: PAYMENT_FILTERS.map((key) => ({ value: key, label: PAYMENT_LABELS[key][ar ? 0 : 1] })) },
        { key: 'risk', param: 'classification', label: text('تصنيف المخاطر', 'Risk'), type: 'select', options: ORDER_RISK_STATUSES.map(option) },
        { key: 'product', param: 'product_id', label: text('المنتج', 'Product'), type: 'custom',
            describe: (id) => productNames.current.get(String(id)) || `#${id}`,
            editor: ({ value, onApply }) => <OrderProductFilter apiBase={apiBase} value={value} ar={ar} onChange={(id, chosen) => { if (chosen?.name) productNames.current.set(String(id), chosen.name); onApply(id); }} /> },
        { key: 'date', label: text('تاريخ الطلب', 'Order date'), type: 'date-range' },
        { key: 'order_id', label: text('رقم الطلب', 'Order ID'), type: 'text' },
        { key: 'customer', label: text('اسم العميل', 'Customer name'), type: 'text' },
        { key: 'customer_phone', label: text('رقم هاتف العميل', 'Customer phone'), type: 'text' },
        { key: 'address', label: text('عنوان العميل', 'Customer address'), type: 'text' },
        { key: 'coupon', label: text('الكوبون', 'Coupon'), type: 'text' },
        { key: 'source', label: text('مصدر الحملة', 'Campaign source'), type: 'text' },
        { key: 'campaign', label: text('اسم الحملة', 'Campaign name'), type: 'text' },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, apiBase]);
    // The 17 order tabs merchants know, as built-in views (fulfilment, payment and risk are independent filters).
    const views = useMemo(() => [
        { id: 'all', label: text('كل الطلبات', 'All orders'), state: { filters: {} } },
        ...ORDER_STATUSES.slice(0, 2).map(([key, a, e]) => ({ id: key, label: ar ? a : e, state: { filters: { status: key } } })),
        ...['pending', 'paid', 'failed'].map((key) => ({ id: `payment-${key}`, label: PAYMENT_LABELS[key][ar ? 0 : 1], state: { filters: { payment: key } } })),
        ...ORDER_STATUSES.slice(2).map(([key, a, e]) => ({ id: key, label: ar ? a : e, state: { filters: { status: key } } })),
        ...ORDER_RISK_STATUSES.map(([key, a, e]) => ({ id: key, label: ar ? a : e, state: { filters: { risk: key } } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const money = (value, currency) => { const amount = Number(value); return Number.isFinite(amount) ? new Intl.NumberFormat(ar ? 'ar-EG' : 'en', currency ? { style: 'currency', currency, maximumFractionDigits: 2 } : { maximumFractionDigits: 2 }).format(amount) : value; };
    const columns = useMemo(() => [
        { key: 'order', header: text('الطلب', 'Order'), hideable: false, sortKey: 'id', csv: (row) => row.order_number || row.id,
            render: (row) => <div><Link className="ws-dt-title" to={`${uiBase}/orders/${row.id}`}>#{row.id}</Link><OrderBotWarning verified={row.bot_verified} ar={ar} /></div> },
        { key: 'customer', header: text('العميل', 'Customer'), primary: true, sortKey: 'customer_name', csv: (row) => row.customer?.name ?? '',
            render: (row) => <div><span className="ws-dt-title">{row.customer?.name || '—'}</span><span className="ws-dt-sub" dir="ltr">{row.customer?.phone || '—'}</span></div> },
        { key: 'address', header: text('العنوان', 'Address'), csv: (row) => orderAddress(row.shipping_address), render: (row) => <span className="ws-orders-address">{orderAddress(row.shipping_address) || '—'}</span> },
        { key: 'total', header: text('الإجمالي', 'Total'), sortKey: 'grand_total', align: 'end', csv: (row) => row.grand_total, render: (row) => <span className="ws-dt-num">{money(row.grand_total, row.currency)}</span> },
        { key: 'status', header: text('حالة الطلب', 'Order status'), sortKey: 'status', csv: (row) => row.status,
            render: (row) => <span className="ws-orders-status-cell"><span className={`ws-orders-status is-${row.status}`}>{orderStatusLabel(row.status, ar)}</span>{row.review?.classification ? <small className={`ws-orders-review is-${row.review.classification}`}>{ORDER_RISK_STATUSES.find(([key]) => key === row.review.classification)?.[ar ? 1 : 2] || text('طلب مزعج', 'Spam')}</small> : null}</span> },
        { key: 'payment', header: text('الدفع', 'Payment'), defaultHidden: true, csv: (row) => row.payment_status ?? '',
            render: (row) => row.payment_status ? <span className={`ws-dt-badge ${row.payment_status === 'paid' ? 'is-success' : row.payment_status === 'failed' ? 'is-critical' : ['refunded', 'partially_refunded'].includes(row.payment_status) ? 'is-info' : 'is-warning'}`}>{PAYMENT_LABELS[row.payment_status]?.[ar ? 0 : 1] ?? row.payment_status}</span> : '—' },
        { key: 'ip_country', header: 'IP Country', csv: (row) => row.ip_country ?? '', render: (row) => row.ip_country ?? '' },
        { key: 'date', header: text('تاريخ الطلب', 'Order date'), sortKey: 'created_at', csv: (row) => row.created_at ?? '', render: (row) => <span className="ws-dt-num">{row.created_at ? new Date(row.created_at).toLocaleString(ar ? 'ar-EG' : 'en-GB') : '—'}</span> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase]);
    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:orders`, filters, columns, views, defaults: DEFAULTS });

    // The orders endpoint names its sort parameters `sort`/`dir`.
    const { sort_by: sortBy, sort_direction: sortDirection, ...listParams } = table.apiParams;
    const query = Object.fromEntries(Object.entries(listParams).filter(([key]) => !['page', 'per_page'].includes(key)));
    const params = { ...listParams, sort: sortBy ?? 'created_at', dir: sortDirection ?? 'desc' };
    const paramsKey = JSON.stringify(params);
    useEffect(() => {
        let active = true; setLoading(true); setLoadError('');
        api.get(`${apiBase}/orders`, { params: JSON.parse(paramsKey) }).then(({ data }) => { if (active) setResult({ scope: scopeIdentity, payload: data }); })
            .catch((e) => { if (active) setLoadError(e.response?.data?.message || e.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, scopeIdentity, paramsKey, reload]);
    // Another account behind the same /my-store endpoint: drop its selection and dialogs at once.
    useEffect(() => { table.clearSelection(); setStatusOpen(false); setBusy(false); setNotice(''); }, [scopeIdentity]); // eslint-disable-line react-hooks/exhaustive-deps

    const selected = table.selected;
    async function updateStatuses() { if (busy || !nextStatus || !selected.size) return; setBusy(true); setError(''); try { const { data } = await api.post(`${apiBase}/orders/bulk-status`, { status: nextStatus, eligible_only: true, orders: [...selected.values()].map(row => ({ id: row.id, status: row.status, review_version: row.review?.version || 0 })) }); table.clearSelection(); setStatusOpen(false); setReload(value => value + 1); setNotice(text(`تم تحديث ${data.updated} طلب. غير مؤهل: ${data.skipped}، دون تغيير: ${data.unchanged}.`, `${data.updated} orders updated. Ineligible: ${data.skipped}, unchanged: ${data.unchanged}.`)); } catch (e) { setError(e.response?.data?.message || e.message); } finally { setBusy(false); } }
    const paymentTarget = ORDER_PAYMENT_TARGETS[nextStatus];
    const exportId = urlParams.get('export'); const showExport = exportId && uuid.test(exportId); const meta = activeResult?.meta;
    const bulkActions = canManage ? [
        { key: 'status', label: text('تحديث حالة الطلب', 'Update order status'), icon: HiOutlineArrowPath, disabled: () => loading || busy, onAction: () => { setNextStatus(''); setError(''); setStatusOpen(true); } },
        { key: 'print', label: text('طباعة الطلبات المحددة', 'Print selected orders'), icon: HiOutlinePrinter, onAction: (list) => window.open(`${uiBase}/orders/print?ids=${list.map((row) => row.id).join(',')}`, '_blank', 'noopener') },
    ] : [];

    return <div className="ws-orders ws-orders-index">
        <header className="ws-orders-heading ws-orders-heading-row"><div><h1>{text('الطلبات', 'Orders')}</h1><p>{text('يمكنك التحكم في طلباتك وفلترتها حسب الحالة ويمكنك عرض أي طلب بالضغط عليه وتعديل حالته.', 'Manage and filter orders by status. Open any order to review it and change its status.')}</p></div>
            {canManage ? <Link to={`${uiBase}/orders/create`} className="ws-dt-button ws-dt-button-primary"><HiOutlinePlus aria-hidden />{text('أنشاء طلب', 'Create order')}</Link> : null}</header>
        {notice ? <p role="status" className="ws-orders-notice">{notice}</p> : null}
        {meta?.locked_orders > 0 ? <p role="status" className="ws-orders-notice">{text('توجد طلبات جديدة محجوبة بسبب مديونية المحفظة. تظل الطلبات القديمة متاحة ويستمر المتجر في استقبال الطلبات.', 'New orders are hidden because of wallet debt. Existing orders remain accessible and the store can still accept orders.')} <Link to="/top-up">{text('عرض المحفظة', 'View wallet')}</Link></p> : null}
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('ابحث برقم الطلب أو اسم العميل أو الهاتف أو البريد', 'Search order number, customer, phone or email')}
                onExport={canManage ? () => setExportOpen(true) : undefined} exportDisabled={loading} />
            <IndexTable table={table} rows={rows} loading={loading && !activeResult} error={loadError} onRetry={() => setReload((value) => value + 1)} meta={meta}
                label={text('الطلبات', 'Orders')} bulkActions={bulkActions} maxSelection={100} rowHref={(row) => `${uiBase}/orders/${row.id}`}
                emptyState={{ icon: HiOutlineShoppingBag, title: text('لا توجد طلبات بعد', 'No orders yet'), description: text('ستظهر هنا طلبات متجرك فور وصولها.', 'Your store’s orders will appear here as they arrive.') }} />
        </div>
        {exportOpen ? <OrderExportDialog open apiBase={apiBase} filters={query} ar={ar} theme={theme} onClose={() => setExportOpen(false)} onQueued={() => setNotice(text('سيظهر ملف التصدير في الإشعارات عند جاهزيته.', 'The export file will appear in notifications when ready.'))} /> : null}
        {showExport ? <ExportFile id={exportId} apiBase={apiBase} ar={ar} theme={theme} onClose={() => { const next = new URLSearchParams(urlParams); next.delete('export'); setUrlParams(next, { replace: true }); }} /> : null}
        <Dialog open={statusOpen} onClose={() => { if (!busy) setStatusOpen(false); }} className="ws-orders-dialog" dir={ar ? 'rtl' : 'ltr'} data-workspace-theme={theme}><DialogBackdrop className="ws-orders-backdrop" /><div className="ws-orders-dialog-position"><DialogPanel className="ws-orders-export-panel"><DialogTitle>{text('تحديث حالة الطلبات المحددة', 'Update selected orders')}</DialogTitle><div className="ws-orders-export-content"><p>{text(`لقد اخترت ${selected.size} من الطلبات.`, `You selected ${selected.size} orders.`)}</p><label>{text('حالة الطلب', 'Order status')}<select value={nextStatus} disabled={busy} onChange={event => { setNextStatus(event.target.value); setError(''); }}><option value="">{text('اختر الحالة', 'Choose status')}</option>{ORDER_BULK_STATUSES.map(([key, a, e]) => <option key={key} value={key}>{ar ? a : e}</option>)}</select></label>{paymentTarget ? <OrderBulkPaymentReview key={`${scopeIdentity}:${nextStatus}`} ids={[...selected.keys()]} target={paymentTarget} apiBase={apiBase} uiBase={uiBase} ar={ar} onCancel={() => setStatusOpen(false)} onBusy={setBusy} onComplete={data => { table.clearSelection(); setStatusOpen(false); setReload(value => value + 1); setNotice(text(`تم تحديث دفع ${data.updated} طلب. غير مؤهل: ${data.skipped}، دون تغيير: ${data.unchanged}.`, `Payment updated for ${data.updated} orders. Ineligible: ${data.skipped}, unchanged: ${data.unchanged}.`)); }} /> : <p>{text('سيتم تطبيق الحالة الجديدة على الطلبات المؤهلة فقط وفقًا لدورة حياة الطلب.', 'The new status will be applied only to eligible orders according to their lifecycle.')}</p>}{ORDER_RETURN_STATUSES.includes(nextStatus) ? <p>{text('تتبع إرجاع المنتجات لا يصدر استردادًا ماليًا ولا يعيد المخزون تلقائيًا.', 'Tracking a product return does not issue a payment refund or automatically restock products.')}</p> : null}{ORDER_RISK_STATUSES.some(([key]) => key === nextStatus) ? <p>{text('تصنيف يدوي للمراجعة؛ تبقى حالة الطلب والدفع كما هي.', 'A manual review classification. Order and payment status stay as recorded.')}</p> : null}{error ? <p role="alert">{error}</p> : null}</div>{!paymentTarget ? <footer><button type="button" disabled={busy} onClick={() => setStatusOpen(false)}>{text('إلغاء', 'Cancel')}</button><button type="button" disabled={busy || !nextStatus} onClick={() => void updateStatuses()}>{text('تحديث حالة الطلبات', 'Update orders')}</button></footer> : null}</DialogPanel></div></Dialog>
    </div>;
}
