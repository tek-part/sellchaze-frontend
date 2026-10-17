import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheck, HiOutlineClipboard, HiOutlineEye, HiOutlineEyeSlash, HiOutlineXMark } from '../components/workspace/WorkspaceIcons';
import { Navigate } from 'react-router-dom';
import api from '../api/client';
import FormField, { INPUT_CLASS } from '../components/ui/FormField';
import { notify } from '../components/ui/notify';
import Toggle from '../components/ui/Toggle';
import StoreMediaPicker from '../components/store/StoreMediaPicker';
import MerchantSettingsHeading from '../components/store/MerchantSettingsHeading';
import PaymentMethodLogo from '../shared/payments/PaymentMethodLogo';
import useStoreContext from '../hooks/useStoreContext';
import './store-payments.css';
const MASK = '********';
function normalize(row) {
    const fields = row.credential_fields || [];
    return { ...row, available: row.available !== false, order: Number(row.order || 0), notes: row.notes || '',
        provider_name: row.provider_name || row.name,
        presentation: { name: row.name || '', description: row.description || '', logo_asset_id: row.logo_asset_id || null },
        stored: Object.fromEntries(fields.map(key => [key, Boolean(row.credentials?.[key])])),
        credentials: Object.fromEntries(fields.map(key => [key, (row.visible_fields || []).includes(key) ? (row.credentials?.[key] || '') : ''])) };
}
function rowsFrom(data) { return (Array.isArray(data?.data) ? data.data : []).map(normalize); }
function fieldLabel(t, key) { return t(`payment_field_${key}`, key.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())); }
function SecretInput({ id, value, onChange, stored, placeholder }) {
    const { t } = useTranslation();
    const [reveal, setReveal] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={reveal ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                autoComplete="off"
                spellCheck={false}
                dir="ltr"
                placeholder={stored ? '••••••••••••' : placeholder}
                className={`${INPUT_CLASS} pe-10 font-mono`}
            />
            <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={reveal ? t('ui_hide', 'Hide') : t('ui_show', 'Show')}
                tabIndex={-1}
            >
                {reveal ? <HiOutlineEyeSlash className="h-4 w-4" aria-hidden /> : <HiOutlineEye className="h-4 w-4" aria-hidden />}
            </button>
        </div>
    );
}

function CopyField({ value }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable */
        }
    };
    return (
        <div className="flex items-stretch gap-2">
            <input value={value} readOnly dir="ltr" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-700" />
            <button
                type="button"
                onClick={copy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                {copied ? <HiOutlineCheck className="h-4 w-4 text-emerald-600" aria-hidden /> : <HiOutlineClipboard className="h-4 w-4" aria-hidden />}
                {copied ? t('action_copied', 'Copied') : t('action_copy', 'Copy')}
            </button>
        </div>
    );
}


export default function StorePaymentsPage() {
    const context = useStoreContext();
    return <PaymentMethods key={context.apiBase} context={context} />;
}
function PaymentMethods({ context: { apiBase, uiBase, access } }) {
    const { t, i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('');
    useEffect(() => {
        if (!access.canStoreSettings) return;
        let active = true;
        setLoading(true);
        api.get(`${apiBase}/payments`).then(({ data }) => { if (active) { setRows(rowsFrom(data)); setError(''); } })
            .catch(failure => { if (active) setError(failure.response?.data?.message || failure.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, access.canStoreSettings, attempt]);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const providerName = row => row.slug === 'cod' ? text('دفع عند الاستلام', 'Cash on delivery') : row.slug === 'bank_transfer' ? text('تحويل بنكي', 'Bank transfer') : row.slug === 'transfer_receipt' ? text('تحويل مع إيصال', 'Transfer with receipt') : row.provider_name;
    const patch = value => setDraft(current => ({ ...current, ...value }));
    const presentation = value => setDraft(current => ({ ...current, presentation: { ...current.presentation, ...value } }));
    const save = async (event, gateway = draft) => {
        event?.preventDefault();
        if (saving) return;
        setSaving(true); setError('');
        try {
            const { data } = await api.put(`${apiBase}/payments`, { gateways: [{ slug: gateway.slug,
                enabled: Boolean(gateway.enabled), test_mode: Boolean(gateway.test_mode), order: Number(gateway.order || 0), notes: gateway.notes,
                presentation: gateway.presentation,
                credentials: Object.fromEntries(Object.entries(gateway.credentials).filter(([, value]) => value.trim() && value !== MASK)) }] });
            setRows(rowsFrom(data)); setDraft(null);
            notify.success(text('تم حفظ طريقة الدفع', 'Payment method saved'));
        } catch (failure) {
            const message = Object.values(failure.response?.data?.errors || {}).flat().join(' ') || failure.response?.data?.message || failure.message;
            setError(message); notify.error(text('تعذر الحفظ', 'Could not save'), message);
        } finally { setSaving(false); }
    };
    return <div className="ws-payments">
        <MerchantSettingsHeading title={text('طرق الدفع', 'Payment methods')} description={text('اختر طرق الدفع المناسبة لمتجرك، ورتّب ظهورها للعملاء.', 'Choose how customers pay and set their display order.')} />
        {error && !draft ? <div role="alert" className="ws-payments-error">{error}<button type="button" onClick={() => setAttempt(n => n + 1)}>{text('إعادة المحاولة', 'Retry')}</button></div> : null}
        <div className="ws-payments-toolbar"><span>{text('طرق الدفع المفعّلة', 'Enabled payment methods')}: {rows.filter(row => row.enabled).length}</span><label><span className="sr-only">{text('بحث عن طريقة دفع', 'Search payment methods')}</span><input type="search" value={filter} onChange={event => setFilter(event.target.value)} placeholder={text('بحث عن طريقة دفع', 'Search payment methods')} /></label></div>
        {loading ? <p role="status">{text('جارٍ تحميل طرق الدفع…', 'Loading payment methods…')}</p> : <div className="ws-payments-grid">{rows.filter(row => `${row.name} ${row.provider_name} ${row.slug}`.toLowerCase().includes(filter.toLowerCase())).map(row => <section className="ws-payment-card" key={row.slug}>
            <div className="ws-payment-card-logo"><PaymentMethodLogo slug={row.slug} src={row.logo_url} width={120} height={64} /></div>
            <h2>{providerName(row)}</h2>
            <span className={`ws-payment-state ${row.enabled ? 'is-enabled' : ''}`}>{row.enabled ? text('مفعّل', 'Enabled') : text('غير مفعّل', 'Disabled')}</span>
            {!row.available ? <p className="ws-payment-setup">{text('الربط قيد الاستكمال', 'Connection in progress')}</p> : null}
            <div className="ws-payment-actions"><button type="button" className="ws-payment-toggle" disabled={saving || !row.available} onClick={() => {
                if (!row.enabled && row.credential_fields.length && !row.configured) { setError(''); setDraft({ ...row, enabled: true }); }
                else void save(null, { ...row, enabled: !row.enabled });
            }}>{row.enabled ? text('إلغاء التفعيل', 'Deactivate') : text('تفعيل طريقة الدفع', 'Activate payment method')}</button><button type="button" disabled={saving} onClick={() => { setError(''); setDraft(structuredClone(row)); }}>{text('تعديل', 'Edit')}</button></div>
        </section>)}</div>}
        <Dialog open={Boolean(draft)} onClose={() => { if (!saving) { setDraft(null); setError(''); } }} className="ws-payment-dialog">
            <div className="ws-payment-backdrop" aria-hidden="true" /><div className="ws-payment-dialog-wrap"><DialogPanel className="ws-payment-dialog-panel">
                {draft ? <form onSubmit={save}>
                    <header><div><PaymentMethodLogo slug={draft.slug} src={draft.logo_url} width={90} height={40} /><DialogTitle>{text('تعديل', 'Edit')} {providerName(draft)}</DialogTitle></div><button type="button" disabled={saving} aria-label={text('إغلاق', 'Close')} onClick={() => setDraft(null)}><HiOutlineXMark aria-hidden /></button></header>
                    <div className="ws-payment-dialog-body">
                        {error ? <p role="alert" className="ws-payments-error">{error}</p> : null}
                        {!draft.available ? <p role="status" className="ws-payments-error">{text('يمكن تجهيز بيانات الطريقة؛ سيُتاح تفعيلها عند اكتمال الربط.', 'You can prepare these settings. Activation will be available when the connection is complete.')}</p> : null}
                        <Toggle label={text('تفعيل طريقة الدفع', 'Enable payment method')} checked={draft.enabled} disabled={!draft.available || saving} onChange={enabled => patch({ enabled })} />
                        <FormField label={text('اسم طريقة الدفع', 'Customer-facing name')} htmlFor="payment-name"><input id="payment-name" className={INPUT_CLASS} value={draft.presentation.name} maxLength={120} onChange={event => presentation({ name: event.target.value })} /></FormField>
                        <FormField label={text('وصف طريقة الدفع', 'Customer-facing description')} htmlFor="payment-description"><textarea id="payment-description" className={INPUT_CLASS} value={draft.presentation.description} maxLength={2000} onChange={event => presentation({ description: event.target.value })} /></FormField>
                        <FormField label={text('أولوية الظهور', 'Display priority')} htmlFor="payment-order"><input id="payment-order" type="number" min="0" max="100000" className={INPUT_CLASS} value={draft.order} onChange={event => patch({ order: event.target.value })} /></FormField>
                        <FormField label={text('شعار طريقة الدفع', 'Payment method logo')}><StoreMediaPicker apiBase={apiBase} value={draft.presentation.logo_asset_id ? draft.logo_url : ''} onChange={logo_url => patch({ logo_url })} onSelectAsset={asset => presentation({ logo_asset_id: asset?.id || null })} /><small>{text('دون صورة مخصصة، يظهر الشعار الأصلي لطريقة الدفع.', 'Without a custom image, the original provider logo is used.')}</small></FormField>
                        {draft.credential_fields.length ? <>
                            <h3>{text('بيانات الربط', 'Connection settings')}</h3>
                            {draft.slug === 'easykash' ? <p>{text('يعمل هذا الربط بالجنيه المصري، ولا توفر الواجهة بيئة اختبار. اترك وضع الاختبار مغلقًا عند التفعيل.', 'This connection uses EGP. The API has no sandbox; turn test mode off before activation.')}</p> : draft.slug === 'myfatoorah' ? <p>{text('اختر دولة حسابك وعملتها الأساسية. بيئة الاختبار تعمل بالدينار الكويتي.', 'Choose your account country and base currency. The sandbox uses KWD.')}</p> : null}
                            <Toggle checked={draft.test_mode} onChange={test_mode => patch({ test_mode })} label={text('وضع الاختبار', 'Test mode')} />
                            {draft.credential_fields.map(key => <FormField key={key} label={fieldLabel(t, key)} htmlFor={`payment-${key}`} hint={draft.stored[key] && !(draft.visible_fields || []).includes(key) ? text('محفوظ — اتركه فارغًا للاحتفاظ بالقيمة الحالية.', 'Saved — leave blank to keep the current value.') : undefined}>{key === 'country' ? <select id={`payment-${key}`} className={INPUT_CLASS} value={draft.credentials[key]} onChange={event => patch({ credentials: { ...draft.credentials, [key]: event.target.value } })}><option value="">{text('اختر دولة الحساب', 'Choose account country')}</option>{[['KW','الكويت','Kuwait'],['SA','السعودية','Saudi Arabia'],['AE','الإمارات','UAE'],['EG','مصر','Egypt'],['QA','قطر','Qatar'],['BH','البحرين','Bahrain'],['JO','الأردن','Jordan'],['OM','عمان','Oman']].map(([value,a,e]) => <option key={value} value={value}>{text(a,e)}</option>)}</select> : (draft.visible_fields || []).includes(key) ? <input id={`payment-${key}`} className={INPUT_CLASS} dir="ltr" value={draft.credentials[key]} onChange={event => patch({ credentials: { ...draft.credentials, [key]: event.target.value } })} /> : <SecretInput id={`payment-${key}`} stored={draft.stored[key]} value={draft.credentials[key]} placeholder={key} onChange={event => patch({ credentials: { ...draft.credentials, [key]: event.target.value } })} />}</FormField>)}
                        </> : null}
                        {draft.return_url ? <FormField label={text('رابط العودة وإشعارات XPay', 'XPay return and callback URL')} hint={text('أنشئ API Payment في لوحة XPay وأدخل هذا الرابط في Redirect URL وCallback URL، ثم أدخل رقم القالب أعلاه. يدعم الربط حسابات خصم رسوم المعالجة من قيمة الدفع.', 'Create an API Payment in XPay, use this URL for both Redirect URL and Callback URL, then enter its template ID above. This connection supports processing fees included in the payment amount.')}><CopyField value={draft.return_url} /></FormField> : null}
                        {draft.webhook_url ? <FormField label={text('رابط إشعارات الدفع', 'Payment webhook URL')}><CopyField value={draft.webhook_url} /></FormField> : null}
                        <p className="ws-payment-secret-note">{text('تُحفظ بيانات الربط مشفّرة، ولا تُعرض المفاتيح المحفوظة مجددًا.', 'Credentials are encrypted. Saved keys are never displayed again.')}</p>
                    </div>
                    <footer><button type="button" disabled={saving} onClick={() => setDraft(null)}>{text('إلغاء', 'Cancel')}</button><button type="submit" disabled={saving}>{saving ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ التغييرات', 'Save changes')}</button></footer>
                </form> : null}
            </DialogPanel></div>
        </Dialog>
    </div>;
}
