import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import useStoreContext from '../../../hooks/useStoreContext';
import { useDirty } from '../../../hooks/useStoreSettings';
import { addDeliveryOverride, renderDeliveryTemplate } from '../../../features/store/digital-delivery';

const button = 'rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40';
const input = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

function DeliveryFields({ value, onChange, text, verified, preview, disabled }) {
    return <div className="grid gap-5 lg:grid-cols-2">
        <fieldset className="space-y-4" disabled={disabled}>
            <label className="flex items-center gap-2"><input type="checkbox" checked={value.email_enabled} onChange={(event) => onChange({ email_enabled: event.target.checked })} />{text('التسليم بالبريد الإلكتروني', 'Email delivery')}</label>
            <label className="block text-sm">{text('اسم الراسل', 'Sender name')}<input className={input} maxLength={100} value={value.sender_name ?? ''} onChange={(event) => onChange({ sender_name: event.target.value })} /></label>
            <label className="block text-sm">{text('موضوع البريد الإلكتروني', 'Email subject')}<input className={input} maxLength={200} required value={value.email_subject} onChange={(event) => onChange({ email_subject: event.target.value })} /></label>
            <label className="block text-sm">{text('قالب البريد الإلكتروني', 'Email body')}<textarea className={input} rows={5} maxLength={6000} required value={value.email_body} onChange={(event) => onChange({ email_body: event.target.value })} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" disabled={!verified} checked={value.whatsapp_enabled} onChange={(event) => onChange({ whatsapp_enabled: event.target.checked })} />{text('التسليم عبر واتساب', 'WhatsApp delivery')}</label>
            <label className="block text-sm">{text('قالب واتساب', 'WhatsApp body')}<textarea className={input} rows={4} maxLength={3000} required value={value.whatsapp_body} onChange={(event) => onChange({ whatsapp_body: event.target.value })} /></label>
        </fieldset>
        <aside className="space-y-4 rounded-xl bg-slate-50 p-4">
            <h3 className="font-semibold">{text('معاينة ببيانات تجريبية', 'Preview with sample data')}</h3>
            <p className="break-words text-sm font-semibold">{renderDeliveryTemplate(value.email_subject, preview)}</p>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">{renderDeliveryTemplate(value.email_body, preview)}</pre>
            <hr /><h4 className="text-sm font-semibold">{text('واتساب', 'WhatsApp')}</h4>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">{renderDeliveryTemplate(value.whatsapp_body, preview)}</pre>
        </aside>
    </div>;
}

export default function StoreDigitalDeliveryPage() {
    const context = useStoreContext();
    return <DigitalDeliveryEditor key={context.apiBase} context={context} />;
}

function DigitalDeliveryEditor({ context }) {
    const { apiBase, uiBase, access, store } = context;
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [settings, setSettings] = useState(null);
    const [initial, setInitial] = useState(null);
    const [products, setProducts] = useState([]);
    const [connection, setConnection] = useState(null);
    const [instance, setInstance] = useState('');
    const [token, setToken] = useState('');
    const [selected, setSelected] = useState('');
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const working = useRef(false);
    useDirty(initial, settings);
    const apply = (data) => { setSettings(data.data); setInitial(data.data); setProducts(data.products); setConnection(data.connection); setInstance(data.connection.instance_id); setToken(''); };
    useEffect(() => {
        let active = true;
        if (!access?.canStoreSettings) return undefined;
        api.get(`${apiBase}/digital-delivery`).then(({ data }) => { if (active) apply(data); }).catch((e) => { if (active) setError(errorText(e)); });
        return () => { active = false; };
    }, [apiBase, access?.canStoreSettings, attempt]);
    if (!access?.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const update = (changes) => { setSettings((current) => ({ ...current, ...changes })); setSaved(false); setError(''); };
    async function send(path, method, body) {
        if (working.current) return;
        working.current = true; setBusy(true); setError(''); setSaved(false);
        try { const { data } = await api[method](`${apiBase}/digital-delivery${path}`, body); apply(data); setSaved(true); }
        catch (e) { setError(errorText(e)); }
        finally { working.current = false; setBusy(false); }
    }
    const preview = { customer_name: text('عميل تجريبي', 'Sample customer'), code_or_link: 'DEMO-CODE-123', store_name: store?.name ?? text('متجرك', 'Your store'), product_name: text('منتج رقمي تجريبي', 'Sample digital product') };
    return <div className="mx-auto max-w-6xl space-y-5">
        <PageHeader title={text('تسليم المنتجات الرقمية', 'Digital product delivery')} subtitle={text('خصص رسائل المنتجات المدفوعة لكل قناة ومنتج.', 'Customize paid-product messages for each channel and product.')} />
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}{!settings ? <button className={button} onClick={() => { setError(''); setAttempt((n) => n + 1); }}>{text('إعادة المحاولة', 'Retry')}</button> : null}</p> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{text('تم حفظ الإعدادات.', 'Settings saved.')}</p> : null}
        {!settings && !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {settings ? <>
            <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6">
                <p>{text('يتم إرسال الأكواد والروابط بعد تأكيد الدفع فقط. يبقى البريد مطلوبًا للإيصال، ويُطلب رقم دولي للمنتجات التي تُسلّم بواتساب.', 'Codes and links are sent only after payment confirmation. Email remains required for receipts; an international phone number is required for products delivered by WhatsApp.')}</p>
                <p dir="ltr" className="break-all">{'{customer_name} · {code_or_link} · {store_name} · {product_name}'}</p>
                <p>{text('أضف {code_or_link} إلى كل قالب تسليم. القوالب نصية، ويُستخدم عنوان البريد المعتمد للمنصة مع اسم الراسل الذي تحدده.', 'Include {code_or_link} in each delivery body. Templates are plain text; the platform’s configured email address uses your chosen sender name.')}</p>
            </section>
            <form onSubmit={(event) => { event.preventDefault(); send('', 'put', { settings }); }} className="space-y-5">
                <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="flex items-center gap-2 font-semibold"><input disabled={busy} type="checkbox" checked={settings.enabled} onChange={(event) => update({ enabled: event.target.checked })} />{text('تفعيل التسليم التلقائي بعد الدفع', 'Enable automatic delivery after payment')}</label>
                    <DeliveryFields value={settings} onChange={update} text={text} verified={!!connection?.verified_at} preview={preview} disabled={busy} />
                </section>
                <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="font-semibold">{text('إعدادات خاصة لكل منتج', 'Per-product overrides')}</h2>
                    <div className="flex flex-wrap gap-3"><label className="min-w-0 flex-1 text-sm">{text('اختر منتجًا رقميًا', 'Choose a digital product')}<select className={input} value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">{text('اختر المنتج', 'Select product')}</option>{products.filter((product) => !settings.overrides.some((entry) => entry.product_id === product.id)).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><button type="button" className={button} disabled={busy || !selected} onClick={() => { update(addDeliveryOverride(settings, Number(selected))); setSelected(''); }}>{text('إضافة إعدادات المنتج', 'Add product override')}</button></div>
                    {settings.overrides.map((entry) => <article key={entry.product_id} className="space-y-4 rounded-xl border border-slate-200 p-4">
                        <header className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{products.find((product) => product.id === entry.product_id)?.name ?? `#${entry.product_id}`}</h3><button type="button" className={button} disabled={busy} onClick={() => update({ overrides: settings.overrides.filter((item) => item.product_id !== entry.product_id) })}>{text('استخدام إعدادات المتجر', 'Use store defaults')}</button></header>
                        <DeliveryFields value={entry} onChange={(changes) => update({ overrides: settings.overrides.map((item) => item.product_id === entry.product_id ? { ...item, ...changes } : item) })} text={text} verified={!!connection?.verified_at} preview={{ ...preview, product_name: products.find((product) => product.id === entry.product_id)?.name ?? preview.product_name }} disabled={busy} />
                    </article>)}
                </section>
                <button className={`${button} bg-emerald-600 text-white`} disabled={busy}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ قوالب التسليم', 'Save delivery templates')}</button>
            </form>
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold">{text('اتصال واتساب الخاص بالمتجر • Wawp v2', 'Store WhatsApp connection • Wawp v2')}</h2>
                <p className="text-sm leading-6 text-slate-600">{text('يتطلب حساب Wawp نشطًا وجلسة واتساب متصلة. احفظ القوالب قبل تعديل الاتصال. التحقق يقرأ حالة الجلسة دون إرسال رسالة.', 'Requires an active Wawp account and connected WhatsApp session. Save templates before changing the connection. Verification reads session status without sending a message.')}</p>
                <p role="status" className="text-sm">{connection?.verified_at ? text('تم التحقق من الاتصال.', 'Connection verified.') : text('الاتصال غير متحقق؛ تسليم واتساب متوقف.', 'Connection not verified; WhatsApp delivery is disabled.')}</p>
                <label className="block text-sm">{text('معرّف الجلسة', 'Instance ID')}<input disabled={busy} className={input} value={instance} onChange={(event) => setInstance(event.target.value)} autoComplete="off" /></label>
                <label className="block text-sm">{text('رمز الوصول', 'Access token')}<input disabled={busy} className={input} type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="new-password" placeholder={connection?.has_token ? text('محفوظ؛ اتركه فارغًا للاحتفاظ به', 'Saved; leave blank to keep it') : ''} /></label>
                <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={busy || !instance || JSON.stringify(initial) !== JSON.stringify(settings)} onClick={() => send('/connection', 'put', { instance_id: instance, access_token: token || null })}>{text('حفظ الاتصال', 'Save connection')}</button><button type="button" className={button} disabled={busy || !connection?.has_token || token || instance !== connection.instance_id || JSON.stringify(initial) !== JSON.stringify(settings)} onClick={() => send('/verify', 'post', {})}>{text('التحقق من الاتصال', 'Verify connection')}</button></div>
            </section>
        </> : null}
    </div>;
}
