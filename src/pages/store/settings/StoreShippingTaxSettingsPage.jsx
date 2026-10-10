import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import FormField, { INPUT_CLASS } from '../../../components/ui/FormField';
import SaveBar from '../../../components/ui/SaveBar';
import SettingsCard from '../../../components/ui/SettingsCard';
import Toggle from '../../../components/ui/Toggle';
import StoreMediaPicker from '../../../components/store/StoreMediaPicker';
import StoreCarrierSettings from '../../../components/store/StoreCarrierSettings';
import useStoreContext from '../../../hooks/useStoreContext';
import { useDirty } from '../../../hooks/useStoreSettings';
import { countryOptions } from '../../../apps/storefront/utils/countries';

const button = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;
const normalize = (data) => ({ ...data, shipping_free_over: data.shipping_free_over ?? '' });

export default function StoreShippingTaxSettingsPage() {
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar');
    const label = (arabic, english) => ar ? arabic : english;
    const { apiBase, uiBase, store, access } = useStoreContext();
    const [values, setValues] = useState(null);
    const [initial, setInitial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [bulkRate, setBulkRate] = useState('');
    const [tab, setTab] = useState('regions');
    const submitting = useRef(false);
    const dirty = useDirty(initial, values);
    useEffect(() => {
        let active = true;
        if (!access?.canStoreSettings) return undefined;
        setLoading(true); setError('');
        api.get(`${apiBase}/shipping`).then(({ data }) => {
            if (active) { const next = normalize(data.data); setValues(next); setInitial(next); }
        }).catch((e) => { if (active) setError(errorText(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, access?.canStoreSettings, attempt]);
    if (!access?.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const change = (update) => { setValues((current) => typeof update === 'function' ? update(current) : { ...current, ...update }); setSaved(false); };
    const updateRow = (collection, id, update) => change((current) => ({ ...current, [collection]: current[collection].map((row) => row.id === id ? { ...row, ...update } : row) }));
    const removeRow = (collection, id) => change((current) => ({ ...current, [collection]: current[collection].filter((row) => row.id !== id) }));
    const addRow = (collection) => change((current) => ({ ...current, [collection]: [...current[collection], {
        id: crypto.randomUUID(), name: { ar: '', en: '' }, enabled: true, rate: '0.00',
        ...(collection === 'regions' ? { country: store?.country || 'EG', position: current.regions.length } : { description: { ar: '', en: '' }, is_default: false, priority: 0, icon_asset_id: null, icon_url: null }),
    }] }));
    const makeDefault = (id, checked) => change((current) => ({ ...current, options: current.options.map((row) => ({ ...row, is_default: row.id === id ? checked : false, enabled: row.id === id && checked ? true : row.enabled })) }));
    async function save(event) {
        event.preventDefault();
        if (submitting.current || !values) return;
        submitting.current = true; setSaving(true); setError(''); setSaved(false);
        try {
            const body = { ...values, shipping_free_over: values.shipping_free_over === '' ? null : values.shipping_free_over,
                options: values.options.map(({ icon_url: _url, ...option }) => option) };
            const { data } = await api.put(`${apiBase}/shipping`, body);
            const next = normalize(data.data); setValues(next); setInitial(next); setSaved(true);
        } catch (e) { setError(errorText(e)); }
        finally { submitting.current = false; setSaving(false); }
    }
    const numeric = (key, text, props = {}) => <FormField label={text} htmlFor={key}><input id={key} className={INPUT_CLASS} type="number" min="0" step="0.01" required value={values[key]} onChange={(e) => change({ [key]: e.target.value })} {...props} /></FormField>;
    const names = (collection, row) => <div className="grid gap-4 sm:grid-cols-2">{['ar', 'en'].map((language) => <FormField key={language} label={language === 'ar' ? label('الاسم بالعربية', 'Arabic name') : label('الاسم بالإنجليزية', 'English name')} htmlFor={`${row.id}-${language}`}><input id={`${row.id}-${language}`} className={INPUT_CLASS} dir={language === 'ar' ? 'rtl' : 'ltr'} maxLength={120} required value={row.name[language]} onChange={(e) => updateRow(collection, row.id, { name: { ...row.name, [language]: e.target.value } })} /></FormField>)}</div>;
    const rowNumber = (collection, row, key, title) => <FormField label={title} htmlFor={`${row.id}-${key}`}><input id={`${row.id}-${key}`} className={INPUT_CLASS} type="number" min="0" max={key === 'rate' ? undefined : 999} step={key === 'rate' ? '0.01' : '1'} required value={row[key]} onChange={(e) => updateRow(collection, row.id, { [key]: e.target.value })} /></FormField>;
    return <div className="mx-auto max-w-5xl space-y-5"><form onSubmit={save} onInvalidCapture={(event) => {
        const panel = event.target.closest('[role="tabpanel"]');
        if (panel) setTab(panel.id === 'shipping-panel-regions' ? 'regions' : 'options');
    }} className="mx-auto max-w-5xl space-y-5">
        <PageHeader title={label('إعدادات الشحن والضريبة', 'Shipping & tax')} subtitle={label('حدد مناطق التوصيل وخيارات الشحن المتاحة لعملائك وأسعارها.', 'Set delivery regions, shipping choices and prices for your customers.')} />
        {error ? <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}{!values ? <button type="button" className={button} onClick={() => setAttempt((n) => n + 1)}>{label('إعادة المحاولة', 'Retry')}</button> : null}</div> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{label('تم حفظ إعدادات الشحن.', 'Shipping settings saved.')}</p> : null}
        {loading ? <p role="status">{label('جارٍ تحميل الإعدادات…', 'Loading settings…')}</p> : values ? <>
            <fieldset disabled={saving} className="space-y-5">
                <SettingsCard title={label('أسعار الشحن', 'Shipping prices')} description={label('السعر الافتراضي يُستخدم عندما لا توجد مناطق أو خيارات شحن. أدخل صفرًا للشحن المجاني.', 'The default price applies when there are no regions or shipping options. Enter zero for free shipping.')}>
                    <Toggle label={label('تفعيل الشحن', 'Enable shipping')} checked={values.shipping_enabled} onChange={(shipping_enabled) => change({ shipping_enabled })} />
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">{numeric('shipping_flat_rate', `${label('السعر الافتراضي', 'Default price')} (${store?.currency})`)}{numeric('shipping_free_over', label('شحن مجاني ابتداءً من', 'Free shipping from'), { required: false, placeholder: label('اختياري', 'Optional') })}</div>
                    <p className="mt-3 text-xs leading-6 text-slate-500">{label('حد الشحن المجاني يُحسب من قيمة المنتجات بعد الخصم. اتركه فارغًا لاحتساب الشحن دائمًا.', 'Free shipping uses the product total after discounts. Leave the threshold empty to always charge shipping.')}</p>
                </SettingsCard>
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div role="tablist" aria-label={label('طرق الشحن', 'Shipping methods')} className="flex border-b border-slate-200">
                        {[['regions', label('مناطق التوصيل', 'Delivery regions')], ['options', label('خيارات الشحن', 'Shipping options')]].map(([key, title]) => <button id={`shipping-tab-${key}`} aria-controls={`shipping-panel-${key}`} key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`flex-1 border-b-2 px-4 py-4 text-sm font-semibold ${tab === key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'}`}>{title} <span className="ms-2 rounded-full bg-slate-100 px-2 py-1 text-xs">{values[key].length}</span></button>)}
                    </div>
                    <div id="shipping-panel-regions" role="tabpanel" aria-labelledby="shipping-tab-regions" hidden={tab !== 'regions'} className="space-y-5 p-5">
                        <Toggle label={label('تفعيل مناطق التوصيل', 'Enable delivery regions')} checked={values.regions_enabled} onChange={(regions_enabled) => change({ regions_enabled })} />
                        <Toggle label={label('اختيار أول منطقة تلقائيًا', 'Select the first region automatically')} checked={values.auto_select_region} onChange={(auto_select_region) => change({ auto_select_region })} />
                        <p className="text-sm text-slate-500">{label('عند التفعيل، يختار العميل منطقة التوصيل بدلًا من كتابة المدينة. ترتيب أقل يظهر أولًا.', 'When enabled, customers choose a delivery region instead of typing a city. Lower positions appear first.')}</p>
                        <div className="flex flex-wrap items-end gap-3"><FormField label={label('سعر موحد للمناطق', 'Set all region prices')} htmlFor="bulk-shipping-rate"><input id="bulk-shipping-rate" className={INPUT_CLASS} type="number" min="0" step="0.01" value={bulkRate} onChange={(e) => setBulkRate(e.target.value)} /></FormField><button type="button" className={button} disabled={bulkRate === '' || Number(bulkRate) < 0 || !values.regions.length} onClick={() => change({ regions: values.regions.map((row) => ({ ...row, rate: bulkRate })) })}>{label('تطبيق على الكل', 'Apply to all')}</button></div>
                        {values.regions.map((row, index) => <section key={row.id} aria-label={`${label('منطقة', 'Region')} ${index + 1}`} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                            <div className="flex justify-between gap-3"><Toggle label={label('منطقة نشطة', 'Active region')} checked={row.enabled} onChange={(enabled) => updateRow('regions', row.id, { enabled })} /><button type="button" className={button} onClick={() => removeRow('regions', row.id)}>{label('حذف المنطقة', 'Delete region')}</button></div>
                            {names('regions', row)}
                            <div className="grid gap-4 sm:grid-cols-3"><FormField label={label('الدولة', 'Country')} htmlFor={`${row.id}-country`}><select id={`${row.id}-country`} className={INPUT_CLASS} value={row.country} onChange={(e) => updateRow('regions', row.id, { country: e.target.value })}>{countryOptions(ar ? 'ar' : 'en').map((country) => <option key={country.value} value={country.value}>{country.label}</option>)}</select></FormField>{rowNumber('regions', row, 'rate', label('سعر الشحن', 'Shipping price'))}{rowNumber('regions', row, 'position', label('الترتيب', 'Position'))}</div>
                        </section>)}
                        {!values.regions.length ? <p className="py-5 text-center text-sm text-slate-400">{label('أضف مناطق التوصيل وأسعارها لعرضها في نموذج الطلب.', 'Add delivery regions and prices to show them at checkout.')}</p> : null}
                        <button type="button" className={button} disabled={values.regions.length >= 500} onClick={() => addRow('regions')}>+ {label('إضافة منطقة', 'Add region')}</button>
                    </div>
                    <div id="shipping-panel-options" role="tabpanel" aria-labelledby="shipping-tab-options" hidden={tab !== 'options'} className="space-y-5 p-5">
                        <p className="rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{label('عند اختيار طريقة شحن، يُستخدم سعرها بدلًا من سعر المنطقة. يظهر الخيار ذو الأولوية الأعلى أولًا.', 'A selected shipping option replaces the regional price. Higher priority options appear first.')}</p>
                        {values.options.map((row, index) => <section key={row.id} aria-label={`${label('خيار', 'Option')} ${index + 1}`} className="space-y-4 rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-center gap-5"><Toggle label={label('خيار نشط', 'Active option')} checked={row.enabled} onChange={(enabled) => updateRow('options', row.id, { enabled, is_default: enabled && row.is_default })} /><Toggle label={label('الاختيار الافتراضي', 'Default choice')} checked={row.is_default} onChange={(checked) => makeDefault(row.id, checked)} /><button type="button" className={`${button} ms-auto`} onClick={() => removeRow('options', row.id)}>{label('حذف الخيار', 'Delete option')}</button></div>
                            {names('options', row)}
                            <div className="grid gap-4 sm:grid-cols-2">{['ar', 'en'].map((language) => <FormField key={language} label={language === 'ar' ? label('الوصف بالعربية', 'Arabic description') : label('الوصف بالإنجليزية', 'English description')} htmlFor={`${row.id}-description-${language}`}><textarea id={`${row.id}-description-${language}`} className={INPUT_CLASS} rows={2} maxLength={500} dir={language === 'ar' ? 'rtl' : 'ltr'} value={row.description[language]} onChange={(e) => updateRow('options', row.id, { description: { ...row.description, [language]: e.target.value } })} /></FormField>)}</div>
                            <div className="grid gap-4 sm:grid-cols-3">{rowNumber('options', row, 'rate', label('السعر', 'Price'))}{rowNumber('options', row, 'priority', label('أولوية العرض', 'Display priority'))}<div><p className="mb-2 text-sm font-medium">{label('أيقونة الشحن', 'Shipping icon')}</p><StoreMediaPicker apiBase={apiBase} value={row.icon_url || ''} onChange={(icon_url) => updateRow('options', row.id, { icon_url })} onSelectAsset={(asset) => updateRow('options', row.id, { icon_asset_id: asset?.id ?? null, icon_url: asset?.url ?? null })} /></div></div>
                        </section>)}
                        {!values.options.length ? <p className="py-5 text-center text-sm text-slate-400">{label('أضف خيارات مثل التوصيل العادي أو السريع ليختار العميل بينها.', 'Add options such as standard or express delivery for customers to choose from.')}</p> : null}
                        <button type="button" className={button} disabled={values.options.length >= 50} onClick={() => addRow('options')}>+ {label('إضافة خيار شحن', 'Add shipping option')}</button>
                    </div>
                </div>
                <SettingsCard title={label('الضريبة', 'Tax')}><Toggle label={label('تفعيل الضريبة', 'Enable tax')} checked={values.tax_enabled} onChange={(tax_enabled) => change({ tax_enabled })} /><div className="mt-5 grid items-center gap-5 sm:grid-cols-2">{numeric('tax_rate', label('نسبة الضريبة %', 'Tax rate %'), { max: 100, step: '0.001' })}<Toggle label={label('الأسعار تشمل الضريبة', 'Prices include tax')} checked={values.tax_prices_include} onChange={(tax_prices_include) => change({ tax_prices_include })} /></div></SettingsCard>
            </fieldset>
            <SaveBar dirty={dirty} saving={saving} saveLabel={label('حفظ إعدادات الشحن', 'Save shipping settings')} onReset={() => { setValues(initial); setError(''); setSaved(false); }} />
        </> : null}
    </form><StoreCarrierSettings key={apiBase} apiBase={apiBase} /></div>;
}
