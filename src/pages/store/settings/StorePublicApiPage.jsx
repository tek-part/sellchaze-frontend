import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdInbox, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import api from '../../../api/client';
import useStoreContext from '../../../hooks/useStoreContext';
import MerchantSettingsSave from '../../../components/store/MerchantSettingsSave';
import { HiOutlinePlus, HiOutlineClipboardDocument, HiOutlineEye, HiOutlineEyeSlash } from '../../../components/workspace/WorkspaceIcons';
import './merchant-webhooks.css';
import './merchant-public-api.css';

const permissions = [
    ['products:read', 'الوصول الي المنتجات', 'Read products'], ['products:create', 'انشاء منتجات', 'Create products'],
    ['products:update', 'تعديل منتجات', 'Update products'], ['products:delete', 'حذف منتجات', 'Delete products'],
    ['orders:read', 'الوصول الي الطلبات', 'Read orders'], ['orders:update', 'تعديل طلبات', 'Update orders'], ['orders:delete', 'حذف طلبات', 'Delete orders'],
    ['categories:read', 'الوصول الي الاقسام', 'Read categories'], ['categories:create', 'انشاء اقسام', 'Create categories'],
    ['categories:update', 'تعديل اقسام', 'Update categories'], ['categories:delete', 'حذف اقسام', 'Delete categories'], ['shipping_areas', 'مناطق الشحن', 'Shipping areas'],
];
const empty = { description: '', permissions: [], enabled: true, version: 1 };
function useCopy() { const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); return { ar, text: (a, e) => ar ? a : e }; }
function errorText(failure, text) {
    if (failure.response?.status === 409) return text('تغير المفتاح أثناء التعديل. أعد تحميل البيانات قبل المحاولة مجددًا.', 'The key changed. Reload before trying again.');
    if (failure.response?.status === 422) return Object.values(failure.response.data?.errors ?? {}).flat().join(' ') || text('راجع الحقول ثم حاول مجددًا.', 'Check the fields and try again.');
    return text('تعذر إكمال العملية. حاول مجددًا.', 'The operation could not be completed. Try again.');
}

export default function StorePublicApiPage() {
    const context = useStoreContext();
    return context.access.canStorePublicApi ? <KeyList key={context.apiBase} context={context} /> : <Navigate to={`${context.uiBase}/overview`} replace />;
}
function KeyList({ context }) {
    const { ar, text } = useCopy();
    const [page, setPage] = useState(1); const [retry, setRetry] = useState(0); const [data, setData] = useState(null);
    const [error, setError] = useState(''); const [deleting, setDeleting] = useState(null); const [busy, setBusy] = useState(false); const dialog = useRef(null);
    useEffect(() => {
        const controller = new AbortController();
        api.get(`${context.apiBase}/public-api`, { params: { page }, signal: controller.signal }).then(response => { setData(response.data); setError(''); })
            .catch(failure => { if (!controller.signal.aborted) setError(errorText(failure, (a, e) => ar ? a : e)); });
        return () => controller.abort();
    }, [context.apiBase, page, retry, ar]);
    const remove = async () => {
        setBusy(true);
        try { await api.delete(`${context.apiBase}/public-api/${deleting.id}`, { data: { version: deleting.version } }); dialog.current.close(); setDeleting(null); setPage(1); setRetry(value => value + 1); }
        catch (failure) { dialog.current.close(); setDeleting(null); setError(errorText(failure, text)); }
        finally { setBusy(false); }
    };
    return <section className="ws-settings-card ws-webhooks-card ws-public-api-card" dir={ar ? 'rtl' : 'ltr'}>
        <div className="ws-api-list-heading"><div><h2>Public API</h2><p>{text('ال Public API يمكنك من التحكم برمجيا في المتجر الخاص بك واضافة ميزات خاصة بك', 'Use Public API to manage your store programmatically and build your own features.')}</p></div>
            {data?.data?.length ? <Link className="ws-webhook-create" to={`${context.uiBase}/settings/public-api/create`}><HiOutlinePlus aria-hidden />{text('إنشاء', 'Create')}</Link> : null}</div>
        <div className="ws-api-doc-alert">{text('لمعرفة كيفية استخدام ال Public API اذهب الي', 'Learn how to use Public API:')} <Link to={`${context.uiBase}/settings/public-api/docs`}>{text('وثائق Public API', 'Public API documentation')}</Link></div>
        {error ? <div className="ws-webhook-error" role="alert">{error}<button type="button" onClick={() => setRetry(value => value + 1)}>{text('إعادة المحاولة', 'Retry')}</button></div> : null}
        {!data && !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {data?.data?.length === 0 ? <div className="ws-webhook-empty ws-api-empty"><MdInbox aria-hidden /><h3>{text('لا يوجد Public API حتي الان', 'No Public API yet')}</h3><p>{text('هل ترغب فى اضافة واحد؟', 'Would you like to add one?')}</p><Link className="ws-webhook-create" to={`${context.uiBase}/settings/public-api/create`}><HiOutlinePlus aria-hidden />{text('إنشاء', 'Create')}</Link></div> : null}
        {data?.data?.length ? <><div className="ws-webhook-table-wrap"><table><thead><tr><th>{text('الوصف', 'Description')}</th><th>{text('الصلاحيات', 'Permissions')}</th><th>{text('الحالة', 'Status')}</th><th>{text('آخر استخدام', 'Last used')}</th><th>{text('إجراءات', 'Actions')}</th></tr></thead><tbody>{data.data.map(row => <tr key={row.id}><td><Link to={`${context.uiBase}/settings/public-api/${row.id}`}>{row.description || text('بدون وصف', 'No description')}</Link><small className="ws-api-prefix" dir="ltr">{row.token_prefix}…</small></td><td>{row.permissions.map(value => <span key={value} className="ws-api-permission-tag">{permissions.find(permission => permission[0] === value)?.[ar ? 1 : 2] || value}</span>)}</td><td>{row.enabled ? text('مفعل', 'Enabled') : text('غير مفعل', 'Disabled')}</td><td>{row.last_used_at ? new Date(row.last_used_at).toLocaleString(ar ? 'ar-EG' : 'en-GB') : '—'}</td><td><Link to={`${context.uiBase}/settings/public-api/${row.id}`}>{text('تعديل', 'Edit')}</Link><button type="button" onClick={() => { setDeleting(row); dialog.current.showModal(); }}>{text('حذف', 'Delete')}</button></td></tr>)}</tbody></table></div>
            <div className="ws-webhook-pagination"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>{text('السابق', 'Previous')}</button><span>{page} / {data.meta.last_page}</span><button type="button" disabled={page >= data.meta.last_page} onClick={() => setPage(page + 1)}>{text('التالي', 'Next')}</button></div></> : null}
        <dialog ref={dialog} className="ws-webhook-dialog" aria-labelledby="api-delete-title" onCancel={event => { if (busy) event.preventDefault(); }}><h3 id="api-delete-title">{text('حذف مفتاح Public API؟', 'Delete Public API key?')}</h3><p>{text('ستتوقف الطلبات الجديدة باستخدام هذا المفتاح.', 'New requests using this key will stop working.')}</p><div><button type="button" disabled={busy} onClick={() => { dialog.current.close(); setDeleting(null); }}>{text('إلغاء', 'Cancel')}</button><button type="button" disabled={busy} onClick={remove}>{text('حذف', 'Delete')}</button></div></dialog>
    </section>;
}

export function StorePublicApiEditorPage() {
    const context = useStoreContext(); const { keyId } = useParams();
    return context.access.canStorePublicApi ? <KeyEditor key={`${context.apiBase}:${keyId || 'create'}`} context={context} keyId={keyId} /> : <Navigate to={`${context.uiBase}/overview`} replace />;
}
function KeyEditor({ context, keyId }) {
    const { ar, text } = useCopy(); const requestKey = useRef(crypto.randomUUID()).current;
    const [draft, setDraft] = useState(keyId ? null : empty); const [initial, setInitial] = useState(keyId ? null : empty);
    const [savedId, setSavedId] = useState(keyId); const [secret, setSecret] = useState(''); const [revealed, setRevealed] = useState(false); const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [retry, setRetry] = useState(0); const [receiptExpired, setReceiptExpired] = useState(false);
    useEffect(() => {
        if (!keyId) return;
        const controller = new AbortController();
        api.get(`${context.apiBase}/public-api/${keyId}`, { signal: controller.signal }).then(response => { setDraft(response.data.data); setInitial(response.data.data); setError(''); })
            .catch(failure => { if (!controller.signal.aborted) setError(errorText(failure, (a, e) => ar ? a : e)); });
        return () => controller.abort();
    }, [context.apiBase, keyId, retry, ar]);
    const change = changes => { setDraft(value => ({ ...value, ...changes })); setSaved(false); };
    const dirty = draft && initial && (draft.description !== initial.description || draft.enabled !== initial.enabled || [...draft.permissions].sort().join(',') !== [...initial.permissions].sort().join(','));
    const save = async event => {
        event.preventDefault(); if (busy || (!dirty && savedId)) return;
        setBusy(true); setError(''); setSaved(false);
        const body = { description: draft.description || '', permissions: draft.permissions, enabled: draft.enabled, ...(savedId ? { version: initial.version } : { request_key: requestKey }) };
        try {
            const response = savedId ? await api.put(`${context.apiBase}/public-api/${savedId}`, body) : await api.post(`${context.apiBase}/public-api`, body);
            setDraft(response.data.data); setInitial(response.data.data); setSavedId(response.data.data.id); setSaved(true);
            if (response.data.secret) setSecret(response.data.secret);
            if (!savedId && response.data.secret === null) setReceiptExpired(true);
        } catch (failure) { setError(errorText(failure, text)); }
        finally { setBusy(false); }
    };
    return <section className="ws-settings-card ws-webhooks-card ws-public-api-card" dir={ar ? 'rtl' : 'ltr'}>
        {error ? <div className="ws-webhook-error" role="alert">{error}{keyId ? <button type="button" onClick={() => setRetry(value => value + 1)}>{text('إعادة تحميل', 'Reload')}</button> : null}</div> : null}
        {!draft && !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {draft ? <form className="ws-webhook-form ws-api-form" onSubmit={save}><fieldset disabled={busy} className="ws-api-fields">
            <label className={`ws-webhook-field ws-webhook-description ws-api-description${draft.description ? ' is-filled' : ''}`}><span>description</span><textarea aria-label="description" name="description" rows={2} maxLength={200} value={draft.description || ''} onChange={event => change({ description: event.target.value })} /></label>
            <fieldset className="ws-api-permissions"><legend>{text('الصلاحيات', 'Permissions')}</legend>{permissions.map(([value, a, e]) => <label key={value}><span className="ws-api-checkbox"><input type="checkbox" checked={draft.permissions.includes(value)} onChange={event => change({ permissions: event.target.checked ? [...draft.permissions, value] : draft.permissions.filter(permission => permission !== value) })} />{draft.permissions.includes(value) ? <MdCheckBox aria-hidden /> : <MdCheckBoxOutlineBlank aria-hidden />}</span><span>{text(a, e)}</span></label>)}</fieldset>
            <label className="ws-webhook-switch"><input type="checkbox" role="switch" checked={draft.enabled} onChange={event => change({ enabled: event.target.checked })} /><span>{text('مفعل', 'Enabled')}</span></label>
        </fieldset><MerchantSettingsSave ar={ar} busy={busy} disabled={busy || !dirty} /></form> : null}
        {saved ? <p className="ws-webhook-saved" role="status">{text('تم حفظ Public API.', 'Public API saved.')}</p> : null}
        {receiptExpired ? <p role="status">{text('تم استرجاع الإعداد المحفوظ، لكن انتهت مهلة عرض المفتاح. إذا لم تحفظ قيمته، احذف هذا المفتاح وأنشئ واحدًا جديدًا.', 'The saved configuration was recovered, but the key display period expired. If you did not save its value, delete this key and create a new one.')}</p> : null}
        {secret ? <section className="ws-webhook-secret" aria-label={text('مفتاح Public API', 'Public API key')}><h3>{text('مفتاح Public API', 'Public API key')}</h3><p>{text('انسخ المفتاح واحفظه في تطبيقك. لن يظهر بعد إعادة تحميل الصفحة. استخدم ترويسة Api-Key في طلبات الربط.', 'Copy the key to your application. It is not displayed after reloading this page. Use the Api-Key request header.')}</p><div><input type={revealed ? 'text' : 'password'} value={secret} readOnly aria-label={text('مفتاح Public API', 'Public API key')} /><button type="button" aria-label={text(revealed ? 'إخفاء المفتاح' : 'إظهار المفتاح', revealed ? 'Hide key' : 'Show key')} onClick={() => setRevealed(!revealed)}>{revealed ? <HiOutlineEyeSlash aria-hidden /> : <HiOutlineEye aria-hidden />}</button><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(secret); setCopied(true); } catch { setError(text('تعذر النسخ. أظهر المفتاح وانسخه يدويًا.', 'Copy failed. Reveal the key and copy it manually.')); } }}><HiOutlineClipboardDocument aria-hidden />{copied ? text('تم النسخ', 'Copied') : text('نسخ', 'Copy')}</button></div></section> : null}
        {savedId ? <div className="ws-webhook-editor-actions"><Link to={`${context.uiBase}/settings/public-api/${savedId}`}>{text('عرض الإعدادات المحفوظة', 'View saved settings')}</Link><Link to={`${context.uiBase}/settings/public-api`}>{text('العودة إلى Public API', 'Back to Public API')}</Link></div> : null}
    </section>;
}

export function StorePublicApiDocsPage() {
    const context = useStoreContext(); const { ar, text } = useCopy();
    if (!context.access.canStorePublicApi) return <Navigate to={`${context.uiBase}/overview`} replace />;
    const endpoints = [
        ['GET', '/products', 'products:read'], ['POST', '/products', 'products:create'], ['GET', '/products/{id}', 'products:read'], ['PATCH', '/products/{id}', 'products:update'], ['DELETE', '/products/{id}', 'products:delete'],
        ['GET', '/categories', 'categories:read'], ['POST', '/categories', 'categories:create'], ['GET', '/categories/{id}', 'categories:read'], ['PATCH', '/categories/{id}', 'categories:update'], ['DELETE', '/categories/{id}', 'categories:delete'],
        ['GET', '/orders', 'orders:read'], ['GET', '/orders/{id}', 'orders:read'], ['GET', '/orders/short-id/{order_number}', 'orders:read'], ['PATCH', '/orders/{id}/status', 'orders:update'], ['POST', '/orders/{id}/notes', 'orders:update'], ['DELETE', '/orders/{id}', 'orders:delete'],
        ['GET / PUT', '/shipping-areas', 'shipping_areas'], ['DELETE', '/webhooks/delete-by-url?url=HTTPS_URL', 'orders:delete'],
    ];
    return <section className="ws-settings-card ws-api-docs" dir={ar ? 'rtl' : 'ltr'}><h2>{text('وثائق Public API', 'Public API documentation')}</h2><p>{text('أنشئ مفتاحًا من إعدادات متجرك، وحدد الصلاحيات التي يحتاجها تطبيقك. كل مفتاح يعمل داخل متجره فقط.', 'Create a key in your store settings and select the permissions your application needs. Each key accesses only its own store.')}</p>
        <h3>{text('الاتصال والمصادقة', 'Connection and authentication')}</h3><pre dir="ltr">https://api.sellchaze.com/api/v1/external-apps{ '\n' }Api-Key: YOUR_API_KEY</pre><p>{text('يمكن استخدام Authorization: Bearer بدلًا من Api-Key. الحد 40 طلبًا لكل مفتاح في الدقيقة؛ يعيد تجاوز الحد حالة 429 وترويسة Retry-After.', 'Authorization: Bearer is also supported. Each key allows 40 requests per minute; excess requests return HTTP 429 with Retry-After.')}</p>
        <div className="ws-webhook-table-wrap"><table><thead><tr><th>{text('الطريقة', 'Method')}</th><th>{text('المسار', 'Path')}</th><th>{text('الصلاحية', 'Permission')}</th></tr></thead><tbody>{endpoints.map(([method, path, permission]) => <tr key={`${method}:${path}`}><td dir="ltr">{method}</td><td dir="ltr"><code>{path}</code></td><td dir="ltr"><code>{permission}</code></td></tr>)}</tbody></table></div>
        <h3>{text('المنتجات والأقسام', 'Products and categories')}</h3><p>{text('تستخدم المسارات نفس حقول كتالوج Sellchaze: name وslug وdescription وprice وcategory_id وstock_quantity وis_active للمنتجات؛ وname وslug وdescription وparent_id وis_active للأقسام. الأرقام هي معرّفات السجلات داخل متجرك. الصور تُرفع بصيغة multipart/form-data.', 'Routes use the Sellchaze catalog fields: name, slug, description, price, category_id, stock_quantity and is_active for products; name, slug, description, parent_id and is_active for categories. IDs are the numeric record IDs in your store. Upload images as multipart/form-data.')}</p>
        <h3>{text('التصفح والطلبات', 'Pagination and orders')}</h3><p>{text('تدعم القوائم page وper_page حتى 100 عنصر، وsearch. تعيد النتائج data وmeta. تحديث حالة الطلب يستخدم status وnote اختياريًا؛ إضافة الملاحظات تستخدم note. الحذف يؤرشف الطلب ويحافظ على سجلات الدفع والرسوم. الطلبات المحجوبة بسبب مديونية المحفظة تظل محجوبة عبر API.', 'Lists support page, per_page up to 100, and search, returning data and meta. Status updates accept status and optional note; note creation accepts note. Deletion archives orders and preserves payment and fee records. Wallet debt restrictions also apply to API order access.')}</p>
        <pre dir="ltr">{'curl -H "Api-Key: YOUR_API_KEY" \\\n  "https://api.sellchaze.com/api/v1/external-apps/products?page=1&per_page=20"'}</pre>
        <h3>{text('الشحن وWebhooks', 'Shipping and Webhooks')}</h3><p>{text('GET للشحن يعيد الإعدادات الحالية؛ PUT يحفظ نفس حقول صفحة الشحن مع version وregions وoptions. حذف Webhooks بالعنوان يوقف الوجهات المطابقة في متجر المفتاح فقط. تعطيل المفتاح أو حذفه يمنع الطلبات الجديدة؛ طلب بدأ بالفعل قد ينتهي.', 'GET shipping returns the current configuration; PUT saves the shipping settings fields including version, regions and options. Delete Webhooks by URL disables matching destinations only in the key’s store. Disabling or deleting a key stops new requests; an in-flight request may finish.')}</p><Link to={`${context.uiBase}/settings/public-api`}>{text('العودة إلى Public API', 'Back to Public API')}</Link>
    </section>;
}
