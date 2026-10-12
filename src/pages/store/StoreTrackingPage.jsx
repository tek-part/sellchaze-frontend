import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import api from '../../api/client';
import useStoreContext from '../../hooks/useStoreContext';
import { useDirty } from '../../hooks/useStoreSettings';
import { HiOutlineInformationCircle, HiOutlinePlayCircle, HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineXMark } from '../../components/workspace/WorkspaceIcons';
import './store-tracking.css';

const providers = ['facebook', 'tiktok', 'snapchat'];
const providerName = { facebook: 'Facebook', tiktok: 'TikTok', snapchat: 'Snapchat' };
const lines = (value) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

function Notice({ title, children }) { return <div className="ws-tracking-notice"><HiOutlineInformationCircle aria-hidden="true" /><div><strong>{title}</strong>{children ? <p>{children}</p> : null}</div></div>; }
function Header({ title, subtitle, help }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar');
    return <header className="ws-tracking-heading"><div><h1>{title}</h1><p>{subtitle}</p></div><a href={help} target="_blank" rel="noopener noreferrer"><HiOutlinePlayCircle aria-hidden="true" />{ar ? 'كيفية الربط' : 'Setup guide'}</a></header>;
}

export default function StoreTrackingPage({ mode = 'pixels' }) {
    const context = useStoreContext();
    return <TrackingEditor key={`${context.apiBase}:${mode}`} context={context} mode={mode} />;
}

function TrackingEditor({ context: { apiBase, uiBase, access, unifiedStoreNavigation }, mode }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [settings, setSettings] = useState(null); const [draft, setDraft] = useState({ facebook: '', tiktok: '', snapchat: '', google: '' });
    const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false);
    const [reload, setReload] = useState(0); const [modal, setModal] = useState(null); const [remove, setRemove] = useState(null);
    const [conflict, setConflict] = useState(false); const working = useRef(false);
    const endpoint = `${apiBase}/tracking/${mode === 'google' ? 'google-tag' : mode}`;
    const current = mode === 'google' ? { google: lines(draft.google) } : Object.fromEntries(providers.map((p) => [p, lines(draft[p])]));
    const initial = settings ? Object.fromEntries(Object.keys(current).map((p) => [p, settings[p] || []])) : null;
    const dirty = useDirty(initial, settings ? current : null);
    function apply(next) {
        setSettings(next); setDraft(Object.fromEntries([...providers, 'google'].map((p) => [p, (next[p] || []).join('\n')])));
    }
    useEffect(() => {
        let active = true;
        if (!access.canStoreSettings) return;
        api.get(endpoint).then(({ data }) => { if (active) { apply(data.data); setError(''); setConflict(false); } })
            .catch((failure) => { if (active) setError(errorText(failure)); });
        return () => { active = false; };
    }, [endpoint, access.canStoreSettings, reload]);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;

    async function mutate(operation) {
        if (working.current || !settings) return;
        working.current = true; setBusy(true); setError(''); setSaved(false); setConflict(false);
        try { const { data } = await operation(); apply(data.data); setSaved(true); setModal(null); setRemove(null); }
        catch (failure) { setError(errorText(failure)); setConflict(failure.response?.status === 409); }
        finally { working.current = false; setBusy(false); }
    }
    const titles = mode === 'conversions' ? ['Conversion api', 'Conversion API'] : mode === 'google' ? ['اعدادات جوجل تاج', 'Google tag settings'] : ['اعدادات البيكسلز', 'Pixel settings'];
    const subtitles = mode === 'conversions' ? ['أرسل أحداث متجرك إلى منصات الإعلانات عبر السيرفر.', 'Send store events to advertising platforms through the server.'] : mode === 'google' ? ['يمكنك ربط جوجل تاج من هنا', 'Connect your Google tag here'] : ['يمكنك ربط فيسبوك وتيك توك وسناب شات بيكسل من هنا', 'Connect Facebook, TikTok and Snapchat pixels here'];
    const help = mode === 'google' ? 'https://developers.google.com/tag-platform/gtagjs' : mode === 'conversions' ? 'https://developers.snap.com/marketing-api/Conversions-API/Introduction' : 'https://developers.facebook.com/docs/meta-pixel/';
    return <div className={`ws-tracking is-${mode} ${unifiedStoreNavigation ? 'is-unified' : ''}`} dir={ar ? 'rtl' : 'ltr'}><Header title={text(...titles)} subtitle={text(...subtitles)} help={help} />
        {error ? <div className="ws-tracking-error" role="alert"><p>{error}</p>{conflict || !settings ? <button type="button" onClick={() => { setSettings(null); setReload((n) => n + 1); }}>{text('إعادة تحميل الإعدادات', 'Reload settings')}</button> : null}</div> : null}
        {saved ? <p className="ws-tracking-saved" role="status">{text('تم حفظ الإعدادات', 'Settings saved')}</p> : null}
        {!settings ? <p role="status">{text('جارٍ تحميل الإعدادات…', 'Loading settings…')}</p> : mode === 'conversions' ? <>
            <div className="ws-tracking-conversion-notices"><Notice title={text('أكمل إعداد البيكسل والتوكن في حساب منصة الإعلانات قبل إضافته.', 'Complete pixel and token setup in your advertising account before adding it.')} /><Notice title={text('استخدم معرف الحدث نفسه عند الجمع بين البيكسل وConversion API حتى لا يتكرر الشراء.', 'Use the same event ID for browser pixels and Conversion API to avoid duplicate purchases.')} /></div>
            <button type="button" className="ws-primary-button ws-tracking-add" onClick={() => { setSaved(false); setModal({ provider: '', pixel_id: '', token: '', note: '', enabled: true }); }}><HiOutlinePlus aria-hidden="true" />{text('اضافة بيكسل جديد', 'Add a new pixel')}</button>
            {settings.rows.length ? <div className="ws-tracking-rows">{settings.rows.map((row) => <article key={row.id}><div><h2>{providerName[row.provider]}</h2><code dir="ltr">{row.pixel_id}</code>{row.note ? <p>{row.note}</p> : null}<p>{row.enabled ? text('مفعّل', 'Enabled') : text('متوقف', 'Disabled')}{row.last_delivery ? ` · ${text('آخر إرسال', 'Last delivery')}: ${text({ delivered: 'تم الإرسال', pending: 'بانتظار الإرسال', sending: 'جارٍ الإرسال', retry: 'إعادة المحاولة', failed: 'تعذر الإرسال', cancelled: 'ملغى' }[row.last_delivery.status] || row.last_delivery.status, row.last_delivery.status)}` : ''}</p>{row.last_delivery?.error_code ? <p className="ws-note">{row.last_delivery.error_code}</p> : null}</div><div className="ws-tracking-row-actions"><button type="button" aria-label={`${text('تعديل', 'Edit')} ${providerName[row.provider]} ${row.pixel_id}`} onClick={() => { setSaved(false); setModal({ ...row, token: '' }); }}><HiOutlinePencilSquare aria-hidden="true" /></button><button type="button" aria-label={`${text('حذف', 'Delete')} ${providerName[row.provider]} ${row.pixel_id}`} onClick={() => setRemove(row)}><HiOutlineTrash aria-hidden="true" /></button></div></article>)}</div> : <div className="ws-tracking-empty"><h2>{text('لا يوجد بيكسل مضاف', 'No pixel added')}</h2></div>}
        </> : <form onSubmit={(event) => { event.preventDefault(); void mutate(() => api.put(endpoint, { version: settings.version, ...current })); }}>
            <div className="ws-tracking-form-body">{mode === 'pixels' ? <><h2 className="ws-tracking-important">{text('مهم جداً يجب عليك قراءته', 'Please read before connecting')}</h2><Notice title={text('لا تربط صفحة شكراً لك أو الأزرار بأحداث Event Builder.', 'Do not attach Event Builder events to the thank-you page or buttons.')}>{text('يرسل المتجر أحداث الزيارة والمنتج والسلة وبدء الشراء والطلب تلقائياً. إضافة أحداث يدوية لنفس الإجراءات قد تسبب عدّ الطلب أكثر من مرة.', 'The store sends page, product, cart, checkout and order events automatically. Adding manual events for the same actions can count an order more than once.')}</Notice><Notice title={text('أضف المعرّفات فقط، وليس كود البيكسل الكامل.', 'Enter identifiers only, not the full pixel code.')}>{text('انسخ Pixel ID من حساب منصة الإعلانات، وأضف كل معرّف في سطر مستقل.', 'Copy the Pixel ID from your advertising account and place each identifier on its own line.')}</Notice></> : <h2>{text('أضف معرف جوجل تاج فقط مثل G-Y1F28T2SY8، وليس الكود الكامل.', 'Enter the Google tag identifier, such as G-Y1F28T2SY8, not the full code.')}</h2>}
                {(mode === 'google' ? ['google'] : providers).map((provider) => {
                    const label = provider === 'google' ? text('اضف التاج فقط مثل G-Y1F28T2SY8 وليس الكود كامل', 'Enter only the tag ID, such as G-Y1F28T2SY8') : text(`وضع id (المعرف) الخاص بـ ${providerName[provider]} بيكسل`, `Enter your ${providerName[provider]} Pixel ID`);
                    return <section className="ws-tracking-provider" key={provider}>{mode === 'pixels' ? <h2>{text('تستطيع اضافة اكثر من بيكسل كل معرف (ID) بيكسل في سطر', 'Add multiple pixels, with each Pixel ID on its own line')}</h2> : null}<h2>{provider === 'google' ? 'GA tag' : provider}</h2><div className={`ws-tracking-field ${draft[provider] ? 'has-value' : ''}`}><label htmlFor={`tracking-${provider}`}>{label}</label><textarea id={`tracking-${provider}`} value={draft[provider]} rows={4} spellCheck={false} autoComplete="off" onChange={(event) => { setSaved(false); setDraft((old) => ({ ...old, [provider]: event.target.value })); }} /></div></section>;
                })}
            </div><div className="ws-tracking-toolbar" role="toolbar" aria-label={text('حفظ الإعدادات', 'Save settings')}><button type="submit" disabled={!dirty || busy}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button></div>
        </form>}
        <Dialog open={!!modal} onClose={() => { if (!busy) setModal(null); }} className="ws-tracking-dialog"><DialogBackdrop className="ws-tracking-backdrop" /><div className="ws-tracking-dialog-position"><DialogPanel className="ws-tracking-dialog-panel" dir={ar ? 'rtl' : 'ltr'}><DialogTitle>{text(modal?.id ? 'تعديل البيكسل' : 'اضافة بيكسل جديد', modal?.id ? 'Edit pixel' : 'Add a new pixel')}</DialogTitle><button type="button" className="ws-tracking-close" aria-label={text('إغلاق', 'Close')} disabled={busy} onClick={() => setModal(null)}><HiOutlineXMark aria-hidden="true" /></button>{modal ? <form onSubmit={(event) => { event.preventDefault(); void mutate(() => modal.id ? api.put(`${endpoint}/${modal.id}`, { version: settings.version, provider: modal.provider, pixel_id: modal.pixel_id.trim(), token: modal.token.trim(), note: modal.note, enabled: modal.enabled }) : api.post(endpoint, { version: settings.version, provider: modal.provider, pixel_id: modal.pixel_id.trim(), token: modal.token.trim(), note: modal.note, enabled: modal.enabled })); }}>
            {error ? <p role="alert">{error}</p> : null}<label>{text('نوع البيكسل', 'Pixel type')}<select required value={modal.provider} disabled={busy} onChange={(event) => setModal((old) => ({ ...old, provider: event.target.value }))}><option value="">{text('اختر نوع البيكسل', 'Choose pixel type')}</option>{providers.map((p) => <option key={p} value={p}>{providerName[p]}</option>)}</select></label><label>Pixel id<input required maxLength={64} spellCheck={false} autoComplete="off" dir="ltr" value={modal.pixel_id} disabled={busy} onChange={(event) => setModal((old) => ({ ...old, pixel_id: event.target.value }))} /></label><label>Pixel token<input type="password" required={!modal.id} maxLength={4096} autoComplete="new-password" value={modal.token} placeholder={modal.id ? text('اتركه فارغاً للاحتفاظ بالتوكن الحالي', 'Leave blank to keep the current token') : ''} disabled={busy} onChange={(event) => setModal((old) => ({ ...old, token: event.target.value }))} /></label><label>{text('ملاحظة', 'Note')}<input maxLength={240} value={modal.note} disabled={busy} onChange={(event) => setModal((old) => ({ ...old, note: event.target.value }))} /></label><p>{text('لتمييز البيكسل، مثل بيكسل الملابس أو الإلكترونيات.', 'Remember what this pixel is for, such as clothing or electronics.')}</p><label className="ws-tracking-enabled"><input type="checkbox" checked={modal.enabled} disabled={busy} onChange={(event) => setModal((old) => ({ ...old, enabled: event.target.checked }))} />{text('تفعيل البيكسل', 'Enable pixel')}</label><button type="submit" className="ws-primary-button" disabled={!modal.provider || busy}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button></form> : null}</DialogPanel></div></Dialog>
        <Dialog open={!!remove} onClose={() => { if (!busy) setRemove(null); }} className="ws-tracking-dialog"><DialogBackdrop className="ws-tracking-backdrop" /><div className="ws-tracking-dialog-position"><DialogPanel className="ws-tracking-dialog-panel" dir={ar ? 'rtl' : 'ltr'}><DialogTitle>{text('حذف البيكسل', 'Delete pixel')}</DialogTitle><p>{text('سيتوقف إرسال الأحداث الجديدة لهذا البيكسل. هل تريد حذفه؟', 'New events will stop being sent to this pixel. Delete it?')}</p><div className="ws-tracking-delete-actions"><button type="button" className="ws-secondary-button" disabled={busy} onClick={() => setRemove(null)}>{text('إلغاء', 'Cancel')}</button><button type="button" className="ws-primary-button" disabled={busy} onClick={() => { void mutate(() => api.delete(`${endpoint}/${remove.id}`, { data: { version: settings.version } })); }}>{text('حذف', 'Delete')}</button></div></DialogPanel></div></Dialog>
    </div>;
}
