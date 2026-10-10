import { useRef, useState } from 'react';
import api from '../../api/client';

const input = 'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;

export default function StoreProductPersonalization({ path, stored = [], ar, canEdit, onSaved }) {
    const text = (a, e) => ar ? a : e;
    const [draft, setDraft] = useState(null); const fields = draft ?? stored;
    const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const inFlight = useRef(false);
    function update(next) { setDraft(next); setSaved(false); }
    function change(index, patch) { update(fields.map((field, i) => i === index ? { ...field, ...patch } : field)); }
    async function save(event) {
        event.preventDefault(); if (inFlight.current) return;
        inFlight.current = true; setBusy(true); setError(''); setSaved(false);
        try { const { data } = await api.put(path, { personalization_fields: fields }); onSaved(data.data.personalization_fields || []); setDraft(null); setSaved(true); }
        catch (e) { setError(errorText(e)); } finally { inFlight.current = false; setBusy(false); }
    }
    return <details className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-lg font-bold">{text('تخصيص المنتج بالنص والصورة', 'Customer text and image customization')}</summary>
        <p className="my-3 text-sm text-slate-500">{text('اطلب من العميل كتابة نص أو رفع صورة. تُحفظ اختياراته مع الطلب، وتشارك التخصيصات المختلفة مخزون نفس المنتج أو الخيار.', 'Ask shoppers for text or an image. Choices are saved with the order; different customizations share the same product or variant stock.')}</p>
        {error ? <p role="alert" className="text-red-700">{error}</p> : null}{saved ? <p role="status" className="text-emerald-700">{text('تم حفظ حقول التخصيص.', 'Customization fields saved.')}</p> : null}
        <form onSubmit={save}><fieldset className="min-w-0 space-y-4" disabled={!canEdit || busy}>
            {fields.map((field, index) => <section className="space-y-3 rounded-lg bg-slate-50 p-3" key={field.key}>
                <header className="flex flex-wrap items-center justify-between gap-2"><strong>{field.label || text('حقل جديد', 'New field')}</strong><div className="flex flex-wrap gap-2">{[-1, 1].map((offset) => <button type="button" className={button} key={offset} disabled={index + offset < 0 || index + offset >= fields.length} aria-label={`${text(offset < 0 ? 'تقديم' : 'تأخير', offset < 0 ? 'Move up' : 'Move down')} ${field.label}`} onClick={() => { const next = [...fields]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; update(next); }}>{offset < 0 ? '↑' : '↓'}</button>)}<button type="button" className={button} onClick={() => update(fields.filter((_, i) => i !== index))}>{text('حذف الحقل', 'Remove field')}</button></div></header>
                <div className="grid gap-3 sm:grid-cols-2"><label>{text('اسم الحقل الأساسي', 'Default field label')}<input className={input} value={field.label} required maxLength={120} onChange={(e) => change(index, { label: e.target.value })} /></label>
                    <label>{text('نوع الحقل', 'Field type')}<select className={input} value={field.type} onChange={(e) => change(index, { type: e.target.value })}><option value="text">{text('العميل يكتب نصًا', 'Customer writes text')}</option><option value="image">{text('العميل يرفع صورة', 'Customer uploads image')}</option></select></label>
                    {['ar', 'en'].map((locale) => <label key={locale}>{text('اسم الحقل', 'Field label')} ({locale})<input className={input} dir={locale === 'ar' ? 'rtl' : 'ltr'} value={field.labels?.[locale] || ''} placeholder={field.label} maxLength={120} onChange={(e) => change(index, { labels: { ...field.labels, [locale]: e.target.value || null } })} /></label>)}
                    {field.type === 'text' ? <label>{text('الحد الأقصى للحروف', 'Maximum characters')}<input className={input} type="number" min={1} max={1000} step={1} required value={field.max_length} onChange={(e) => change(index, { max_length: e.target.value === '' ? '' : Number(e.target.value) })} /></label> : <p className="text-sm text-slate-500">{text('صور JPG وPNG وWebP حتى 10 ميجابايت و4096 بكسل.', 'JPG, PNG and WebP up to 10 MB and 4096 pixels.')}</p>}
                </div><label className="flex items-center gap-2"><input type="checkbox" checked={field.required} onChange={(e) => change(index, { required: e.target.checked })} />{text('إلزامي لإكمال الطلب', 'Required to place an order')}</label>
            </section>)}
            <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={fields.length >= 10} onClick={() => update([...fields, { key: `field_${crypto.randomUUID()}`, type: 'text', label: '', labels: {}, required: true, max_length: 100 }])}>{text('إضافة حقل تخصيص', 'Add customization field')}</button><button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" type="submit">{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ حقول التخصيص', 'Save customization fields')}</button><button className={button} type="button" onClick={() => { setDraft(null); setSaved(false); setError(''); }}>{text('إلغاء التعديلات', 'Discard changes')}</button></div>
        </fieldset></form>
    </details>;
}
