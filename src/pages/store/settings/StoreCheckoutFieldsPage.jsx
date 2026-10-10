import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlineDocumentText } from 'react-icons/hi2';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import FormField, { INPUT_CLASS } from '../../../components/ui/FormField';
import SaveBar from '../../../components/ui/SaveBar';
import Toggle from '../../../components/ui/Toggle';
import useStoreContext from '../../../hooks/useStoreContext';
import { useDirty } from '../../../hooks/useStoreSettings';

const copy = {
    ar: { title: 'نموذج الشراء', subtitle: 'حدد البيانات التي تحتاجها من العميل لإتمام الطلب في المتجر وصفحات البيع.', advice: 'للطلبات عند الاستلام، ابدأ بالاسم والهاتف والعنوان. أضف الحقول الأخرى عند الحاجة.', preset: 'استخدام نموذج الدفع عند الاستلام', preview: 'معاينة النموذج', language: 'لغة الحقول والمعاينة', label: 'اسم الحقل للعميل', hint: 'النص المساعد', order: 'الترتيب', enabled: 'إظهار الحقل', required: 'حقل إلزامي', up: 'نقل لأعلى', down: 'نقل لأسفل', payment: 'قد يظهر الاسم والبريد كحقلين إلزاميين عند اختيار الدفع الإلكتروني.', contact: 'أبقِ الهاتف أو البريد ظاهرًا وإلزاميًا للتواصل مع العميل.', saved: 'تم حفظ نموذج الشراء.', loading: 'جارٍ تحميل الحقول…', retry: 'إعادة المحاولة', save: 'حفظ النموذج', submit: 'تأكيد الطلب', optional: 'اختياري', choose: 'اختر الدولة', failed: 'تعذّر تحميل الإعدادات.' },
    en: { title: 'Checkout form', subtitle: 'Choose the information buyers provide in your store and sales funnels.', advice: 'For cash on delivery, start with name, phone and address. Add other fields when needed.', preset: 'Use cash on delivery form', preview: 'Form preview', language: 'Field and preview language', label: 'Customer-facing label', hint: 'Helper text', order: 'Order', enabled: 'Show field', required: 'Required field', up: 'Move up', down: 'Move down', payment: 'Name and email may become required when the buyer selects online payment.', contact: 'Keep phone or email visible and required so you can contact the buyer.', saved: 'Checkout form saved.', loading: 'Loading fields…', retry: 'Retry', save: 'Save form', submit: 'Place order', optional: 'Optional', choose: 'Choose country', failed: 'Unable to load settings.' },
};
const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40';
const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

export default function StoreCheckoutFieldsPage() {
    const { i18n } = useTranslation();
    const { apiBase, uiBase, access } = useStoreContext();
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
    const c = copy[lang];
    const [editLang, setEditLang] = useState(lang);
    const [fields, setFields] = useState([]);
    const [initial, setInitial] = useState([]);
    const [preset, setPreset] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const submitting = useRef(false);
    const dirty = useDirty(initial, fields);
    useEffect(() => {
        let active = true;
        if (!access?.canStoreSettings) return undefined;
        setLoading(true); setError('');
        api.get(`${apiBase}/checkout-fields`).then(({ data }) => {
            if (active) { setFields(data.data); setInitial(data.data); setPreset(data.presets.cod); }
        }).catch((e) => { if (active) setError(errorText(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, access?.canStoreSettings, attempt]);
    if (!access?.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const update = (key, changes) => { setSaved(false); setError(''); setFields((current) => current.map((field) => field.key === key ? { ...field, ...changes } : field)); };
    const ordered = [...fields].sort((a, b) => a.position - b.position);
    const move = (key, delta) => {
        const index = ordered.findIndex((field) => field.key === key);
        const next = [...ordered];
        [next[index], next[index + delta]] = [next[index + delta], next[index]];
        setFields(next.map((field, position) => ({ ...field, position }))); setSaved(false);
    };
    async function save(event) {
        event.preventDefault();
        if (submitting.current) return;
        if (!fields.some((field) => ['phone', 'email'].includes(field.key) && field.enabled && field.required)) { setError(c.contact); return; }
        submitting.current = true; setSaving(true); setError(''); setSaved(false);
        try {
            const { data } = await api.put(`${apiBase}/checkout-fields`, { fields });
            setFields(data.data); setInitial(data.data); setSaved(true);
        } catch (e) { setError(errorText(e)); }
        finally { submitting.current = false; setSaving(false); }
    }
    return <form onSubmit={save} className="mx-auto max-w-6xl space-y-5">
        <PageHeader title={c.title} subtitle={c.subtitle} />
        {loading ? <p role="status">{c.loading}</p> : <>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                <p className="max-w-2xl text-sm leading-6">{c.advice}</p>
                <button type="button" className={button} disabled={saving || !preset.length} onClick={() => { setFields(preset); setError(''); setSaved(false); }}>{c.preset}</button>
            </div>
            <label className="flex flex-wrap items-center gap-3 text-sm font-medium">{c.language}
                <select className="rounded-lg border border-slate-200 bg-white px-4 py-2" value={editLang} onChange={(event) => setEditLang(event.target.value)}><option value="ar">العربية</option><option value="en">English</option></select>
            </label>
            {error ? <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}{!fields.length ? <button className={button} type="button" onClick={() => setAttempt((n) => n + 1)}>{c.retry}</button> : null}</div> : null}
            {saved ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{c.saved}</p> : null}
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <fieldset disabled={saving} className="min-w-0 space-y-4">
                    {ordered.map((field, index) => <section key={field.key} aria-label={field.label[editLang]} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><HiOutlineDocumentText className="h-5 w-5 text-emerald-600" />{field.label[editLang]}</h2>
                            <div className="flex gap-1"><button type="button" className={button} title={c.up} aria-label={`${c.up}: ${field.label[editLang]}`} disabled={index === 0} onClick={() => move(field.key, -1)}><HiOutlineArrowUp /></button><button type="button" className={button} title={c.down} aria-label={`${c.down}: ${field.label[editLang]}`} disabled={index === ordered.length - 1} onClick={() => move(field.key, 1)}><HiOutlineArrowDown /></button></div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_90px]">
                            <FormField label={c.label} htmlFor={`field-${field.key}-label`}><input id={`field-${field.key}-label`} className={INPUT_CLASS} dir={editLang === 'ar' ? 'rtl' : 'ltr'} required maxLength={100} value={field.label[editLang]} onChange={(event) => update(field.key, { label: { ...field.label, [editLang]: event.target.value } })} /></FormField>
                            <FormField label={c.order} htmlFor={`field-${field.key}-order`}><input id={`field-${field.key}-order`} className={INPUT_CLASS} type="number" min={0} max={999} step={1} required value={field.position} onChange={(event) => update(field.key, { position: event.target.value === '' ? '' : Number(event.target.value) })} /></FormField>
                        </div>
                        <div className="mt-3"><FormField label={c.hint} htmlFor={`field-${field.key}-hint`}><input id={`field-${field.key}-hint`} className={INPUT_CLASS} dir={editLang === 'ar' ? 'rtl' : 'ltr'} maxLength={250} value={field.hint[editLang]} onChange={(event) => update(field.key, { hint: { ...field.hint, [editLang]: event.target.value } })} /></FormField></div>
                        <div className="mt-4 flex flex-wrap gap-6"><Toggle label={c.enabled} checked={field.enabled} onChange={(enabled) => update(field.key, { enabled, required: enabled && field.required })} /><Toggle label={c.required} checked={field.required} disabled={!field.enabled} onChange={(required) => update(field.key, { required })} /></div>
                    </section>)}
                </fieldset>
                <aside className="space-y-4 xl:sticky xl:top-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="mb-5 font-semibold">{c.preview}</h2>
                        <div dir={editLang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
                            {ordered.filter((field) => field.enabled).map((field) => <div key={field.key}>
                                <p className="mb-1 text-sm font-medium text-slate-700">{field.label[editLang]} {field.required ? <span className="text-rose-500">*</span> : null}</p>
                                <div className="h-10 rounded-lg border border-slate-200 bg-slate-50" aria-hidden />
                                {field.hint[editLang] ? <p className="mt-1 text-xs text-slate-500">{field.hint[editLang]}</p> : null}
                            </div>)}
                            <div className="rounded-lg bg-emerald-600 p-3 text-center text-sm font-semibold text-white">{copy[editLang].submit}</div>
                        </div>
                    </div>
                    <p className="text-xs leading-6 text-slate-500">{c.contact} {c.payment}</p>
                </aside>
            </div>
            <SaveBar dirty={dirty} saving={saving} saveLabel={c.save} onReset={() => { setFields(initial); setError(''); setSaved(false); }} />
        </>}
    </form>;
}
