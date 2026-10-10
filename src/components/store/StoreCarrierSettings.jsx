import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import SettingsCard from '../ui/SettingsCard';
import FormField, { INPUT_CLASS } from '../ui/FormField';
import Toggle from '../ui/Toggle';

const button = 'rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;

export default function StoreCarrierSettings({ apiBase }) {
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [connection, setConnection] = useState(null);
    const [key, setKey] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const working = useRef(false);
    useEffect(() => {
        let active = true;
        setConnection(null); setError(''); setKey('');
        api.get(`${apiBase}/carriers/bosta`).then(({ data }) => { if (active) setConnection(data.data); })
            .catch((e) => { if (active) setError(errorText(e)); });
        return () => { active = false; };
    }, [apiBase, attempt]);
    async function perform(verify) {
        if (working.current) return;
        working.current = true; setBusy(true); setError(''); setSuccess(false);
        try {
            const { data } = verify ? await api.post(`${apiBase}/carriers/bosta/verify`) : await api.put(`${apiBase}/carriers/bosta`, {
                api_key: key || undefined, enabled: connection.enabled, pickup_location_id: connection.pickup_location_id || null,
            });
            setConnection(data.data); setKey(''); setSuccess(true);
        } catch (e) { setError(errorText(e)); }
        finally { working.current = false; setBusy(false); }
    }
    return <SettingsCard title={text('شركات الشحن • Bosta', 'Shipping carriers • Bosta')} description={text('اربط حسابك لإرسال الطلبات ومتابعة شحناتها من داخل المتجر. متاح لطلبات مصر بالجنيه المصري.', 'Connect your account to dispatch and track orders from your store. Supports Egyptian orders in EGP.')}>
        {error ? <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {success ? <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{text('تم تحديث اتصال الشحن.', 'Carrier connection updated.')}</p> : null}
        {!connection ? <button type="button" className={button} onClick={() => setAttempt((n) => n + 1)}>{text('تحميل الاتصال', 'Load connection')}</button> : <form onSubmit={(e) => { e.preventDefault(); perform(false); }}>
            <fieldset disabled={busy} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${connection.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{connection.enabled ? text('مفعّل', 'Enabled') : connection.verified_at ? text('تم التحقق • غير مفعّل', 'Verified • Disabled') : text('بانتظار الربط', 'Awaiting connection')}</span><a className="text-sm text-brand underline" href="https://docs.bosta.co/docs/how-to/get-your-api-key/" target="_blank" rel="noreferrer">{text('الحصول على مفتاح Bosta', 'Get your Bosta API key')}</a></div>
                <FormField label={text('مفتاح API', 'API key')} htmlFor="bosta-key"><input id="bosta-key" type="password" autoComplete="new-password" className={INPUT_CLASS} minLength={10} maxLength={4096} value={key} onChange={(e) => { setKey(e.target.value); setSuccess(false); }} placeholder={connection.has_api_key ? text('محفوظ • اتركه فارغًا للاحتفاظ به', 'Saved • Leave blank to keep it') : text('ألصق مفتاح حسابك', 'Paste your account key')} /></FormField>
                <p className="text-xs leading-6 text-slate-500">{text('استخدم مفتاحًا بصلاحية القراءة والكتابة. احفظ المفتاح ثم تحقق من الاتصال واختر عنوان الاستلام. تغيير المفتاح يتطلب تحققًا جديدًا.', 'Use a Read/Write key. Save it, verify the connection, then select a pickup location. Changing the key requires verification again.')}</p>
                <button type="button" className={button} disabled={!connection.has_api_key || !!key} onClick={() => perform(true)}>{busy ? text('جارٍ الاتصال…', 'Connecting…') : text('التحقق وجلب عناوين الاستلام', 'Verify and load pickup locations')}</button>
                <FormField label={text('عنوان استلام الشحنات', 'Pickup location')} htmlFor="bosta-pickup"><select id="bosta-pickup" className={INPUT_CLASS} disabled={!connection.verified_at || !!key} value={connection.pickup_location_id || ''} onChange={(e) => { setConnection({ ...connection, pickup_location_id: e.target.value }); setSuccess(false); }}><option value="">{text('اختر عنوانًا', 'Choose a location')}</option>{connection.pickup_locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></FormField>
                {connection.verified_at && !connection.pickup_locations.length ? <p className="text-sm text-amber-700">{text('أضف عنوان استلام في حساب Bosta ثم تحقق مجددًا.', 'Add a pickup location in Bosta, then verify again.')}</p> : null}
                <Toggle label={text('تفعيل إرسال الطلبات إلى Bosta', 'Enable dispatch to Bosta')} disabled={!connection.verified_at || !connection.pickup_location_id || !!key} checked={connection.enabled} onChange={(enabled) => { setConnection({ ...connection, enabled }); setSuccess(false); }} />
                <button type="submit" className={`${button} bg-brand text-white`} disabled={!connection.has_api_key && !key}>{text('حفظ اتصال Bosta', 'Save Bosta connection')}</button>
            </fieldset>
        </form>}
    </SettingsCard>;
}
