import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

const field = 'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40';

export default function StoreVariantGenerator({ path, onSaved }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [open, setOpen] = useState(false); const [axes, setAxes] = useState([{ name: '', values: '' }]);
    const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState(null); const inFlight = useRef(false);
    const parsed = axes.map((axis) => ({ name: axis.name.trim(), values: axis.values.split(/[,،\n]/).map((value) => value.trim()).filter(Boolean) }));
    const count = parsed.reduce((total, axis) => total * axis.values.length, 1);
    const valid = count > 0 && count <= 200 && parsed.every((axis) => axis.name && !/^\d+$/.test(axis.name) && axis.values.length <= 50 && axis.values.every((value) => value.length <= 120) && new Set(axis.values.map((value) => value.toLowerCase())).size === axis.values.length) && new Set(parsed.map((axis) => axis.name.toLowerCase())).size === parsed.length;
    const preview = valid ? parsed.reduce((combinations, axis) => combinations.flatMap((values) => axis.values.map((value) => [...values, value])), [[]]) : [];
    async function generate(event) {
        event.preventDefault(); if (!valid || inFlight.current) return;
        inFlight.current = true; setBusy(true); setError(''); setResult(null);
        try { const { data } = await api.post(`${path}/generate`, { axes: parsed }); setResult(data.meta); await onSaved(); }
        catch (e) { setError(Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message); }
        finally { inFlight.current = false; setBusy(false); }
    }
    return <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <button type="button" className={button} aria-expanded={open} disabled={busy} onClick={() => setOpen(!open)}>{text('توليد تركيبات اللون والمقاس', 'Generate property combinations')}</button>
        {open ? <form onSubmit={generate} className="space-y-4"><fieldset disabled={busy} className="min-w-0 space-y-4">
            <p className="text-sm text-slate-600">{text('أضف الخصائص وقيمها، وسننشئ التركيبات الناقصة فقط مع الاحتفاظ بالخيارات الموجودة. لكل خيار جديد مخزون متتبّع يبدأ بصفر؛ حدّثه قبل البيع.', 'Add properties and values to create only missing combinations. Existing options stay intact. New options start with tracked stock of zero; allocate inventory before selling.')}</p>
            {axes.map((axis, index) => <div key={index} className="grid min-w-0 gap-3 sm:grid-cols-[1fr_2fr_auto]"><label className="text-sm">{text('اسم الخاصية', 'Property name')} {index + 1}<input className={field} required maxLength={80} value={axis.name} placeholder={text('اللون أو المقاس', 'Color or size')} onChange={(e) => { setResult(null); setAxes(axes.map((row, i) => i === index ? { ...row, name: e.target.value } : row)); }} /></label><label className="text-sm">{text('القيم المفصولة بفاصلة أو سطر', 'Values separated by commas or new lines')} {index + 1}<textarea className={field} rows={2} required value={axis.values} placeholder={text('أزرق، أحمر', 'Blue, Red')} onChange={(e) => { setResult(null); setAxes(axes.map((row, i) => i === index ? { ...row, values: e.target.value } : row)); }} /></label><button className={button} type="button" disabled={axes.length === 1} aria-label={`${text('إزالة الخاصية', 'Remove property')} ${index + 1}`} onClick={() => { setResult(null); setAxes(axes.filter((_, i) => i !== index)); }}>×</button></div>)}
            <button type="button" className={button} disabled={axes.length >= 5} onClick={() => setAxes([...axes, { name: '', values: '' }])}>{text('إضافة خاصية للتركيبات', 'Add combination property')}</button>
            <p className="text-sm" role="status">{text('عدد التركيبات', 'Combinations')}: {count} / 200</p>
            {count > 200 ? <p className="text-sm text-red-700">{text('قلّل عدد القيم لتوليد 200 تركيبة كحد أقصى.', 'Reduce the values to generate at most 200 combinations.')}</p> : null}
            {preview.length ? <details className="text-sm"><summary className="cursor-pointer">{text('معاينة التركيبات', 'Preview combinations')}</summary><ul className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-slate-50 p-3">{preview.map((values, index) => <li key={index}>{values.join(' / ')}</li>)}</ul></details> : null}
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-40" disabled={!valid}>{busy ? text('جارٍ التوليد…', 'Generating…') : text('إنشاء التركيبات الناقصة', 'Create missing combinations')}</button>
        </fieldset>{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}{result ? <p role="status" className="text-sm text-emerald-700">{text('تم إنشاء', 'Created')}: {result.created} · {text('موجودة مسبقًا', 'Already present')}: {result.existing}</p> : null}</form> : null}
    </div>;
}
