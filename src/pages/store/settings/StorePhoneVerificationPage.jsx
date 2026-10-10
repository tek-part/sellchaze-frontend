import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import useStoreContext from '../../../hooks/useStoreContext';
import { useDirty } from '../../../hooks/useStoreSettings';

const input = 'mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900';
const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

export default function StorePhoneVerificationPage() {
    const context = useStoreContext();
    return <PhoneVerificationEditor key={context.apiBase} context={context} />;
}

function PhoneVerificationEditor({ context: { apiBase, uiBase, access } }) {
    const { i18n } = useTranslation();
    const text = (ar, en) => i18n.language.startsWith('ar') ? ar : en;
    const [settings, setSettings] = useState(null);
    const [enabled, setEnabled] = useState(false);
    const [instance, setInstance] = useState('');
    const [token, setToken] = useState('');
    const [clear, setClear] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);
    const [reload, setReload] = useState(0);
    const working = useRef(false);
    useDirty(settings ? { enabled: settings.enabled, instance: '', token: '', clear: false } : null, settings ? { enabled, instance, token, clear } : null);
    const apply = (data) => { setSettings(data); setEnabled(data.enabled); setInstance(''); setToken(''); setClear(false); };
    useEffect(() => {
        let active = true;
        if (!access.canStoreSettings) return undefined;
        api.get(`${apiBase}/phone-verification`).then(({ data }) => { if (active) apply(data.data); }).catch((failure) => { if (active) setError(errorText(failure)); });
        return () => { active = false; };
    }, [apiBase, access.canStoreSettings, reload]);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    async function save(verify = false) {
        if (working.current || !settings) return;
        working.current = true; setBusy(true); setError(''); setSaved(false);
        try {
            const { data } = await api.put(`${apiBase}/phone-verification`, { enabled, version: settings.version, clear_credentials: clear, verify_connection: verify,
                ...(instance || token ? { credentials: { instance_id: instance.trim(), access_token: token.trim() } } : {}) });
            apply(data.data); setSaved(true);
        } catch (failure) { setError(errorText(failure)); }
        finally { working.current = false; setBusy(false); }
    }
    return <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader title={text('تأكيد الهاتف عبر واتساب OTP', 'WhatsApp phone verification')} subtitle={text('اطلب تأكيد امتلاك رقم الهاتف قبل إنشاء الطلب، في السلة وصفحات البيع.', 'Require phone possession verification before order creation in carts and sales funnels.')} />
        <aside className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            <p>{text('الرمز صالح 5 دقائق، و5 محاولات فقط. إعادة الإرسال بعد دقيقة وبحدود لكل رقم ومتجر. التأكيد يُستخدم لطلب واحد، والطلبات السابقة وإعادة دفعها تبقى متاحة.', 'Codes expire in5 minutes with5 attempts. Resending waits1 minute and is limited per number/store. A proof is used for one order; existing orders/payment retries remain available.')}</p>
            <p>{text('إعداد اتصال Wawp مستقل ومشفر لكل متجر. حفظ الاتصال الجديد يتحقق من حالته دون إرسال رسالة. تفعيل OTP يطلب هاتفًا صحيحًا حتى للمنتجات الرقمية. تغيير الإعدادات يلغي التأكيدات السابقة.', 'Each store has a separate encrypted Wawp connection. Saving replacement credentials checks its status without sending a message. Enabling OTP requires a valid phone, including digital products. Settings changes invalidate earlier proofs.')}</p>
            <p>{text('تأكيد الهاتف لا يسجل دخول العميل ولا يثبت هويته الشخصية. قبول مزود واتساب للرسالة لا يضمن استلامها.', 'Phone verification does not sign customers in or establish their personal identity. WhatsApp provider acceptance does not guarantee receipt.')}</p>
            {access.canStoreOrders ? <Link className="underline" to={`${uiBase}/blocked-phones`}>{text('إدارة أرقام OTP المحظورة', 'Manage blocked OTP numbers')}</Link> : null}
        </aside>
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}<button className="mx-2 underline" onClick={() => { setError(''); setReload((n) => n + 1); }}>{text('إعادة تحميل الإعدادات', 'Reload settings')}</button></p> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{text('تم حفظ إعدادات تأكيد الهاتف.', 'Phone verification settings saved.')}</p> : null}
        {!settings && !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {settings ? <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800" onSubmit={(event) => { event.preventDefault(); void save(); }}>
            <fieldset disabled={busy} className="space-y-5">
                <label className="flex gap-3"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /><span>{text('تفعيل تأكيد الهاتف قبل الطلب', 'Require phone verification before ordering')}</span></label>
                <p>{text('حالة الاتصال', 'Connection status')}: {settings.connection_verified ? text('تم التحقق', 'Verified') : settings.credentials_configured ? text('يحتاج التحقق', 'Verification needed') : text('لم يُربط بعد', 'Not connected')}</p>
                <label className="block">{text('معرف جلسة Wawp الجديد', 'Replacement Wawp instance ID')}<input className={input} autoComplete="off" maxLength={255} value={instance} onChange={(event) => setInstance(event.target.value)} disabled={clear} dir="ltr" /></label>
                <label className="block">{text('رمز وصول Wawp الجديد', 'Replacement Wawp access token')}<input className={input} type="password" autoComplete="off" maxLength={2048} value={token} onChange={(event) => setToken(event.target.value)} disabled={clear} dir="ltr" /></label>
                <p className="text-sm text-slate-500">{text('اترك الحقلين فارغين للاحتفاظ بالاتصال الحالي. لا نعرض بيانات الاتصال المحفوظة.', 'Leave both fields empty to retain the current connection. Saved credentials are never displayed.')}</p>
                <label className="flex gap-3"><input type="checkbox" checked={clear} onChange={(event) => { setClear(event.target.checked); setInstance(''); setToken(''); if (event.target.checked) setEnabled(false); }} /><span>{text('إزالة الاتصال المحفوظ وتعطيل OTP', 'Remove saved connection and disable OTP')}</span></label>
                <Link className="underline" to={`${uiBase}/settings/order-limits`}>{text('دولة الأرقام المحلية', 'Country for local numbers')}: {settings.phone_country}</Link>
            </fieldset>
            <div className="flex flex-wrap gap-3"><button className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white disabled:opacity-40" disabled={busy}>{text('حفظ إعدادات OTP', 'Save OTP settings')}</button>
                <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-40" disabled={busy || clear || (!settings.credentials_configured && !instance)} onClick={() => void save(true)}>{text('التحقق من الاتصال وحفظه', 'Verify connection and save')}</button></div>
        </form> : null}
    </div>;
}
