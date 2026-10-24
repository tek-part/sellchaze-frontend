import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { MdInbox, MdArrowDropDown } from 'react-icons/md';
import api from '../../../api/client';
import useStoreContext from '../../../hooks/useStoreContext';
import MerchantSettingsSave from '../../../components/store/MerchantSettingsSave';
import { IndexTable, useIndexTable } from '../../../components/data-table';
import { HiOutlinePlus, HiOutlineClipboardDocument, HiOutlineEye, HiOutlineEyeSlash, HiOutlinePencilSquare, HiOutlineTrash } from '../../../components/workspace/WorkspaceIcons';
import './merchant-webhooks.css';

const events = [{ value: 'orders', label: 'Orders' }, { value: 'order-status-update', label: 'Order Status Update' }];
const empty = { url: '', description: '', type: '', enabled: true, version: 1 };
const statusLabels = { queued: ['قيد الانتظار', 'Queued'], processing: ['جارٍ الإرسال', 'Sending'], retry: ['إعادة المحاولة', 'Retrying'], blocked: ['يتطلب شحن المحفظة', 'Wallet funding required'], sent: ['تم الإرسال', 'Sent'], skipped: ['توقف الإرسال', 'Skipped'], failed: ['فشل الإرسال', 'Failed'], expired: ['انتهت المهلة', 'Expired'] };
function failureText(failure, text) {
    if (failure.response?.status === 409) return text('تغير الإعداد أثناء التعديل. أعد تحميل البيانات قبل المحاولة مجددًا.', 'The configuration changed. Reload before trying again.');
    if (failure.response?.status === 422) return Object.values(failure.response.data?.errors ?? {}).flat().join(' ') || text('راجع الحقول المطلوبة ثم حاول مجددًا.', 'Check the required fields and try again.');
    return text('تعذر إكمال العملية. حاول مجددًا.', 'The operation could not be completed. Try again.');
}
function useCopy() {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar');
    return { ar, text: (a, e) => ar ? a : e };
}
const statusTones = { sent: 'is-success', failed: 'is-critical', expired: 'is-critical', blocked: 'is-warning', retry: 'is-warning', queued: 'is-info', processing: 'is-info' };
// The list endpoint pages by 20 and only understands `page`.
const LIST_DEFAULTS = { perPage: 20, perPageOptions: [20] };
const NO_FILTERS = [];
const NO_VIEWS = [];
function DeliveryStatus({ value, text }) {
    const label = statusLabels[value] ?? [value, value];
    return <span className="ws-webhook-status" data-status={value}>{text(...label)}</span>;
}
function DeliveryBadge({ value, text }) {
    const label = statusLabels[value] ?? [value, value];
    return <span className={`ws-dt-badge ${statusTones[value] ?? ''}`} data-status={value}>{text(...label)}</span>;
}

export default function StoreWebhooksPage() {
    const context = useStoreContext();
    const { webhookId } = useParams();
    return context.access.canStoreWebhooks ? <WebhookList key={context.apiBase} context={context} webhookId={webhookId} /> : <Navigate to={`${context.uiBase}/overview`} replace />;
}
function WebhookList({ context }) {
    const { apiBase, uiBase } = context;
    const { ar, text } = useCopy();
    const [retry, setRetry] = useState(0);
    const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
    const [actionError, setActionError] = useState('');
    const [deleting, setDeleting] = useState(null); const [busy, setBusy] = useState(false);
    const deletion = useRef(null);
    const columns = useMemo(() => [
        { key: 'url', header: 'url', primary: true, hideable: false, render: row => <Link className="ws-dt-title ws-webhook-url" to={`${uiBase}/settings/webhooks/${row.id}`} title={row.url}><bdi>{row.url}</bdi></Link> },
        { key: 'description', header: 'description', render: row => row.description || <span className="ws-dt-sub">—</span> },
        { key: 'type', header: 'type', render: row => events.find(event => event.value === row.type)?.label ?? row.type },
        { key: 'status', header: text('الحالة', 'Status'), render: row => <span className={`ws-dt-badge ${row.enabled ? 'is-success' : ''}`}>{row.enabled ? text('مفعل', 'Enabled') : text('غير مفعل', 'Disabled')}</span> },
        { key: 'delivery', header: text('آخر إرسال', 'Last delivery'), render: row => row.last_delivery ? <DeliveryBadge value={row.last_delivery.status} text={text} /> : <span className="ws-dt-sub">—</span> },
        { key: 'actions', header: text('الإجراءات', 'Actions'), hideable: false, align: 'end', render: row => <div className="ws-dt-row-actions">
            <Link className="ws-dt-icon" to={`${uiBase}/settings/webhooks/${row.id}`} aria-label={`${text('تعديل', 'Edit')} ${row.url}`} title={text('تعديل', 'Edit')}><HiOutlinePencilSquare aria-hidden /></Link>
            <button type="button" className="ws-dt-icon ws-webhook-delete" aria-label={`${text('حذف', 'Delete')} ${row.url}`} title={text('حذف', 'Delete')} onClick={() => { setDeleting(row); deletion.current?.showModal(); }}><HiOutlineTrash aria-hidden /></button>
        </div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase]);
    const table = useIndexTable({ scope: `store:${context.store?.id ?? apiBase}:webhooks`, filters: NO_FILTERS, columns, views: NO_VIEWS, defaults: LIST_DEFAULTS, savedViews: false });
    const page = table.state.page;
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        api.get(`${apiBase}/webhooks`, { params: { page }, signal: controller.signal }).then(response => { setData(response.data); setError(''); })
            .catch(failure => { if (!controller.signal.aborted) setError(failureText(failure, (a, e) => ar ? a : e)); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [apiBase, page, retry, ar]);
    const remove = async () => {
        setBusy(true); setActionError('');
        try {
            await api.delete(`${apiBase}/webhooks/${deleting.id}`, { data: { version: deleting.version } });
            deletion.current?.close(); setDeleting(null); table.setPage(1); setRetry(value => value + 1);
        } catch (failure) { setActionError(failureText(failure, text)); deletion.current?.close(); }
        finally { setBusy(false); }
    };
    const create = <Link className="ws-webhook-create" to={`${uiBase}/settings/webhooks/create`}><HiOutlinePlus aria-hidden />{text('إنشاء', 'Create')}</Link>;
    return <section className="ws-settings-card ws-webhooks-card" dir={ar ? 'rtl' : 'ltr'}>
        <header className="ws-webhook-list-heading"><div><h2>Webhooks</h2><p>{text('يمكنك من هنا اضافة Webhooks لمتجرك', 'Add Webhooks for your store here')}</p></div>{data?.data?.length ? create : null}</header>
        {actionError ? <div className="ws-webhook-error" role="alert">{actionError}<button type="button" onClick={() => { setActionError(''); setRetry(value => value + 1); }}>{text('إعادة تحميل', 'Reload')}</button></div> : null}
        <div className="ws-dt-card ws-webhook-list">
            <IndexTable table={table} rows={data?.data ?? []} loading={loading} error={error} onRetry={() => setRetry(value => value + 1)} meta={data?.meta}
                label="Webhooks"
                emptyState={{ icon: MdInbox, title: text('لا يوجد Webhooks حتي الان', 'No Webhooks yet'), description: text('هل ترغب فى اضافة واحد؟', 'Would you like to add one?'), action: create }} />
        </div>
        <dialog ref={deletion} className="ws-webhook-delete-dialog" aria-label={text('حذف Webhook', 'Delete Webhook')} onCancel={() => setDeleting(null)}><h3>{text('حذف Webhook', 'Delete Webhook')}</h3><p>{text('سيُوقف هذا الربط وإرسال أحداث جديدة إليه. الإرسال الذي بدأ بالفعل قد يكتمل.', 'This disables the webhook and future deliveries. A delivery already in progress may finish.')}</p><div><button type="button" disabled={busy} onClick={() => { deletion.current?.close(); setDeleting(null); }}>{text('إلغاء', 'Cancel')}</button><button type="button" disabled={busy || !deleting} onClick={remove}>{text('حذف', 'Delete')}</button></div></dialog>
    </section>;
}

export function StoreWebhookEditorPage() {
    const context = useStoreContext(); const { webhookId } = useParams();
    return context.access.canStoreWebhooks ? <WebhookEditor key={`${context.apiBase}:${webhookId ?? 'create'}`} context={context} webhookId={webhookId} /> : <Navigate to={`${context.uiBase}/overview`} replace />;
}
function WebhookEditor({ context, webhookId }) {
    const { ar, text } = useCopy(); const navigate = useNavigate();
    const [draft, setDraft] = useState(webhookId ? null : empty); const [initial, setInitial] = useState(webhookId ? null : empty);
    const [requestKey] = useState(() => crypto.randomUUID()); const [savedId, setSavedId] = useState(webhookId);
    const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
    const [secret, setSecret] = useState(''); const [revealed, setRevealed] = useState(false); const [copied, setCopied] = useState(false);
    const [deliveries, setDeliveries] = useState([]); const [saved, setSaved] = useState(false);
    useEffect(() => {
        if (!webhookId) return;
        const controller = new AbortController();
        api.get(`${context.apiBase}/webhooks/${webhookId}`, { signal: controller.signal }).then(response => { setDraft(response.data.data); setInitial(response.data.data); setDeliveries(response.data.deliveries ?? []); setError(''); })
            .catch(failure => { if (!controller.signal.aborted) setError(failureText(failure, (a, e) => ar ? a : e)); });
        return () => controller.abort();
    }, [context.apiBase, webhookId, retry, ar]);
    const change = patch => { setDraft(value => ({ ...value, ...patch })); setSaved(false); };
    let valid = false;
    try { const url = new URL(draft?.url); valid = url.protocol === 'https:' && !url.username && !url.password && !url.hash && Boolean(draft?.type); } catch { /* Incomplete URL while typing. */ }
    const dirty = !savedId || ['url', 'description', 'type', 'enabled'].some(key => (draft?.[key] ?? '') !== (initial?.[key] ?? ''));
    const save = async event => {
        event.preventDefault(); if (!valid || !dirty || busy) return;
        setBusy(true); setError('');
        const body = { url: draft.url, description: draft.description || null, type: draft.type, enabled: draft.enabled, ...(savedId ? { version: initial.version } : { request_key: requestKey }) };
        try {
            const response = savedId ? await api.put(`${context.apiBase}/webhooks/${savedId}`, body) : await api.post(`${context.apiBase}/webhooks`, body);
            setDraft(response.data.data); setInitial(response.data.data); setSavedId(response.data.data.id); setSaved(true);
            if (response.data.secret) setSecret(response.data.secret);
        } catch (failure) { setError(failureText(failure, text)); }
        finally { setBusy(false); }
    };
    return <section className="ws-settings-card ws-webhooks-card" dir={ar ? 'rtl' : 'ltr'}>
        {error ? <div className="ws-webhook-error" role="alert">{error}{webhookId ? <button type="button" onClick={() => { setRetry(value => value + 1); }}>{text('إعادة تحميل', 'Reload')}</button> : null}</div> : null}
        {!draft && !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {draft ? <form className="ws-webhook-form" onSubmit={save}><fieldset disabled={busy} className="ws-webhook-fields">
            <h2>{savedId ? text('تعديل Webhook', 'Edit Webhook') : text('انشاء Webhook', 'Create Webhook')}</h2>
            <label className={`ws-webhook-field${draft.url ? ' is-filled' : ''}`}><span>url *</span><input name="url" aria-label="url" value={draft.url} maxLength={2048} required type="url" onChange={event => change({ url: event.target.value })} autoComplete="off" spellCheck={false} /></label>
            <label className={`ws-webhook-field ws-webhook-description${draft.description ? ' is-filled' : ''}`}><span>description</span><textarea name="description" aria-label="description" value={draft.description || ''} maxLength={200} rows={2} onChange={event => change({ description: event.target.value })} /></label>
            <Listbox value={draft.type} onChange={type => change({ type })} disabled={busy}><div className={`ws-webhook-field ws-webhook-type${draft.type ? ' is-filled' : ''}`}><span>type *</span><ListboxButton role="combobox" aria-label="type"><span>{events.find(event => event.value === draft.type)?.label || ''}</span><MdArrowDropDown aria-hidden /></ListboxButton><ListboxOptions anchor="bottom start" className="ws-webhook-options">{events.map(event => <ListboxOption key={event.value} value={event.value}>{event.label}</ListboxOption>)}</ListboxOptions></div></Listbox>
            <label className="ws-webhook-switch"><input type="checkbox" role="switch" checked={draft.enabled} onChange={event => change({ enabled: event.target.checked })} /><span>{text('مفعل', 'Enabled')}</span></label>
        </fieldset><MerchantSettingsSave ar={ar} busy={busy} disabled={busy || !valid || !dirty} /></form> : null}
        {saved ? <p className="ws-webhook-saved" role="status">{text('تم حفظ Webhook.', 'Webhook saved.')}</p> : null}
        {secret ? <section className="ws-webhook-secret" aria-label={text('مفتاح التحقق', 'Verification secret')}><h3>{text('مفتاح تحقق Webhook', 'Webhook verification secret')}</h3><p>{text('انسخ المفتاح واحفظه لدى جهة الاستقبال للتحقق من ترويسة secret. لن يظهر في صفحة القائمة أو بعد إعادة تحميل الصفحة.', 'Copy this key to your receiver to verify the secret header. It is not shown in the list or after reloading this page.')}</p><div><input type={revealed ? 'text' : 'password'} value={secret} readOnly aria-label={text('مفتاح تحقق Webhook', 'Webhook verification secret')} /><button type="button" aria-label={text(revealed ? 'إخفاء المفتاح' : 'إظهار المفتاح', revealed ? 'Hide secret' : 'Show secret')} onClick={() => setRevealed(!revealed)}>{revealed ? <HiOutlineEyeSlash aria-hidden /> : <HiOutlineEye aria-hidden />}</button><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(secret); setCopied(true); } catch { setError(text('تعذر النسخ. أظهر المفتاح وانسخه يدويًا.', 'Copy failed. Reveal the key and copy it manually.')); } }}><HiOutlineClipboardDocument aria-hidden />{copied ? text('تم النسخ', 'Copied') : text('نسخ', 'Copy')}</button></div></section> : null}
        {savedId ? <div className="ws-webhook-editor-actions"><button type="button" onClick={() => navigate(`${context.uiBase}/settings/webhooks/${savedId}`)}>{text('عرض سجل الإرسال', 'View delivery history')}</button><Link to={`${context.uiBase}/settings/webhooks`}>{text('العودة إلى Webhooks', 'Back to Webhooks')}</Link></div> : null}
        {deliveries.length ? <section className="ws-webhook-history"><h3>{text('آخر عمليات الإرسال', 'Recent deliveries')}</h3><div className="ws-webhook-table-wrap"><table><thead><tr><th>{text('الحدث', 'Event')}</th><th>{text('الحالة', 'Status')}</th><th>{text('المحاولات', 'Attempts')}</th><th>HTTP</th><th>{text('الوقت', 'Time')}</th></tr></thead><tbody>{deliveries.map(row => <tr key={row.id}><td>{row.event_key}</td><td><DeliveryStatus value={row.status} text={text} /></td><td>{row.attempts}</td><td>{row.http_status || '—'}</td><td>{new Date(row.created_at).toLocaleString(ar ? 'ar-EG' : 'en-GB')}</td></tr>)}</tbody></table></div></section> : null}
    </section>;
}
