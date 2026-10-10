import { useRef, useState } from 'react';
import api from '../../api/client';

const input = 'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
export function DigitalProductFields({ value, onChange, locked = false, available, sales = 0, ar }) {
    const text = (a, e) => ar ? a : e;
    const update = (patch) => onChange({ ...value, ...patch });
    return <div className="min-w-0 space-y-3">
        <label className="block">{text('نوع تسليم المنتج', 'Product delivery type')}<select className={input} value={value.type} disabled={locked} onChange={(e) => update({ type: e.target.value, url: '', codes: '' })}><option value="physical">{text('منتج عادي', 'Physical product')}</option><option value="link">{text('منتج رقمي — رابط', 'Digital product — shared link')}</option><option value="codes">{text('منتج رقمي — أكواد', 'Digital product — unique codes')}</option></select></label>
        <p className="text-sm text-slate-500">{text('يُحدد النوع عند إنشاء المنتج ولا يمكن تغييره بعد الحفظ. يظهر الرابط أو الكود للعميل بعد تأكيد الدفع.', 'Choose the type when creating the product. It cannot change after saving. Links and codes become available after payment is confirmed.')}</p>
        {value.type !== 'physical' ? <p>{text('الوحدات المباعة في الطلبات المدفوعة', 'Units sold in paid orders')}: {sales}</p> : null}
        {value.type === 'link' ? <label className="block">{text('رابط التسليم الرقمي', 'Digital delivery link')}<input className={input} type="url" dir="ltr" required maxLength={2000} value={value.url} onChange={(e) => update({ url: e.target.value })} /><small className="text-slate-500">{text('نفس الرابط لجميع المشترين. تحتفظ الطلبات السابقة بالرابط الأصلي.', 'The same link is delivered to every buyer. Previous orders keep their original link.')}</small></label> : null}
        {value.type === 'codes' ? <><p>{text('الأكواد المتاحة', 'Available codes')}: {available ?? 0}</p><label className="block">{text('إضافة أكواد جديدة — كود في كل سطر', 'Add new codes — one per line')}<textarea className={input} dir="ltr" rows={5} value={value.codes} onChange={(e) => update({ codes: e.target.value })} /><small className="text-slate-500">{text('حتى 1000 كود في الحفظ الواحد. يُحجز كود لكل وحدة مطلوبة. لا تُقبل الأكواد المتكررة.', 'Up to 1000 codes per save. One code is reserved for each ordered unit. Duplicate codes are rejected.')}</small></label></> : null}
    </div>;
}

export function digitalPayload(value) {
    return { digital_type: value.type, ...(value.type === 'link' ? { digital_url: value.url } : {}), ...(value.type === 'codes' ? { digital_codes: value.codes.split(/\r?\n/).map((code) => code.trim()).filter(Boolean) } : {}) };
}

export default function StoreProductDigital({ product, path, ar, canEdit, onSaved }) {
    const [value, setValue] = useState({ type: product.digital_type || 'physical', url: product.digital_url || '', codes: '' });
    const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const inFlight = useRef(false);
    const text = (a, e) => ar ? a : e;
    async function save(event) {
        event.preventDefault(); if (inFlight.current || !canEdit) return;
        inFlight.current = true; setBusy(true); setError(''); setSaved(false);
        try { const { data } = await api.put(path, digitalPayload(value)); onSaved(data.data); setValue((current) => ({ ...current, codes: '' })); setSaved(true); }
        catch (e) { const message = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message; setError(message.includes('A code already exists for this product.') ? text('هذا الكود موجود بالفعل لهذا المنتج. لم تتم إضافة أي أكواد.', 'A code already exists for this product. No codes were added.') : message); }
        finally { inFlight.current = false; setBusy(false); }
    }
    return <details className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-lg font-bold">{text('المنتجات الرقمية', 'Digital products')}</summary><form onSubmit={save} className="mt-4"><fieldset disabled={!canEdit || busy} className="min-w-0 space-y-3"><DigitalProductFields value={value} onChange={(next) => { setValue(next); setSaved(false); }} locked available={product.digital_codes_available} sales={product.digital_sales} ar={ar} />{error ? <p role="alert" className="text-red-700">{error}</p> : null}{saved ? <p role="status" className="text-emerald-700">{text('تم حفظ إعدادات المنتج الرقمي.', 'Digital product settings saved.')}</p> : null}{value.type !== 'physical' ? <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ التسليم الرقمي', 'Save digital delivery')}</button> : null}</fieldset></form></details>;
}
