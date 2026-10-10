import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

const keyOf = (value) => value.trim().toLowerCase();
const field = 'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;

function buildAxes(rows, stored, images) {
    const axes = new Map();
    rows.forEach((row) => Object.entries(row.options || {}).forEach(([name, value]) => {
        const key = keyOf(name);
        if (!axes.has(key)) axes.set(key, { name, values: new Map() });
        axes.get(key).values.set(keyOf(value), value);
    }));
    const rank = (name) => { const index = stored.findIndex((axis) => keyOf(axis.name) === keyOf(name)); return index < 0 ? stored.length : index; };
    return Array.from(axes.values()).sort((a, b) => rank(a.name) - rank(b.name)).map((axis) => {
        const config = stored.find((item) => keyOf(item.name) === keyOf(axis.name));
        const order = [...(config?.values.map((v) => keyOf(v.value)).filter((v) => axis.values.has(v)) || []), ...axis.values.keys()];
        return { name: axis.name, type: config?.type || 'buttons', labels: config?.labels || {}, values: Array.from(new Set(order)).map((key) => {
            const item = config?.values.find((v) => keyOf(v.value) === key);
            return { value: axis.values.get(key), labels: item?.labels || {}, color: item?.color || null, media_id: images.some((image) => image.id === item?.media_id) ? item.media_id : null };
        }) };
    });
}

export default function StoreOptionDisplay({ path, rows, locales, media }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [config, setConfig] = useState(null); const [draft, setDraft] = useState(null);
    const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const inFlight = useRef(false);
    useEffect(() => {
        let active = true;
        api.get(path).then(({ data }) => { if (active) { setConfig(data.data.option_display || []); } }).catch((e) => { if (active) setError(errorText(e)); });
        return () => { active = false; };
    }, [path]);
    const images = (media || []).filter((m) => m.type === 'image');
    const axes = draft ?? buildAxes(rows, config || [], images);
    function change(index, patch) { setSaved(false); setDraft(axes.map((axis, i) => i === index ? { ...axis, ...patch } : axis)); }
    function changeValue(index, valueIndex, patch) { change(index, { values: axes[index].values.map((value, i) => i === valueIndex ? { ...value, ...patch } : value) }); }
    async function save(event) {
        event.preventDefault(); if (inFlight.current) return;
        inFlight.current = true; setBusy(true); setError(''); setSaved(false);
        try { const { data } = await api.put(path, { option_display: axes }); setConfig(data.data.option_display); setDraft(null); setSaved(true); }
        catch (e) { setError(errorText(e)); } finally { setBusy(false); inFlight.current = false; }
    }
    return <details className="rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer font-bold">{text('طريقة عرض الخصائص', 'Property display')}</summary>
        <p className="my-3 text-sm text-slate-500">{text('اختر شكل كل خاصية وترجم أسماءها. أضف الألوان والمقاسات من مولّد الخيارات، وارفع صورها في معرض المنتج أولًا.', 'Choose each property style and translate its labels. Create colors and sizes with the combination generator and upload their images to the product gallery first.')}</p>
        {error ? <p role="alert" className="text-red-700">{error}</p> : null}{saved ? <p role="status" className="text-emerald-700">{text('تم حفظ طريقة العرض.', 'Display settings saved.')}</p> : null}
        {config === null ? <p>{text('جارٍ التحميل…', 'Loading…')}</p> : !axes.length ? <p>{text('أضف خصائص إلى خيارات المنتج لبدء تخصيصها.', 'Add properties to the product variants to customize them.')}</p> : <form onSubmit={save}><fieldset disabled={busy} className="min-w-0 space-y-4">{axes.map((axis, index) => <section key={axis.name} className="space-y-3 rounded-lg bg-slate-50 p-3">
            <header className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{axis.name}</h3><div className="flex gap-2">{[-1, 1].map((offset) => <button key={offset} type="button" className={button} disabled={index + offset < 0 || index + offset >= axes.length} aria-label={`${text(offset < 0 ? 'تقديم' : 'تأخير', offset < 0 ? 'Move up' : 'Move down')} ${axis.name}`} onClick={() => { const next = [...axes]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; setDraft(next); setSaved(false); }}>{offset < 0 ? '↑' : '↓'}</button>)}</div></header>
            <div className="grid gap-3 sm:grid-cols-2"><label>{text('نوع العرض', 'Display type')} — {axis.name}<select className={field} value={axis.type} onChange={(e) => change(index, { type: e.target.value })}>{[['buttons', 'أزرار', 'Buttons'], ['color', 'ألوان', 'Colors'], ['image', 'صور', 'Images'], ['dropdown', 'قائمة منسدلة', 'Dropdown']].map(([value, a, e]) => <option key={value} value={value}>{text(a, e)}</option>)}</select></label>{locales.map((locale) => <label key={locale}>{axis.name} ({locale})<input className={field} maxLength={120} value={axis.labels[locale] || ''} placeholder={axis.name} onChange={(e) => change(index, { labels: { ...axis.labels, [locale]: e.target.value || null } })} /></label>)}</div>
            {axis.values.map((value, valueIndex) => <div key={value.value} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2"><strong className="sm:col-span-2">{value.value}</strong>{locales.map((locale) => <label key={locale}>{value.value} ({locale})<input className={field} maxLength={120} placeholder={value.value} value={value.labels[locale] || ''} onChange={(e) => changeValue(index, valueIndex, { labels: { ...value.labels, [locale]: e.target.value || null } })} /></label>)}
                {axis.type === 'color' ? <label>{text('لون', 'Color')} — {value.value}<input className={`${field} h-11`} type="color" value={value.color || '#808080'} onChange={(e) => changeValue(index, valueIndex, { color: e.target.value })} /><input className={field} aria-label={`${text('كود اللون', 'Hex color')} — ${value.value}`} type="text" dir="ltr" placeholder="#808080" pattern="#[0-9a-fA-F]{6}" maxLength={7} value={value.color || ''} onChange={(e) => changeValue(index, valueIndex, { color: e.target.value || null })} /><button type="button" className="mt-1 text-xs underline" onClick={() => changeValue(index, valueIndex, { color: null })}>{text('إزالة اللون', 'Clear color')}</button></label> : null}
                {axis.type === 'image' ? <label>{text('صورة', 'Image')} — {value.value}<select className={field} value={value.media_id || ''} onChange={(e) => changeValue(index, valueIndex, { media_id: e.target.value ? Number(e.target.value) : null })}><option value="">{text('بدون صورة', 'No image')}</option>{images.map((image) => <option key={image.id} value={image.id}>#{image.id} {image.alt}</option>)}</select>{images.find((image) => image.id === value.media_id) ? <img className="mt-2 h-16 w-16 rounded object-cover" src={images.find((image) => image.id === value.media_id).url} alt={value.value} /> : null}</label> : null}
                <div className="flex gap-2 sm:col-span-2">{[-1, 1].map((offset) => <button key={offset} className={button} type="button" disabled={valueIndex + offset < 0 || valueIndex + offset >= axis.values.length} aria-label={`${text(offset < 0 ? 'تقديم' : 'تأخير', offset < 0 ? 'Move up' : 'Move down')} ${value.value}`} onClick={() => { const values = [...axis.values]; [values[valueIndex], values[valueIndex + offset]] = [values[valueIndex + offset], values[valueIndex]]; change(index, { values }); }}>{offset < 0 ? '↑' : '↓'}</button>)}</div>
            </div>)}
        </section>)}<div className="flex gap-2"><button className={button} type="submit">{text('حفظ طريقة العرض', 'Save display settings')}</button><button className={button} type="button" onClick={() => { setDraft(null); setSaved(false); }}>{text('إلغاء التعديلات', 'Discard changes')}</button></div></fieldset></form>}
    </details>;
}
