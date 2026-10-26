import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import SettingsCard from '../ui/SettingsCard';
import FormField, { INPUT_CLASS } from '../ui/FormField';
import Toggle from '../ui/Toggle';
import { countryOptions } from '../../apps/storefront/utils/countries';

const button = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40';
const primary = 'rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-40';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;
const blankName = () => ({ ar: '', en: '' });
const localKey = () => crypto.randomUUID();
const money = (value) => (value === '' || value === null || value === undefined ? null : String(value));
const grams = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

/** Editor state for one rate; `_key` is only a React key and never leaves the browser. */
const draftRate = (rate = {}) => ({
    _key: rate.id || localKey(), id: rate.id ?? null, name: rate.name ?? blankName(), type: rate.type ?? 'flat',
    min_subtotal: rate.min_subtotal ?? '', max_subtotal: rate.max_subtotal ?? '', min_weight_grams: rate.min_weight_grams ?? '', max_weight_grams: rate.max_weight_grams ?? '',
    price: rate.price ?? '', free_over: rate.free_over ?? '', cod_fee: rate.cod_fee ?? '', delivery_time: rate.delivery_time ?? blankName(), enabled: rate.enabled ?? true,
});
const draftZone = (zone) => ({ id: zone?.id ?? null, name: zone?.name ?? blankName(), countries: zone?.countries ?? [], regions: zone?.regions ?? [], enabled: zone?.enabled ?? true, rates: (zone?.rates?.length ? zone.rates : [{}]).map(draftRate) });

/** Exactly what the API stores: band fields only for their rate type. */
export const zoneBody = (zone) => ({
    name: zone.name, countries: zone.countries, regions: zone.regions.map(({ id, name, country }) => ({ id, name, country })), enabled: zone.enabled,
    rates: zone.rates.map((rate) => ({
        ...(rate.id ? { id: rate.id } : {}), name: rate.name, type: rate.type,
        min_subtotal: rate.type === 'price' ? money(rate.min_subtotal) ?? '0' : null, max_subtotal: rate.type === 'price' ? money(rate.max_subtotal) : null,
        min_weight_grams: rate.type === 'weight' ? grams(rate.min_weight_grams) ?? 0 : null, max_weight_grams: rate.type === 'weight' ? grams(rate.max_weight_grams) : null,
        price: money(rate.price) ?? '0', free_over: money(rate.free_over), delivery_time: rate.delivery_time, cod_fee: money(rate.cod_fee), enabled: rate.enabled,
    })),
});

export default function StoreShippingZones({ apiBase, currency, reloadKey }) {
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar');
    const lang = ar ? 'ar' : 'en';
    const text = (a, e) => (ar ? a : e);
    const countryNames = useMemo(() => new Map(countryOptions(lang).map((row) => [row.value, row.label])), [lang]);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [editing, setEditing] = useState(null);
    const [notice, setNotice] = useState(null);
    const [confirming, setConfirming] = useState(null);
    const busy = useRef(false);
    useEffect(() => {
        let active = true;
        setError('');
        api.get(`${apiBase}/shipping/zones`).then(({ data: body }) => { if (active) setData(body.data); }).catch((e) => { if (active) setError(errorText(e)); });
        return () => { active = false; };
    }, [apiBase, attempt, reloadKey]);
    const reload = () => setAttempt((n) => n + 1);
    const remove = async (zone) => {
        if (busy.current) return;
        busy.current = true; setError('');
        try { await api.delete(`${apiBase}/shipping/zones/${zone.id}`); setConfirming(null); setNotice({ kind: 'saved', text: text('تم حذف المنطقة.', 'Zone deleted.') }); reload(); }
        catch (e) { setError(errorText(e)); }
        finally { busy.current = false; }
    };
    const regionsFor = (country) => [...(data?.zones ?? []).flatMap((zone) => zone.regions), ...(data?.legacy_zone?.regions ?? [])].filter((region) => region.country === country);
    const allRegions = [...(data?.zones ?? []).flatMap((zone) => zone.regions), ...(data?.legacy_zone?.regions ?? [])];
    const amount = (value) => `${Number(value ?? 0).toFixed(2)} ${currency || ''}`.trim();
    const legacy = data?.legacy_zone;

    return <div className="space-y-5" data-shipping-zones>
        <SettingsCard title={text('مناطق الشحن', 'Shipping zones')}
            description={text('حدّد الدول والمحافظات التي تشحن إليها، وأسعارًا ثابتة أو حسب قيمة الطلب أو الوزن.', 'Choose the countries and governorates you ship to, with flat, order-price or weight-based rates.')}
            actions={!editing && data ? <button type="button" className={primary} onClick={() => { setNotice(null); setEditing(draftZone()); }}>+ {text('إضافة منطقة', 'Add zone')}</button> : null}>
            {error ? <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error} {!data ? <button type="button" className={button} onClick={reload}>{text('إعادة المحاولة', 'Retry')}</button> : null}</div> : null}
            {notice ? <div role="status" className={`mb-4 rounded-xl p-4 text-sm ${notice.kind === 'warning' ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-800'}`}>{notice.text}</div> : null}
            {!data && !error ? <p role="status">{text('جارٍ تحميل مناطق الشحن…', 'Loading shipping zones…')}</p> : null}
            {data && editing ? <ZoneEditor key={editing.id || 'new'} apiBase={apiBase} initial={editing} currency={currency} text={text} lang={lang} countryNames={countryNames}
                onCancel={() => setEditing(null)} onSaved={(saved, warnings) => {
                    setEditing(null); reload();
                    const names = new Map(saved.rates.map((rate) => [rate.id, rate.name[lang] || rate.name.en]));
                    setNotice(warnings?.length
                        ? { kind: 'warning', text: `${text('تم حفظ المنطقة.', 'Zone saved.')} ${warnings.map((w) => text(`نطاقات ${w.band === 'weight' ? 'الوزن' : 'قيمة الطلب'} في «${names.get(w.rates[0])}» و«${names.get(w.rates[1])}» متداخلة؛ سيرى العميل السعرين.`, `“${names.get(w.rates[0])}” and “${names.get(w.rates[1])}” have overlapping ${w.band === 'weight' ? 'weight' : 'order price'} bands; shoppers will see both.`)).join(' ')}` }
                        : { kind: 'saved', text: text('تم حفظ المنطقة.', 'Zone saved.') });
                }} /> : null}
            {data && !editing ? <div className="space-y-3">
                <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{data.mode === 'zones'
                    ? text('الدفع يستخدم المناطق أدناه. تعود الإعدادات البسيطة بالأعلى للعمل إذا أوقفت كل المناطق.', 'Checkout uses the zones below. The simple settings above apply again if you turn off every zone.')
                    : text('الدفع يستخدم الإعدادات الحالية بالأعلى كمنطقة افتراضية. أضف منطقة لتحديد الأسعار حسب الدولة أو المحافظة أو قيمة الطلب أو الوزن.', 'Checkout uses your current settings above as the default zone. Add a zone to price by country, governorate, order value or weight.')}</p>
                {legacy ? <article aria-label={text('المنطقة الافتراضية', 'Default zone')} className="rounded-xl border border-dashed border-slate-300 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-slate-900">{text('المنطقة الافتراضية (الإعدادات الحالية)', 'Default zone (current settings)')}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${data.mode === 'legacy' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{data.mode === 'legacy' ? text('مستخدمة الآن', 'In use') : text('غير مستخدمة', 'Not in use')}</span></div>
                    <p className="mt-1 text-sm text-slate-500">{!legacy.shipping_enabled ? text('الشحن متوقف.', 'Shipping is turned off.') : [
                        legacy.countries.length ? legacy.countries.map((code) => countryNames.get(code) || code).join('، ') : text('كل الدول', 'All countries'),
                        legacy.regions.length ? text(`${legacy.regions.length} منطقة`, `${legacy.regions.length} regions`) : null,
                        legacy.rates.map((rate) => `${rate.name ? rate.name[lang] : text('سعر ثابت', 'Flat rate')} ${amount(rate.price)}`).join(' · '),
                    ].filter(Boolean).join(' — ')}</p>
                </article> : null}
                {data.zones.map((zone) => <article key={zone.id} aria-label={zone.name[lang] || zone.name.en} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="min-w-0 font-semibold text-slate-900">{zone.name[lang] || zone.name.en}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${zone.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{zone.enabled ? text('نشطة', 'Active') : text('متوقفة', 'Off')}</span>
                    </div>
                    <p className="mt-1 break-words text-sm text-slate-500">{zone.countries.map((code) => countryNames.get(code) || code).join('، ')}{zone.regions.length ? ` — ${text(`${zone.regions.length} منطقة`, `${zone.regions.length} regions`)}` : ''}</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">{zone.rates.map((rate) => <li key={rate.id}>{rate.name[lang] || rate.name.en}: {Number(rate.price) > 0 ? amount(rate.price) : text('مجاني', 'Free')}
                        <span className="text-slate-500"> · {rate.type === 'price' ? text(`طلبات ${rate.min_subtotal}${rate.max_subtotal ? `–${rate.max_subtotal}` : '+'}`, `orders ${rate.min_subtotal}${rate.max_subtotal ? `–${rate.max_subtotal}` : '+'}`) : rate.type === 'weight' ? text(`وزن ${rate.min_weight_grams}${rate.max_weight_grams ? `–${rate.max_weight_grams}` : '+'} جم`, `weight ${rate.min_weight_grams}${rate.max_weight_grams ? `–${rate.max_weight_grams}` : '+'} g`) : text('ثابت', 'flat')}</span></li>)}</ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className={button} onClick={() => { setNotice(null); setEditing(draftZone(zone)); }}>{text('تعديل المنطقة', 'Edit zone')} <span className="sr-only">{zone.name[lang] || zone.name.en}</span></button>
                        {confirming === zone.id ? <><button type="button" className={`${button} border-red-200 text-red-700`} onClick={() => void remove(zone)}>{text('تأكيد الحذف', 'Confirm delete')}</button><button type="button" className={button} onClick={() => setConfirming(null)}>{text('إلغاء', 'Cancel')}</button></>
                            : <button type="button" className={button} onClick={() => setConfirming(zone.id)}>{text('حذف المنطقة', 'Delete zone')} <span className="sr-only">{zone.name[lang] || zone.name.en}</span></button>}
                    </div>
                </article>)}
            </div> : null}
        </SettingsCard>
        {data ? <TaxOverrides apiBase={apiBase} overrides={data.tax_overrides} regionsFor={regionsFor} allRegions={allRegions} countryNames={countryNames} text={text} lang={lang} onChanged={reload} /> : null}
        {data ? <QuotePreview apiBase={apiBase} zones={data.zones} regionsFor={regionsFor} countryNames={countryNames} currency={currency} text={text} lang={lang} /> : null}
    </div>;
}

function ZoneEditor({ apiBase, initial, currency, text, lang, countryNames, onCancel, onSaved }) {
    const [zone, setZone] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const submitting = useRef(false);
    const options = useMemo(() => countryOptions(lang), [lang]);
    const change = (update) => setZone((current) => ({ ...current, ...update }));
    const updateRegion = (id, update) => setZone((current) => ({ ...current, regions: current.regions.map((row) => (row.id === id ? { ...row, ...update } : row)) }));
    const updateRate = (key, update) => setZone((current) => ({ ...current, rates: current.rates.map((row) => (row._key === key ? { ...row, ...update } : row)) }));
    const prefix = zone.id || 'new-zone';
    async function save(event) {
        event.preventDefault();
        if (submitting.current) return;
        if (!zone.countries.length) { setError(text('أضف دولة واحدة على الأقل.', 'Add at least one country.')); return; }
        submitting.current = true; setSaving(true); setError('');
        try {
            const { data } = zone.id ? await api.put(`${apiBase}/shipping/zones/${zone.id}`, zoneBody(zone)) : await api.post(`${apiBase}/shipping/zones`, zoneBody(zone));
            onSaved(data.data, data.warnings);
        } catch (e) { setError(errorText(e)); }
        finally { submitting.current = false; setSaving(false); }
    }
    const nameFields = (value, onChange, id, labels, required = true) => <div className="grid gap-4 sm:grid-cols-2">{['ar', 'en'].map((language) => <FormField key={language} label={language === 'ar' ? labels[0] : labels[1]} htmlFor={`${id}-${language}`}>
        <input id={`${id}-${language}`} className={INPUT_CLASS} dir={language === 'ar' ? 'rtl' : 'ltr'} maxLength={120} required={required} value={value?.[language] ?? ''} onChange={(e) => onChange({ ...value, [language]: e.target.value })} /></FormField>)}</div>;
    const numberField = (rate, key, label, props = {}) => <FormField label={label} htmlFor={`${prefix}-${rate._key}-${key}`}>
        <input id={`${prefix}-${rate._key}-${key}`} className={INPUT_CLASS} type="number" min="0" step={key.includes('weight') ? '1' : '0.01'} value={rate[key] ?? ''} onChange={(e) => updateRate(rate._key, { [key]: e.target.value })} {...props} /></FormField>;

    return <form onSubmit={save} aria-labelledby={`${prefix}-title`} className="space-y-5" data-zone-editor>
        <h3 id={`${prefix}-title`} className="text-base font-semibold text-slate-900">{zone.id ? text('تعديل المنطقة', 'Edit zone') : text('منطقة جديدة', 'New zone')}</h3>
        {error ? <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        <fieldset disabled={saving} className="min-w-0 space-y-5">
            {nameFields(zone.name, (name) => change({ name }), `${prefix}-name`, [text('اسم المنطقة بالعربية', 'Zone name in Arabic'), text('اسم المنطقة بالإنجليزية', 'Zone name in English')])}
            <Toggle label={text('منطقة نشطة', 'Active zone')} checked={zone.enabled} onChange={(enabled) => change({ enabled })} />
            <div className="space-y-2">
                <FormField label={text('إضافة دولة', 'Add country')} htmlFor={`${prefix}-country`}>
                    <select id={`${prefix}-country`} className={INPUT_CLASS} value="" onChange={(e) => { if (e.target.value) change({ countries: [...zone.countries, e.target.value] }); }}>
                        <option value="">{text('اختر دولة…', 'Choose a country…')}</option>
                        {options.filter((row) => !zone.countries.includes(row.value)).map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
                    </select>
                </FormField>
                <p className="text-xs text-slate-500">{text('اختر كل الدول التي تخدمها هذه المنطقة.', 'Choose every country this zone serves.')}</p>
                <ul className="flex flex-wrap gap-2" aria-label={text('دول المنطقة', 'Zone countries')}>{zone.countries.map((code) => <li key={code} className="flex items-center gap-1 rounded-full bg-slate-100 py-1 ps-3 pe-1 text-sm">
                    {countryNames.get(code) || code}<button type="button" className="rounded-full px-2 text-slate-500 hover:bg-slate-200" aria-label={`${text('إزالة', 'Remove')} ${countryNames.get(code) || code}`}
                        onClick={() => change({ countries: zone.countries.filter((row) => row !== code), regions: zone.regions.filter((row) => row.country !== code) })}>×</button></li>)}</ul>
            </div>
            <section className="space-y-3" aria-labelledby={`${prefix}-regions`}>
                <h4 id={`${prefix}-regions`} className="text-sm font-semibold text-slate-800">{text('المحافظات أو المدن (اختياري)', 'Governorates or cities (optional)')}</h4>
                <p className="text-xs leading-5 text-slate-500">{text('إذا أضفت مناطق لدولة، تخدم هذه المنطقة تلك المحافظات فقط. اتركها فارغة لتغطية الدولة كلها.', 'If you add regions for a country, this zone only serves those regions there. Leave empty to cover the whole country.')}</p>
                {zone.regions.map((region, index) => <div key={region.id} role="group" aria-label={`${text('منطقة', 'Region')} ${index + 1}`} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    {nameFields(region.name, (name) => updateRegion(region.id, { name }), `${prefix}-region-${region.id}`, [text('اسم المحافظة بالعربية', 'Region name in Arabic'), text('اسم المحافظة بالإنجليزية', 'Region name in English')])}
                    <div className="flex flex-wrap items-end gap-3"><FormField className="min-w-0 flex-1" label={text('دولة المحافظة', 'Region country')} htmlFor={`${prefix}-region-${region.id}-country`}>
                        <select id={`${prefix}-region-${region.id}-country`} className={INPUT_CLASS} value={region.country} onChange={(e) => updateRegion(region.id, { country: e.target.value })}>{zone.countries.map((code) => <option key={code} value={code}>{countryNames.get(code) || code}</option>)}</select></FormField>
                        <button type="button" className={button} onClick={() => change({ regions: zone.regions.filter((row) => row.id !== region.id) })}>{text('حذف المحافظة', 'Delete region')}</button></div>
                </div>)}
                <button type="button" className={button} disabled={!zone.countries.length || zone.regions.length >= 500} onClick={() => change({ regions: [...zone.regions, { id: localKey(), name: blankName(), country: zone.countries[0] }] })}>+ {text('إضافة محافظة', 'Add region')}</button>
            </section>
            <section className="space-y-3" aria-labelledby={`${prefix}-rates`}>
                <h4 id={`${prefix}-rates`} className="text-sm font-semibold text-slate-800">{text('أسعار الشحن', 'Rates')}</h4>
                <p className="text-xs leading-5 text-slate-500">{text('النطاق يشمل الحد الأدنى ولا يشمل الحد الأقصى. اترك الحد الأقصى فارغًا لعدم وجود حد.', 'Bands include the minimum and exclude the maximum. Leave the maximum empty for no upper limit.')}</p>
                {zone.rates.map((rate, index) => <fieldset key={rate._key} className="min-w-0 space-y-3 rounded-xl border border-slate-200 p-3" data-rate-editor>
                    <legend className="px-1 text-sm font-semibold">{text(`السعر ${index + 1}`, `Rate ${index + 1}`)}</legend>
                    {nameFields(rate.name, (name) => updateRate(rate._key, { name }), `${prefix}-${rate._key}-name`, [text('اسم السعر بالعربية', 'Rate name in Arabic'), text('اسم السعر بالإنجليزية', 'Rate name in English')])}
                    <div className="grid gap-3 sm:grid-cols-3">
                        <FormField label={text('نوع السعر', 'Rate type')} htmlFor={`${prefix}-${rate._key}-type`}><select id={`${prefix}-${rate._key}-type`} className={INPUT_CLASS} value={rate.type} onChange={(e) => updateRate(rate._key, { type: e.target.value })}>
                            <option value="flat">{text('سعر ثابت', 'Flat rate')}</option><option value="price">{text('حسب قيمة الطلب', 'By order price')}</option><option value="weight">{text('حسب الوزن', 'By weight')}</option></select></FormField>
                        {rate.type === 'price' ? <>{numberField(rate, 'min_subtotal', `${text('أقل قيمة للطلب', 'Minimum order')} (${currency})`, { required: true })}{numberField(rate, 'max_subtotal', text('أقصى قيمة (اختياري)', 'Maximum order (optional)'))}</> : null}
                        {rate.type === 'weight' ? <>{numberField(rate, 'min_weight_grams', text('أقل وزن (جم)', 'Minimum weight (g)'), { required: true })}{numberField(rate, 'max_weight_grams', text('أقصى وزن (جم، اختياري)', 'Maximum weight (g, optional)'))}</> : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {numberField(rate, 'price', `${text('سعر الشحن', 'Shipping price')} (${currency})`, { required: true })}
                        {numberField(rate, 'free_over', text('مجاني ابتداءً من (اختياري)', 'Free from (optional)'))}
                        {numberField(rate, 'cod_fee', text('رسوم الدفع عند الاستلام (اختياري)', 'Cash on delivery fee (optional)'))}
                    </div>
                    {nameFields(rate.delivery_time, (delivery_time) => updateRate(rate._key, { delivery_time }), `${prefix}-${rate._key}-time`, [text('مدة التوصيل بالعربية', 'Delivery time in Arabic'), text('مدة التوصيل بالإنجليزية', 'Delivery time in English')], false)}
                    <div className="flex flex-wrap items-center justify-between gap-3"><Toggle label={text('سعر نشط', 'Active rate')} checked={rate.enabled} onChange={(enabled) => updateRate(rate._key, { enabled })} />
                        <button type="button" className={button} disabled={zone.rates.length <= 1} onClick={() => change({ rates: zone.rates.filter((row) => row._key !== rate._key) })}>{text('حذف السعر', 'Delete rate')}</button></div>
                </fieldset>)}
                <button type="button" className={button} disabled={zone.rates.length >= 50} onClick={() => change({ rates: [...zone.rates, draftRate()] })}>+ {text('إضافة سعر', 'Add rate')}</button>
            </section>
        </fieldset>
        <div className="flex flex-wrap gap-2"><button type="submit" className={primary} disabled={saving}>{saving ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ المنطقة', 'Save zone')}</button><button type="button" className={button} disabled={saving} onClick={onCancel}>{text('إلغاء', 'Cancel')}</button></div>
    </form>;
}

const blankOverride = () => ({ id: null, country: '', region_id: '', name: blankName(), rate: '', enabled: true });

function TaxOverrides({ apiBase, overrides, regionsFor, allRegions, countryNames, text, lang, onChanged }) {
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const options = useMemo(() => countryOptions(lang), [lang]);
    const regionName = (id) => { const region = allRegions.find((row) => row.id === id); return region ? region.name[lang] || region.name.en : id; };
    async function save(event) {
        event.preventDefault();
        if (saving) return;
        setSaving(true); setError('');
        const body = { country: draft.country, region_id: draft.region_id || null, name: draft.name, rate: String(draft.rate), enabled: draft.enabled };
        try { if (draft.id) await api.put(`${apiBase}/shipping/tax-overrides/${draft.id}`, body); else await api.post(`${apiBase}/shipping/tax-overrides`, body); setDraft(null); onChanged(); }
        catch (e) { setError(errorText(e)); }
        finally { setSaving(false); }
    }
    async function remove(id) {
        setError('');
        try { await api.delete(`${apiBase}/shipping/tax-overrides/${id}`); onChanged(); } catch (e) { setError(errorText(e)); }
    }
    return <SettingsCard title={text('ضرائب حسب الدولة أو المحافظة', 'Tax by country or region')}
        description={text('تستبدل النسبة العامة للعناوين المطابقة. شمول الأسعار للضريبة يتبع إعداد المتجر.', 'Replaces the store-wide rate for matching addresses. Whether prices include tax follows the store setting.')}
        actions={!draft ? <button type="button" className={primary} onClick={() => setDraft(blankOverride())}>+ {text('إضافة ضريبة', 'Add tax override')}</button> : null}>
        {error ? <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        {!overrides.length && !draft ? <p className="text-sm text-slate-500">{text('لا توجد ضرائب خاصة. تُطبق النسبة العامة على كل الطلبات.', 'No overrides yet. The store-wide rate applies to every order.')}</p> : null}
        {overrides.length ? <ul className="mb-4 divide-y divide-slate-100">{overrides.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <span className="min-w-0 break-words"><strong>{row.name[lang] || row.name.en}</strong> · {Number(row.rate)}% · {countryNames.get(row.country) || row.country}{row.region_id ? ` / ${regionName(row.region_id)}` : ''}{row.enabled ? '' : ` · ${text('متوقفة', 'Off')}`}</span>
            <span className="flex gap-2"><button type="button" className={button} onClick={() => setDraft({ ...row, region_id: row.region_id ?? '' })}>{text('تعديل', 'Edit')} <span className="sr-only">{row.name[lang] || row.name.en}</span></button>
                <button type="button" className={button} onClick={() => void remove(row.id)}>{text('حذف', 'Delete')} <span className="sr-only">{row.name[lang] || row.name.en}</span></button></span>
        </li>)}</ul> : null}
        {draft ? <form onSubmit={save} className="space-y-4" aria-label={text('ضريبة خاصة', 'Tax override')}><fieldset disabled={saving} className="min-w-0 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
                <FormField label={text('الدولة', 'Country')} htmlFor="tax-override-country"><select id="tax-override-country" className={INPUT_CLASS} required value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value, region_id: '' })}>
                    <option value="">{text('اختر دولة…', 'Choose a country…')}</option>{options.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}</select></FormField>
                <FormField label={text('المحافظة', 'Region')} htmlFor="tax-override-region"><select id="tax-override-region" className={INPUT_CLASS} value={draft.region_id} onChange={(e) => setDraft({ ...draft, region_id: e.target.value })}>
                    <option value="">{text('كل الدولة', 'Whole country')}</option>{regionsFor(draft.country).map((row) => <option key={row.id} value={row.id}>{row.name[lang] || row.name.en}</option>)}</select></FormField>
                <FormField label={text('نسبة الضريبة %', 'Tax rate %')} htmlFor="tax-override-rate"><input id="tax-override-rate" className={INPUT_CLASS} type="number" min="0" max="100" step="0.001" required value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: e.target.value })} /></FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">{['ar', 'en'].map((language) => <FormField key={language} label={language === 'ar' ? text('اسم الضريبة بالعربية', 'Tax name in Arabic') : text('اسم الضريبة بالإنجليزية', 'Tax name in English')} htmlFor={`tax-override-name-${language}`}>
                <input id={`tax-override-name-${language}`} className={INPUT_CLASS} dir={language === 'ar' ? 'rtl' : 'ltr'} maxLength={60} required placeholder={language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} value={draft.name[language]} onChange={(e) => setDraft({ ...draft, name: { ...draft.name, [language]: e.target.value } })} /></FormField>)}</div>
            <Toggle label={text('ضريبة نشطة', 'Active override')} checked={draft.enabled} onChange={(enabled) => setDraft({ ...draft, enabled })} />
        </fieldset>
            <div className="flex flex-wrap gap-2"><button type="submit" className={primary} disabled={saving}>{text('حفظ الضريبة', 'Save tax override')}</button><button type="button" className={button} disabled={saving} onClick={() => setDraft(null)}>{text('إلغاء', 'Cancel')}</button></div>
        </form> : null}
    </SettingsCard>;
}

function QuotePreview({ apiBase, zones, regionsFor, countryNames, currency, text, lang }) {
    const [form, setForm] = useState({ country: '', region_id: '', subtotal: '', weight_grams: '', payment_method: 'cod' });
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const countries = [...new Set(zones.flatMap((zone) => zone.countries))];
    const options = countries.length ? countries.map((code) => ({ value: code, label: countryNames.get(code) || code })) : countryOptions(lang);
    const amount = (value) => `${Number(value ?? 0).toFixed(2)} ${currency || ''}`.trim();
    async function run(event) {
        event.preventDefault();
        setBusy(true); setError('');
        try {
            const { data } = await api.post(`${apiBase}/shipping/quote-preview`, { country: form.country, region_id: form.region_id || null, subtotal: String(form.subtotal || 0), weight_grams: Number(form.weight_grams || 0), payment_method: form.payment_method });
            setResult(data.data);
        } catch (e) { setError(errorText(e)); setResult(null); }
        finally { setBusy(false); }
    }
    const tax = result?.tax;
    const taxName = tax ? `${(tax.name?.[lang] || tax.name?.en || text('الضريبة', 'Tax'))} ${Number(tax.rate)}%${tax.included ? text(' (شاملة)', ' (included)') : ''}` : '';
    return <SettingsCard title={text('تجربة حساب الشحن', 'Test a quote')} description={text('اعرف المنطقة والأسعار والضريبة التي سيحصل عليها عنوان معين.', 'See which zone, rates and tax an address gets.')}>
        <form onSubmit={run} className="space-y-4" aria-label={text('تجربة حساب الشحن', 'Test a quote')}>
            <div className="grid gap-4 sm:grid-cols-3">
                <FormField label={text('الدولة', 'Country')} htmlFor="quote-preview-country"><select id="quote-preview-country" className={INPUT_CLASS} required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, region_id: '' })}>
                    <option value="">{text('اختر دولة…', 'Choose a country…')}</option>{options.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}</select></FormField>
                <FormField label={text('المحافظة', 'Region')} htmlFor="quote-preview-region"><select id="quote-preview-region" className={INPUT_CLASS} value={form.region_id} onChange={(e) => setForm({ ...form, region_id: e.target.value })}>
                    <option value="">{text('بدون محافظة', 'No region')}</option>{regionsFor(form.country).map((row) => <option key={row.id} value={row.id}>{row.name[lang] || row.name.en}</option>)}</select></FormField>
                <FormField label={text('طريقة الدفع', 'Payment method')} htmlFor="quote-preview-payment"><select id="quote-preview-payment" className={INPUT_CLASS} value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                    <option value="cod">{text('الدفع عند الاستلام', 'Cash on delivery')}</option><option value="online">{text('دفع إلكتروني', 'Online payment')}</option></select></FormField>
                <FormField label={`${text('قيمة المنتجات', 'Products subtotal')} (${currency})`} htmlFor="quote-preview-subtotal"><input id="quote-preview-subtotal" className={INPUT_CLASS} type="number" min="0" step="0.01" required value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} /></FormField>
                <FormField label={text('وزن السلة (جم)', 'Cart weight (g)')} htmlFor="quote-preview-weight"><input id="quote-preview-weight" className={INPUT_CLASS} type="number" min="0" step="1" required value={form.weight_grams} onChange={(e) => setForm({ ...form, weight_grams: e.target.value })} /></FormField>
            </div>
            <button type="submit" className={primary} disabled={busy}>{text('احسب', 'Calculate')}</button>
        </form>
        {error ? <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        {result ? <div role="status" className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm" data-quote-preview>
            {!result.available ? <p className="font-medium text-red-700">{Object.values(result.errors || {}).flat().join(' ')}</p> : <>
                <p><strong>{text('المنطقة', 'Zone')}:</strong> {result.zone ? result.zone.name[lang] || result.zone.name.en : text('المنطقة الافتراضية', 'Default zone')}</p>
                {result.rates.length ? <ul className="space-y-1">{result.rates.map((rate) => <li key={rate.id}>{rate.id === result.rate?.id ? '✓ ' : ''}{rate.name[lang] || rate.name.en}: {Number(rate.amount) > 0 ? amount(rate.amount) : text('مجاني', 'Free')}{rate.delivery_time?.[lang] ? ` · ${rate.delivery_time[lang]}` : ''}</li>)}</ul> : null}
                {Number(result.cod_fee) > 0 ? <p>{text('رسوم الدفع عند الاستلام', 'Cash on delivery fee')}: {amount(result.cod_fee)}</p> : null}
                <p><strong>{text('الشحن', 'Shipping')}:</strong> {amount(result.totals.shipping_total)}</p>
                {tax ? <p data-tax-line><strong>{taxName}:</strong> {amount(result.totals.tax_total)}</p> : null}
                <p><strong>{text('الإجمالي', 'Total')}:</strong> {amount(result.totals.grand_total)}</p>
            </>}
        </div> : null}
    </SettingsCard>;
}
