import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import SettingsCard from '../ui/SettingsCard';
import FormField, { INPUT_CLASS } from '../ui/FormField';

const button = 'rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;
const states = { 10: ['بانتظار الاستلام', 'Pickup requested'], 21: ['تم الاستلام من المتجر', 'Picked up'], 24: ['في المخزن', 'In warehouse'], 30: ['قيد النقل', 'In transit'], 41: ['خرجت للتوصيل', 'Out for delivery'], 45: ['تم التسليم', 'Delivered'], 46: ['مرتجعة للمتجر', 'Returned'], 47: ['مشكلة في التوصيل', 'Delivery exception'], 48: ['أُنهِيت', 'Terminated'], 49: ['أُلغيت', 'Cancelled'], 100: ['مفقودة', 'Lost'], 101: ['تالفة', 'Damaged'] };

export default function StoreOrderShipment({ order, apiBase, uiBase, onOrderUpdated }) {
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [shipment, setShipment] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [catalogBusy, setCatalogBusy] = useState(false);
    const [catalogAttempt, setCatalogAttempt] = useState(0);
    const [catalogError, setCatalogError] = useState('');
    const [tracking, setTracking] = useState('');
    const [paperSize, setPaperSize] = useState('A4');
    const [labelBusy, setLabelBusy] = useState(false);
    const [labelSaved, setLabelSaved] = useState(false);
    const [form, setForm] = useState({ city_id: '', district_id: '', address_line: [order.shipping_address?.line1, order.shipping_address?.line2].filter(Boolean).join(', '), package_size: 'MEDIUM', description: (order.items || []).map((item) => `${item.name} × ${item.quantity}`).join(', ').slice(0, 500), notes: '' });
    const working = useRef(false);
    const lastRevision = useRef(null);
    const endpoint = `${apiBase}/orders/${order.id}/shipment`;
    const load = useCallback(async () => {
        const { data } = await api.get(endpoint);
        setShipment(data.data); setLoaded(true);
        const revision = data.data?.carrier_revision ?? 0;
        if (lastRevision.current !== null && lastRevision.current !== revision) onOrderUpdated?.();
        lastRevision.current = revision;
    }, [endpoint, onOrderUpdated]);
    useEffect(() => { load().catch((e) => setError(errorText(e))); }, [load]);
    useEffect(() => {
        if (!shipment?.webhook_configured || shipment.status !== 'created' || [45, 46, 48, 49, 60, 100, 101].includes(shipment.carrier_state)) return undefined;
        const timer = setInterval(() => { if (document.visibilityState === 'visible' && !working.current) load().catch(() => {}); }, 30000);
        return () => clearInterval(timer);
    }, [load, shipment?.webhook_configured, shipment?.status, shipment?.carrier_state]);
    useEffect(() => {
        if (!editing) return undefined;
        let active = true; setCatalogBusy(true); setCatalogError('');
        const request = form.city_id ? api.get(`${apiBase}/carriers/bosta/districts`, { params: { city_id: form.city_id } }) : api.get(`${apiBase}/carriers/bosta/cities`);
        request.then(({ data }) => { if (active) { if (form.city_id) setDistricts(data.data); else setCities(data.data); } })
            .catch((e) => { if (active) setCatalogError(errorText(e)); }).finally(() => { if (active) setCatalogBusy(false); });
        return () => { active = false; };
    }, [apiBase, editing, form.city_id, catalogAttempt]);
    async function submit(sync) {
        if (working.current) return;
        working.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.post(sync ? `${endpoint}/sync` : endpoint, sync ? { tracking_number: tracking || undefined } : form);
            setShipment(data.data); setEditing(false); setTracking('');
            lastRevision.current = data.data?.carrier_revision ?? 0;
            onOrderUpdated?.();
        } catch (e) {
            setError(errorText(e));
            // Always reload the durable claim: even a lost HTTP response may have created a shipment.
            if (!sync) { setLoaded(false); setEditing(false); try { await load(); } catch { /* Retry reload stays visible; dispatch stays disabled. */ } }
        } finally { working.current = false; setBusy(false); }
    }
    async function downloadLabel() {
        if (working.current) return;
        working.current = true; setLabelBusy(true); setLabelSaved(false); setError('');
        try {
            const { data } = await api.post(`${endpoint}/label`, { size: paperSize, language: ar ? 'ar' : 'en' }, { responseType: 'blob' });
            const url = URL.createObjectURL(data);
            const link = document.createElement('a'); link.href = url; link.download = `bosta-${shipment.tracking_number}.pdf`;
            document.body.appendChild(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000); setLabelSaved(true);
        } catch (e) {
            let message = errorText(e);
            if (e.response?.data instanceof Blob) { try { const response = JSON.parse(await e.response.data.text()); message = response.message || message; } catch { /* Keep the original transport error. */ } }
            setError(message);
        } finally { working.current = false; setLabelBusy(false); }
    }
    const uncertain = shipment && ['unknown', 'submitting'].includes(shipment.status);
    const canCreate = loaded && (!shipment || shipment.status === 'rejected');
    const paymentReady = order.payment_status === 'paid' || (order.payment_method === 'cod' && ['pending', 'unpaid'].includes(order.payment_status));
    const eligible = paymentReady && order.currency === 'EGP' && order.shipping_address?.country === 'EG' && ['confirmed', 'processing'].includes(order.status);
    const field = (name, title, props = {}) => <FormField label={title} htmlFor={`shipment-${name}`}><input id={`shipment-${name}`} className={INPUT_CLASS} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} {...props} /></FormField>;
    return <SettingsCard title={text('شحنة الطلب • Bosta', 'Order shipment • Bosta')} actions={<Link className="text-sm text-brand underline" to={`${uiBase}/settings/shipping`}>{text('إعدادات الربط', 'Connection settings')}</Link>}>
        <div className="space-y-4">
            {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            {!loaded ? <button type="button" className={button} disabled={busy} onClick={() => { setError(''); load().catch((e) => setError(errorText(e))); }}>{text('تحميل حالة الشحن', 'Load shipping status')}</button> : null}
            {shipment ? <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm"><p className="font-semibold">{shipment.status === 'rejected' ? text('رفضت الشركة طلب الشحن', 'Carrier rejected the request') : uncertain ? text('نتيجة الإرسال غير مؤكدة', 'Dispatch result is unconfirmed') : states[shipment.carrier_state] ? states[shipment.carrier_state][ar ? 0 : 1] : shipment.carrier_state_label || text('تم إنشاء الشحنة', 'Shipment created')}</p><p>{text('مرجع الشحنة', 'Shipment reference')}: <bdi className="break-all font-mono text-xs">{shipment.business_reference}</bdi></p>{shipment.tracking_number ? <p>{text('رقم التتبع', 'Tracking number')}: <bdi className="font-mono">{shipment.tracking_number}</bdi></p> : null}{shipment.synced_at ? <p className="text-xs text-slate-500">{text('آخر تحديث', 'Last updated')}: {new Date(shipment.synced_at).toLocaleString(ar ? 'ar-EG' : 'en-GB')}</p> : null}</div> : null}
            {uncertain ? <p className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">{text('قد تكون الشحنة أُنشئت بالفعل. ابحث عن مرجعها في لوحة Bosta وأدخل رقم التتبع لمطابقتها. لن يُعاد إرسال الطلب تلقائيًا.', 'The shipment may already exist. Find its reference in Bosta and enter its tracking number to reconcile it. Dispatch will not be retried automatically.')}</p> : null}
            {shipment ? <p className="text-xs text-slate-500">{shipment.webhook_configured ? text('التحديث التلقائي مفعّل لهذه الشحنة. تتحدث الصفحة أثناء فتحها.', 'Automatic carrier updates are enabled for this shipment. This page refreshes while open.') : text('تحديث يدوي لهذه الشحنة.', 'Manual updates for this shipment.')}</p> : null}
            {shipment?.status === 'created' && shipment.tracking_number && ![45, 46, 48, 49, 60, 100, 101].includes(shipment.carrier_state) ? <div className="flex flex-wrap items-end gap-3"><FormField label={text('مقاس البوليصة', 'Label paper size')} htmlFor="shipment-paper"><select id="shipment-paper" className={INPUT_CLASS} value={paperSize} onChange={(e) => setPaperSize(e.target.value)}><option value="A4">A4</option><option value="A6">A6</option></select></FormField><button type="button" className={button} disabled={busy || labelBusy} onClick={downloadLabel}>{labelBusy ? text('جارٍ تجهيز البوليصة…', 'Preparing label…') : text('تنزيل بوليصة PDF', 'Download PDF label')}</button>{labelSaved ? <p role="status" className="text-sm text-emerald-700">{text('تم تجهيز الملف للتنزيل.', 'The file is ready to download.')}</p> : null}</div> : null}
            {shipment?.events?.length ? <details className="rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-semibold">{text('سجل تحديثات الشحنة', 'Shipment update history')}</summary><ol className="mt-3 space-y-3">{shipment.events.map((event) => <li key={event.id} className="border-s-2 border-emerald-100 ps-3 text-sm"><p>{states[event.carrier_state] ? states[event.carrier_state][ar ? 0 : 1] : event.state_label}<span className="ms-2 text-xs text-slate-500">{event.source === 'webhook' ? text('إشعار تلقائي', 'Automatic update') : text('تحديث من الشركة', 'Carrier response')}</span></p><p className="text-xs text-slate-500">{new Date(event.carrier_time_ms || event.created_at).toLocaleString(ar ? 'ar-EG' : 'en-GB')}{!event.applied ? ` · ${text('تم تجاهله للحفاظ على الحالة الأحدث', 'Ignored to preserve the latest state')}` : ''}</p></li>)}</ol></details> : null}
            {shipment && shipment.status !== 'rejected' ? <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); submit(true); }}>{!shipment.tracking_number ? <FormField label={text('رقم التتبع من Bosta', 'Tracking number from Bosta')} htmlFor="reconcile-tracking"><input id="reconcile-tracking" className={INPUT_CLASS} value={tracking} onChange={(e) => setTracking(e.target.value)} required pattern="[0-9]{1,30}" inputMode="numeric" /></FormField> : null}<button type="submit" className={button} disabled={busy}>{text('تحديث حالة الشحنة', 'Refresh shipment status')}</button></form> : null}
            {canCreate && !editing ? <><p className="text-sm text-slate-500">{eligible ? text('سيُرسل عنوان العميل وهاتفه وبيانات الطرد إلى شركة الشحن.', 'The customer address, phone and package details will be sent to the carrier.') : text('أكد الطلب أولًا. الربط يدعم طلبات مصر بالجنيه المصري في حالة مؤكّد أو قيد التجهيز.', 'Confirm the order first. This connection supports confirmed or processing Egyptian orders in EGP.')}</p><button type="button" className={`${button} bg-brand text-white`} disabled={!eligible || busy} onClick={() => { setError(''); setEditing(true); }}>{text('تجهيز الشحنة', 'Prepare shipment')}</button></> : null}
            {canCreate && editing ? <form onSubmit={(e) => { e.preventDefault(); submit(false); }}><fieldset disabled={busy} className="space-y-4">
                {catalogError ? <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{catalogError}<button type="button" className={`${button} ms-3`} disabled={catalogBusy} onClick={() => setCatalogAttempt((n) => n + 1)}>{text('إعادة تحميل المناطق', 'Retry delivery areas')}</button></div> : null}
                <div className="grid gap-4 sm:grid-cols-2"><FormField label={text('مدينة Bosta', 'Bosta city')} htmlFor="shipment-city"><select id="shipment-city" className={INPUT_CLASS} required value={form.city_id} onChange={(e) => { setDistricts([]); setForm({ ...form, city_id: e.target.value, district_id: '' }); }}><option value="">{text('اختر المدينة', 'Choose city')}</option>{cities.map((city) => <option key={city.id} value={city.id}>{ar ? city.name_ar : city.name}</option>)}</select></FormField><FormField label={text('منطقة التوصيل', 'Delivery district')} htmlFor="shipment-district"><select id="shipment-district" className={INPUT_CLASS} required disabled={!form.city_id || catalogBusy} value={form.district_id} onChange={(e) => setForm({ ...form, district_id: e.target.value })}><option value="">{text('اختر المنطقة', 'Choose district')}</option>{districts.map((district) => <option key={district.id} value={district.id}>{ar ? district.name_ar : district.name}</option>)}</select></FormField></div>
                {catalogBusy ? <p role="status" className="text-sm text-slate-500">{text('جارٍ تحميل المناطق…', 'Loading delivery areas…')}</p> : null}
                {field('address_line', text('العنوان التفصيلي للشحنة', 'Full delivery address'), { required: true, minLength: 6, maxLength: 500 })}
                {field('description', text('وصف محتويات الطرد', 'Package description'), { required: true, maxLength: 500 })}
                <FormField label={text('حجم الطرد', 'Package size')} htmlFor="shipment-size"><select id="shipment-size" className={INPUT_CLASS} value={form.package_size} onChange={(e) => setForm({ ...form, package_size: e.target.value })}>{[['SMALL', 'صغير', 'Small'], ['MEDIUM', 'متوسط', 'Medium'], ['LARGE', 'كبير', 'Large']].map(([value, a, en]) => <option key={value} value={value}>{text(a, en)}</option>)}</select></FormField>
                {field('notes', text('تعليمات التسليم (اختياري)', 'Delivery instructions (optional)'), { maxLength: 500 })}
                <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{text('المبلغ المطلوب تحصيله', 'Cash to collect')}: <bdi>EGP {order.payment_status === 'paid' ? '0.00' : order.grand_total}</bdi></p>
                <div className="flex gap-3"><button type="submit" className={`${button} bg-brand text-white`} disabled={catalogBusy || !form.district_id}>{busy ? text('جارٍ الإرسال…', 'Dispatching…') : text('إنشاء الشحنة لدى Bosta', 'Create shipment with Bosta')}</button><button type="button" className={button} onClick={() => setEditing(false)}>{text('إلغاء', 'Cancel')}</button></div>
            </fieldset></form> : null}
        </div>
    </SettingsCard>;
}
