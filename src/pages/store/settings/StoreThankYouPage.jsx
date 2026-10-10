import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import Toggle from '../../../components/ui/Toggle';
import ProductRichText from '../../../components/store/ProductRichText';
import useStoreContext from '../../../hooks/useStoreContext';
import { useDirty } from '../../../hooks/useStoreSettings';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml';
import './thank-you-page.css';

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900';
const errorMessage = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

export default function StoreThankYouPage() {
    const context = useStoreContext();
    if (!context.access?.canStoreSettings) return <Navigate to={`${context.uiBase}/overview`} replace />;
    return <ThankYouEditor key={context.apiBase} context={context} />;
}

function ThankYouEditor({ context: { apiBase, uiBase } }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [locale, setLocale] = useState(ar ? 'ar' : 'en');
    const [settings, setSettings] = useState(null); const [initial, setInitial] = useState(null);
    const [categories, setCategories] = useState([]); const [attempt, setAttempt] = useState(0);
    const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false); const [conflict, setConflict] = useState(false);
    const working = useRef(false);
    const dirty = useDirty(initial, settings);
    const apply = (data) => { setSettings(data.data); setInitial(data.data); setCategories(data.categories); setConflict(false); };
    useEffect(() => {
        let active = true;
        api.get(`${apiBase}/thank-you`).then(({ data }) => { if (active) apply(data); }).catch((e) => { if (active) setError(errorMessage(e)); });
        return () => { active = false; };
    }, [apiBase, attempt]);
    const update = (key, value) => { setSettings((current) => ({ ...current, [key]: value })); setSaved(false); setError(''); };
    const reload = () => { setSettings(null); setInitial(null); setError(''); setSaved(false); setConflict(false); setAttempt((n) => n + 1); };
    async function save(event) {
        event.preventDefault();
        if (working.current || conflict || !settings) return;
        working.current = true; setBusy(true); setSaved(false); setError('');
        try { const { data } = await api.put(`${apiBase}/thank-you`, settings); apply(data); setSaved(true); }
        catch (e) { const changed = e.response?.status === 409; setConflict(changed); setError(changed ? text('تغيرت صفحة الشكر في جلسة أخرى. أعد تحميل الإعدادات قبل الحفظ.', 'The thank-you page changed in another session. Reload before saving.') : errorMessage(e)); }
        finally { working.current = false; setBusy(false); }
    }
    const category = categories.find((row) => row.id === settings?.category_id);
    return <form onSubmit={save} className="thank-you-editor mx-auto max-w-6xl space-y-5">
        <PageHeader title={text('صفحة الشكر', 'Thank-you page')} subtitle={text('خصص المحتوى الذي يظهر بعد إتمام الطلب في السلة وصفحات البيع.', 'Customize the content shown after checkout from your cart and sales funnels.')} />
        {error ? <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}{!settings || conflict ? <button type="button" className="mx-2 underline" onClick={reload}>{text('تحميل الإعدادات الحالية', 'Reload current settings')}</button> : null}</div> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{text('تم حفظ صفحة الشكر.', 'Thank-you page saved.')}</p> : null}
        {!settings && !error ? <p role="status">{text('جارٍ تحميل الصفحة…', 'Loading page…')}</p> : null}
        {settings ? <>
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <fieldset disabled={busy} className="min-w-0 space-y-5">
                    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                        <Toggle label={text('تفعيل صفحة الشكر المخصصة', 'Enable custom thank-you page')} checked={settings.enabled} onChange={(value) => update('enabled', value)} description={text('عند التعطيل يظهر تصميم الثيم الافتراضي وتبقى مسودتك محفوظة.', 'When disabled, the default theme design is shown and your draft stays saved.')} />
                        <label className="block space-y-2 text-sm font-semibold">{text('لغة المحتوى والمعاينة', 'Content and preview language')}<select className={input} value={locale} onChange={(e) => setLocale(e.target.value)}><option value="ar">العربية</option><option value="en">English</option></select></label>
                        <ProductRichText key={locale} pageContent value={settings.content[locale]} onChange={(value) => update('content', { ...settings.content, [locale]: value })} label={text('محتوى صفحة الشكر', 'Thank-you page content')} locale={locale} ar={ar} disabled={busy} />
                        <Link className="text-sm underline" to={`${uiBase}/media`}>{text('فتح مكتبة وسائط المتجر', 'Open store media library')}</Link>
                        <Toggle label={text('زر العودة للرئيسية', 'Back to home button')} checked={settings.show_home_button} onChange={(value) => update('show_home_button', value)} />
                        <label className="block space-y-2 text-sm font-semibold">{text('عرض منتجات من قسم معين', 'Show products from a category')}<select className={input} value={settings.category_id ?? ''} onChange={(e) => update('category_id', e.target.value ? Number(e.target.value) : null)}><option value="">{text('بدون منتجات مقترحة', 'No suggested products')}</option>{settings.category_id && !category ? <option value={settings.category_id} disabled>{text('القسم لم يعد متاحًا — اختر قسمًا أو ألغِ العرض', 'Category unavailable — choose another or remove it')}</option> : null}{categories.map((row) => <option key={row.id} value={row.id}>{row.name[locale] || row.name[ar ? 'ar' : 'en']}</option>)}</select></label>
                        <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">{text('يظهر حتى 8 منتجات منشورة من القسم. لا تتغير حالة الدفع ولا تفاصيل الإيصال الخاص بتعديل هذه الصفحة.', 'Up to 8 published products from this category appear. Editing this page does not change payment status or private receipt details.')}</p>
                    </section>
                </fieldset>
                <aside className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                    <h2 className="font-semibold">{text('معاينة المحتوى', 'Content preview')}</h2>
                    <p className="text-xs leading-5 text-slate-500 dark:text-slate-300">{text('المعاينة تعرض مسودتك؛ ألوان المتجر وتصميم الثيم تُطبق في الصفحة الفعلية بعد الحفظ.', 'This previews your draft; store colors and theme styling apply on the live page after saving.')}</p>
                    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="thank-you-preview space-y-4">
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings.content[locale], { formatting: true }) }} />
                        {settings.show_home_button ? <button type="button" disabled className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">{locale === 'ar' ? 'العودة للرئيسية' : 'Back to home'}</button> : null}
                        {category ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{locale === 'ar' ? 'منتجات مقترحة من' : 'Suggested products from'}: {category.name[locale]}</p> : null}
                    </div>
                </aside>
            </div>
            <button disabled={busy || conflict || !dirty} className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:opacity-40">{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ صفحة الشكر', 'Save thank-you page')}</button>
        </> : null}
    </form>;
}
