import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import useStoreContext from '../../../hooks/useStoreContext';
import { useDirty } from '../../../hooks/useStoreSettings';

const input = 'mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900';
const message = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

export default function StoreOrderLimitsPage() {
    const context = useStoreContext();
    return <OrderLimitsEditor key={context.apiBase} context={context} />;
}

function OrderLimitsEditor({ context: { apiBase, uiBase, access, store } }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [settings, setSettings] = useState(null);
    const [initial, setInitial] = useState(null);
    const [countries, setCountries] = useState([]);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);
    const [conflict, setConflict] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const working = useRef(false);
    const dirty = useDirty(initial, settings);
    const apply = (data) => { setSettings(data.data); setInitial(data.data); setCountries(data.phone_countries); setConflict(false); };
    useEffect(() => {
        let active = true;
        if (!access?.canStoreSettings) return undefined;
        api.get(`${apiBase}/order-limits`).then(({ data }) => { if (active) apply(data); }).catch((e) => { if (active) setError(message(e)); });
        return () => { active = false; };
    }, [apiBase, access?.canStoreSettings, attempt]);
    if (!access?.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const regionNames = new Intl.DisplayNames([ar ? 'ar' : 'en'], { type: 'region' });
    const update = (key, value) => { setSettings((current) => ({ ...current, [key]: value })); setError(''); setSaved(false); };
    async function save(event) {
        event.preventDefault();
        if (working.current) return;
        working.current = true; setBusy(true); setError(''); setSaved(false);
        try {
            const { data } = await api.put(`${apiBase}/order-limits`, { ...settings, minimum_order_amount: settings.minimum_order_amount === '' ? null : settings.minimum_order_amount, max_product_quantity: Number(settings.max_product_quantity), max_orders_per_phone_24h: Number(settings.max_orders_per_phone_24h) });
            apply(data); setSaved(true);
        } catch (e) { const changed = e.response?.status === 409; setConflict(changed); setError(changed ? text('تغيرت حدود الطلبات في جلسة أخرى. أعد تحميل الإعدادات قبل الحفظ.', 'Order limits changed in another session. Reload the settings before saving.') : message(e)); }
        finally { working.current = false; setBusy(false); }
    }
    return <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader title={text('حدود الطلبات', 'Order limits')} subtitle={text('حدد الحد الأدنى لقيمة الطلب وكمية المنتج وعدد الطلبات لكل هاتف.', 'Set the minimum order amount, product quantities and orders per phone.')} />
        {conflict ? <button className="rounded-lg border border-slate-200 px-4 py-2 font-semibold" onClick={() => { setSettings(null); setInitial(null); setError(''); setSaved(false); setAttempt((n) => n + 1); }}>{text('تحميل الإعدادات الحالية', 'Reload current settings')}</button> : null}
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}{!settings ? <button className="mx-2 underline" onClick={() => { setError(''); setAttempt((n) => n + 1); }}>{text('إعادة المحاولة', 'Retry')}</button> : null}</p> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{text('تم حفظ حدود الطلبات.', 'Order limits saved.')}</p> : null}
        {!settings && !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {settings ? <form onSubmit={save} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <fieldset disabled={busy} className="space-y-6">
                <label className="block text-sm font-semibold">{text('الحد الأدنى لقيمة الطلب', 'Minimum order amount')} ({store?.currency || 'USD'})
                    <input className={input} type="number" inputMode="decimal" min={0} max="9999999999.99" step="0.01" value={settings.minimum_order_amount ?? '0.00'} onChange={(event) => update('minimum_order_amount', event.target.value)} aria-describedby="minimum-order-help" />
                    <span id="minimum-order-help" className="mt-2 block font-normal leading-6 text-slate-500 dark:text-slate-300">{text('قيمة المنتجات بعد الخصم، بدون الشحن والضريبة. ينطبق على السلة والطلبات المباشرة والمنتجات الرقمية. أدخل 0 أو اتركه فارغًا لتعطيل الحد.', 'Product total after discounts, excluding shipping and tax. Applies to cart, direct and digital orders. Enter 0 or leave blank to disable.')}</span>
                </label>
                <label className="block text-sm font-semibold">{text('أقصى عدد قطع من المنتج الواحد في الطلب', 'Maximum units of one product per order')}
                    <input className={input} type="number" inputMode="numeric" min={0} max={100000} step={1} required value={settings.max_product_quantity} onChange={(event) => update('max_product_quantity', event.target.value)} aria-describedby="product-limit-help" />
                    <span id="product-limit-help" className="mt-2 block font-normal leading-6 text-slate-500">{text('يجمع الحد كل ألوان ومقاسات وتخصيصات المنتج نفسه. أدخل 0 لتعطيل الحد.', 'The limit combines all variants and customizations of the same product. Enter 0 to disable this limit.')}</span>
                </label>
                <label className="block text-sm font-semibold">{text('أقصى عدد طلبات لرقم الهاتف خلال 24 ساعة', 'Maximum orders per phone in 24 hours')}
                    <input className={input} type="number" inputMode="numeric" min={0} max={100000} step={1} required value={settings.max_orders_per_phone_24h} onChange={(event) => update('max_orders_per_phone_24h', event.target.value)} aria-describedby="phone-limit-help" />
                    <span id="phone-limit-help" className="mt-2 block font-normal leading-6 text-slate-500">{text('يحسب الطلبات المنشأة في متجرك خلال آخر 24 ساعة، بما فيها الملغاة. إعادة محاولة الطلب نفسه لا تُحتسب طلبًا جديدًا. أدخل 0 لتعطيل الحد.', 'Counts orders created in your store during the last 24 hours, including cancelled orders. Replaying the same checkout does not create another order. Enter 0 to disable this limit.')}</span>
                </label>
                <label className="block text-sm font-semibold">{text('دولة أرقام الهاتف المحلية', 'Country for local phone numbers')}
                    <select className={input} value={settings.phone_country} onChange={(event) => update('phone_country', event.target.value)} aria-describedby="phone-country-help">
                        {countries.map((code) => ({ code, name: regionNames.of(code) || code })).sort((a, b) => a.name.localeCompare(b.name, ar ? 'ar' : 'en')).map(({ code, name }) => <option key={code} value={code}>{name} ({code})</option>)}
                    </select>
                    <span id="phone-country-help" className="mt-2 block font-normal leading-6 text-slate-500">{text('مثال مصر: 01001234567 و‎+201001234567 يُحسبان كرقم واحد. الأرقام الدولية تُفسر بكود دولتها. تفعيل حد الهاتف يجعله مطلوبًا حتى للطلبات الرقمية.', 'For Egypt, 01001234567 and +201001234567 count as one number. International numbers use their own country code. Enabling the phone limit makes a phone number required, including for digital orders.')}</span>
                </label>
            </fieldset>
            <button disabled={busy || conflict || !dirty} className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:opacity-40">{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ حدود الطلبات', 'Save order limits')}</button>
        </form> : null}
    </div>;
}
