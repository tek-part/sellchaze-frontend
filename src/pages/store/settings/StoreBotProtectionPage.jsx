import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import useStoreContext from '../../../hooks/useStoreContext';
import { useDirty } from '../../../hooks/useStoreSettings';

export default function StoreBotProtectionPage() {
    const context = useStoreContext();
    return <Editor key={context.apiBase} context={context} />;
}

function Editor({ context: { apiBase, uiBase, access } }) {
    const { i18n } = useTranslation();
    const text = (ar, en) => i18n.language.startsWith('ar') ? ar : en;
    const [settings, setSettings] = useState(null);
    const [enabled, setEnabled] = useState(false);
    const [siteKey, setSiteKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [clear, setClear] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);
    const [reload, setReload] = useState(0);
    const working = useRef(false);
    useDirty(settings ? { enabled: settings.enabled, siteKey: '', secretKey: '', clear: false } : null, settings ? { enabled, siteKey, secretKey, clear } : null);
    const apply = (data) => { setSettings(data); setEnabled(data.enabled); setSiteKey(''); setSecretKey(''); setClear(false); };
    const errorText = (failure) => Object.values(failure.response?.data?.errors || {}).flat().join(' ') || failure.response?.data?.message || failure.message;
    useEffect(() => {
        let active = true;
        if (!access.canStoreSettings) return undefined;
        api.get(`${apiBase}/bot-protection`).then(({ data }) => { if (active) apply(data.data); }).catch((failure) => { if (active) setError(errorText(failure)); });
        return () => { active = false; };
    }, [apiBase, access.canStoreSettings, reload]);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    async function save(event) {
        event.preventDefault();
        if (working.current || !settings) return;
        if (enabled && (clear || (!settings.credentials_configured && (!siteKey.trim() || !secretKey.trim())) || !settings.allowed_hostnames.length)) {
            setError(text('أضف مفتاح الموقع والمفتاح السري ونطاق المتجر قبل تفعيل الحماية.', 'Add the site key, secret key and store hostname before enabling protection.'));
            return;
        }
        working.current = true; setBusy(true); setError(''); setSaved(false);
        try {
            const { data } = await api.put(`${apiBase}/bot-protection`, { enabled, version: settings.version, clear_credentials: clear,
                ...(siteKey || secretKey ? { credentials: { site_key: siteKey.trim(), secret_key: secretKey.trim() } } : {}) });
            apply(data.data); setSaved(true);
        } catch (failure) { setError(errorText(failure)); }
        finally { working.current = false; setBusy(false); }
    }
    const input = 'mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900';
    return <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader title={text('الحماية من الطلبات الآلية', 'Automated order protection')} subtitle={text('فعّل فحص الحماية قبل إنشاء الطلب في السلة وصفحات البيع.', 'Require a security check before creating cart and funnel orders.')} />
        <aside className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            <p>{text('أنشئ عنصر Turnstile في حساب Cloudflare وأضف نطاقات متجرك أدناه إليه، ثم احفظ مفتاح الموقع والمفتاح السري. لا تُفعّل الحماية قبل إتمام إعداد المزود.', 'Create a Cloudflare Turnstile widget and add the store hostnames below, then save its site key and secret. Complete provider setup before enabling protection.')}</p>
            <p>{text('حفظ المفاتيح لا يثبت صلاحية الاتصال. النجاح يتطلب اجتياز فحص حقيقي والتحقق منه بالخادم. تعطل المزود يمنع إنشاء طلب جديد عند التفعيل، مع بقاء الإيصالات وإعادة دفع الطلبات السابقة متاحة.', 'Saving keys does not verify the connection. Acceptance requires an actual check validated by the server. Provider failure blocks new orders when enabled; existing receipts and payment retries remain available.')}</p>
            <p>{text('المفتاح السري مشفر ولا يُعرض. كل تأكيد صالح لمدة أقصاها 5 دقائق ويُستخدم لطلب واحد. تغيير الإعدادات يلغي التأكيدات السابقة.', 'The secret is encrypted and never displayed. Each proof lasts at most 5 minutes and creates one order. Settings changes invalidate previous proofs.')}</p>
            <a className="underline" href="https://developers.cloudflare.com/turnstile/get-started/" target="_blank" rel="noreferrer">{text('دليل إعداد Turnstile', 'Turnstile setup guide')}</a>
        </aside>
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}<button className="mx-2 underline" onClick={() => { setError(''); setReload((value) => value + 1); }}>{text('إعادة تحميل الإعدادات', 'Reload settings')}</button></p> : null}
        {saved ? <p role="status">{text('تم حفظ إعدادات الحماية.', 'Protection settings saved.')}</p> : null}
        {!settings && !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {settings ? <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800" onSubmit={save}>
            <fieldset disabled={busy} className="space-y-5">
                <label className="flex gap-3"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /><span>{text('تفعيل الحماية من البوتات', 'Enable bot protection')}</span></label>
                <p>{settings.credentials_configured ? text('المفاتيح محفوظة؛ تحقق من إعدادها لدى المزود.', 'Keys saved; confirm provider setup.') : text('لم تُضف مفاتيح الاتصال بعد.', 'No provider keys configured.')}</p>
                <p>{text('النطاقات المسموح بها', 'Allowed hostnames')}: <span dir="ltr">{settings.allowed_hostnames.join(', ')}</span></p>
                <label className="block">{text('مفتاح الموقع الجديد', 'Replacement site key')}<input className={input} value={siteKey} onChange={(event) => setSiteKey(event.target.value)} autoComplete="off" maxLength={255} disabled={clear} dir="ltr" /></label>
                <label className="block">{text('المفتاح السري الجديد', 'Replacement secret key')}<input className={input} type="password" value={secretKey} onChange={(event) => setSecretKey(event.target.value)} autoComplete="off" maxLength={255} disabled={clear} dir="ltr" /></label>
                <p className="text-sm text-slate-500">{text('اترك الحقلين فارغين للاحتفاظ بالاتصال الحالي. لاستبداله أدخل المفتاحين معًا.', 'Leave both fields empty to retain existing keys. Enter both to replace them.')}</p>
                <label className="flex gap-3"><input type="checkbox" checked={clear} onChange={(event) => { setClear(event.target.checked); setSiteKey(''); setSecretKey(''); if (event.target.checked) setEnabled(false); }} /><span>{text('إزالة المفاتيح المحفوظة وتعطيل الحماية', 'Remove saved keys and disable protection')}</span></label>
            </fieldset>
            <button disabled={busy} className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white disabled:opacity-40">{text('حفظ إعدادات الحماية', 'Save protection settings')}</button>
        </form> : null}
    </div>;
}
