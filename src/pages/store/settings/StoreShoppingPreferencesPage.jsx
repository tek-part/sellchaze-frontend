import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import useStoreContext from '../../../hooks/useStoreContext';
import { useDirty } from '../../../hooks/useStoreSettings';

const failureText = (failure) => Object.values(failure.response?.data?.errors || {}).flat().join(' ') || failure.response?.data?.message || failure.message;

export default function StoreShoppingPreferencesPage() {
    const context = useStoreContext();
    return <Editor key={context.apiBase} context={context} />;
}

function Editor({ context: { apiBase, uiBase, access } }) {
    const { i18n } = useTranslation();
    const text = (ar, en) => i18n.language.startsWith('ar') ? ar : en;
    const [settings, setSettings] = useState(null);
    const [automatic, setAutomatic] = useState(true);
    const [automaticRegion, setAutomaticRegion] = useState(true);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);
    const [reload, setReload] = useState(0);
    const working = useRef(false);
    const dirty = useDirty(settings ? { automatic: settings.auto_select_variants, automaticRegion: settings.auto_select_shipping_region } : null, settings ? { automatic, automaticRegion } : null);
    const apply = (data) => { setSettings(data); setAutomatic(data.auto_select_variants); setAutomaticRegion(data.auto_select_shipping_region); };
    const errorText = (failure) => failure.response?.status === 409
        ? text('تغيّرت الإعدادات في جلسة أخرى. أعد تحميلها قبل الحفظ.', 'Settings changed in another session. Reload them before saving.')
        : failureText(failure);
    useEffect(() => {
        let active = true;
        if (!access.canStoreSettings) return undefined;
        api.get(`${apiBase}/shopping-preferences`).then(({ data }) => { if (active) apply(data.data); }).catch((failure) => { if (active) setError(failureText(failure)); });
        return () => { active = false; };
    }, [apiBase, access.canStoreSettings, reload]);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    async function save(event) {
        event.preventDefault();
        if (working.current || !settings) return;
        working.current = true; setBusy(true); setError(''); setSaved(false);
        try {
            const { data } = await api.put(`${apiBase}/shopping-preferences`, { auto_select_variants: automatic, auto_select_shipping_region: automaticRegion, version: settings.version });
            apply(data.data); setSaved(true);
        } catch (failure) { setError(errorText(failure)); }
        finally { working.current = false; setBusy(false); }
    }
    return <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader title={text('خيارات الشراء', 'Shopping preferences')} subtitle={text('حدد طريقة بدء اختيار خيارات المنتج ومنطقة التوصيل في متجرك.', 'Choose how product options and delivery region selection start in your store.')} />
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{text('تم حفظ خيارات الشراء.', 'Shopping preferences saved.')}</p> : null}
        <button type="button" disabled={busy} className="text-sm underline" onClick={() => { setError(''); setSaved(false); setReload((n) => n + 1); }}>{text('إعادة تحميل الإعدادات', 'Reload settings')}</button>
        {!settings && !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {settings ? <form onSubmit={save} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <fieldset disabled={busy}>
                <label className="flex items-start gap-3 font-semibold">
                    <input type="checkbox" className="mt-1" checked={!automatic} onChange={(event) => { setAutomatic(!event.target.checked); setSaved(false); }} aria-describedby="variant-selection-help" />
                    {text('إيقاف الاختيار التلقائي للمتغيرات', 'Disable automatic variant selection')}
                </label>
                <p id="variant-selection-help" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{text('عند تفعيله يبدأ المنتج دون لون أو مقاس محدد، ويختار العميل جميع الخيارات قبل الإضافة أو الطلب. عند إيقافه يُختار أول متغير متاح. ينطبق على صفحة المنتج والبطاقات وصفحات البيع بعد تحديث الصفحة؛ تبقى اختيارات السلة الحالية كما هي.', 'When enabled, products start without a selected color or size and customers choose all options before adding or ordering. Otherwise, the first available variant is selected. Applies to product pages, cards and sales pages after refresh; current cart selections are retained.')}</p>
                <label className="mt-6 flex items-start gap-3 font-semibold">
                    <input type="checkbox" className="mt-1" checked={!automaticRegion} onChange={(event) => { setAutomaticRegion(!event.target.checked); setSaved(false); }} aria-describedby="region-selection-help" />
                    {text('إيقاف الاختيار التلقائي لمناطق الشحن', 'Disable automatic delivery region selection')}
                </label>
                <p id="region-selection-help" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{text('عند تفعيله يختار العميل منطقة التوصيل قبل حساب الإجمالي. عند إيقافه تبدأ المنطقة الأولى المفعّلة حسب ترتيب العرض محددة. هذا هو الإعداد نفسه الموجود في صفحة الشحن، ولا يغيّر أسعار المناطق أو خيار الشحن الافتراضي. ينطبق على الطلبات التي تحتاج إلى شحن بعد تحديث الصفحة.', 'When enabled, customers choose a delivery region before totals are calculated. Otherwise, the first enabled region in display order starts selected. This is the same setting as the shipping page and does not change regional prices or the default shipping method. Applies to orders requiring shipping after refresh.')}</p>
            </fieldset>
            <button disabled={busy || !dirty} className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:opacity-40">{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ خيارات الشراء', 'Save shopping preferences')}</button>
        </form> : null}
    </div>;
}
