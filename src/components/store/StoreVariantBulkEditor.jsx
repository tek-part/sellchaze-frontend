import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

const field = 'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;
const fields = [['price_override', 'سعر الصنف', 'Variant price'], ['compare_price', 'السعر قبل الخصم', 'Compare-at price'], ['cost', 'التكلفة', 'Cost'], ['weight', 'الوزن', 'Weight'], ['is_active', 'الإتاحة للبيع', 'Availability'], ['image_media_id', 'صورة الصنف', 'Variant image']];

export default function StoreVariantBulkEditor({ path, rows, media, onSaved }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [selected, setSelected] = useState([]); const [search, setSearch] = useState(''); const [changes, setChanges] = useState({});
    const [review, setReview] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(0); const inFlight = useRef(false);
    const images = (media || []).filter((item) => item.type === 'image');
    const visible = rows.filter((row) => `${row.name} ${row.sku || ''} ${Object.values(row.options || {}).join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()));
    const targets = rows.filter((row) => selected.includes(row.id));
    const change = (key, value) => { setChanges((prev) => ({ ...prev, [key]: value })); setSaved(0); };
    function prepare(event) {
        event.preventDefault(); setError(''); setSaved(0);
        setReview({ variants: targets.map((row) => ({ id: row.id, version: row.edit_version })), changes,
            names: targets.map((row) => row.name) });
    }
    async function save() {
        if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
        try { const { data } = await api.put(`${path}/bulk`, { variants: review.variants, changes: review.changes }); setSaved(data.meta.updated); setReview(null); setSelected([]); await onSaved(); }
        catch (e) { setError(errorText(e)); } finally { inFlight.current = false; setBusy(false); }
    }
    return <details className="rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer font-bold">{text('تعديل الأصناف جماعيًا', 'Bulk edit variants')}</summary>
        <p className="my-3 text-sm text-slate-500">{text('حدد الأصناف والحقول التي تريد تغييرها. المخزون والحجوزات تُدار من تعديل المخزون.', 'Select variants and the fields to change. Stock and reservations are managed through inventory adjustments.')}</p>
        {error ? <div role="alert" className="space-y-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p>{error}</p><button className={button} disabled={busy} onClick={async () => { setReview(null); setSelected([]); try { await onSaved(); setError(''); } catch (e) { setError(errorText(e)); } }}>{text('تحديث قائمة الأصناف', 'Refresh variants')}</button></div> : null}
        {saved > 0 ? <p role="status" className="text-emerald-700">{text('تم تحديث الأصناف', 'Variants updated')}: {saved}</p> : null}
        {review ? <div className="space-y-3 rounded-lg bg-emerald-50 p-4"><h3 className="font-bold">{text('مراجعة التعديلات', 'Review changes')} ({review.variants.length})</h3><p className="max-h-32 overflow-auto text-sm">{review.names.join(' · ')}</p><ul className="list-inside list-disc text-sm">{Object.entries(review.changes).map(([key, value]) => {
            const definition = fields.find(([name]) => name === key);
            const shown = key === 'is_active' ? (value ? text('متاح', 'Active') : text('مخفي', 'Hidden')) : key === 'image_media_id' ? (value ? `#${value} ${images.find((image) => image.id === value)?.alt || ''}` : text('بدون صورة مخصصة', 'No custom image')) : value ?? (key === 'price_override' ? text('استخدام سعر المنتج', 'Inherit product price') : text('مسح القيمة', 'Clear value'));
            return <li key={key}>{text(definition[1], definition[2])}: {shown}</li>;
        })}</ul><div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={save}>{text('تطبيق على الأصناف المحددة', 'Apply to selected variants')}</button><button className={button} disabled={busy} onClick={() => setReview(null)}>{text('العودة للتعديل', 'Back to editing')}</button></div></div> : <form onSubmit={prepare}><fieldset disabled={busy} className="min-w-0 space-y-3">
            <label className="block">{text('بحث الأصناف', 'Search variants')}<input className={field} value={search} onChange={(e) => setSearch(e.target.value)} /></label>
            <div className="flex flex-wrap gap-2"><button className={button} type="button" onClick={() => setSelected(Array.from(new Set([...selected, ...visible.map((row) => row.id)])))}>{text('تحديد النتائج', 'Select results')} ({visible.length})</button><button className={button} type="button" onClick={() => setSelected([])}>{text('إلغاء التحديد', 'Clear selection')}</button><span className="self-center text-sm">{text('المحدد', 'Selected')}: {targets.length}</span></div>
            <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-slate-200 p-3">{visible.map((row) => <label key={row.id} className="flex gap-3 text-sm"><input type="checkbox" checked={selected.includes(row.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, row.id] : selected.filter((id) => id !== row.id))} /><span>{row.name} · {row.sku || '—'} · {row.price_override ?? text('سعر المنتج', 'Product price')} · {row.is_active ? text('متاح', 'Active') : text('مخفي', 'Hidden')}</span></label>)}</div>
            <div className="grid gap-3 sm:grid-cols-2">{fields.map(([key, a, e]) => <div key={key} className="rounded-lg bg-slate-50 p-3"><label className="flex items-center gap-2"><input type="checkbox" checked={Object.hasOwn(changes, key)} onChange={(event) => { if (event.target.checked) change(key, key === 'is_active' ? true : null); else setChanges(Object.fromEntries(Object.entries(changes).filter(([name]) => name !== key))); }} />{text('تغيير', 'Change')} {text(a, e)}</label>
                {Object.hasOwn(changes, key) ? key === 'is_active' ? <select className={field} aria-label={text(a, e)} value={changes[key] ? 'true' : 'false'} onChange={(event) => change(key, event.target.value === 'true')}><option value="true">{text('متاح', 'Active')}</option><option value="false">{text('مخفي', 'Hidden')}</option></select> : key === 'image_media_id' ? <select className={field} aria-label={text(a, e)} value={changes[key] || ''} onChange={(event) => change(key, event.target.value ? Number(event.target.value) : null)}><option value="">{text('بدون صورة مخصصة', 'No custom image')}</option>{images.map((image) => <option key={image.id} value={image.id}>#{image.id} {image.alt}</option>)}</select> : <><input className={field} aria-label={text(a, e)} type="number" min="0" max={key === 'weight' ? '999999.999' : '999999999.99'} step={key === 'weight' ? '0.001' : '0.01'} value={changes[key] ?? ''} onChange={(event) => change(key, event.target.value === '' ? null : event.target.value)} /><p className="mt-1 text-xs text-slate-500">{key === 'price_override' ? text('اتركه فارغًا لاستخدام سعر المنتج.', 'Leave blank to inherit the product price.') : text('اتركه فارغًا لمسح القيمة.', 'Leave blank to clear the value.')}</p></> : null}
            </div>)}</div><button className={button} type="submit" disabled={!targets.length || !Object.keys(changes).length}>{text('مراجعة التعديلات', 'Review changes')}</button>
        </fieldset></form>}
    </details>;
}
