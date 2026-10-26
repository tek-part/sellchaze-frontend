import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import useStoreContext from '../../hooks/useStoreContext';
import { useAppCopy } from './StoreAppsPage';
import { PROTECTION_RULES, protectionRuleLabel } from '../../lib/order-protection';
import './merchant-apps.css';
import './merchant-app-settings.css';

const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const translated = (value, ar) => typeof value === 'object' ? value?.[ar ? 'ar' : 'en'] || Object.values(value || {})[0] : value;
const numeric = (value) => value === '' ? '' : Number(value);

const APPS = {
    'social-proof': { title: ['إشعارات المبيعات', 'Sales notifications'], description: ['إشعارات من طلبات متجرك الحقيقية الحديثة، دون أي بيانات تواصل للعملاء.', 'Notifications from your real recent orders, without any customer contact details.'] },
    'country-restriction': { title: ['تقييد الطلبات حسب الدولة', 'Restrict orders by country'], description: ['اقبل الطلبات لدول التوصيل التي تختارها فقط، أو امنع دولًا محددة.', 'Accept orders only for the delivery countries you choose, or block specific countries.'] },
    'fake-orders': { title: ['الحماية من الطلبات الوهمية', 'Fake order protection'], description: ['قواعد تميّز الطلبات المشبوهة للمراجعة أو توقفها برسالة لطيفة.', 'Rules that flag suspicious orders for review or stop them with a polite message.'] },
    bundles: { title: ['حزم المنتجات', 'Product bundles'], description: ['عروض "يُشترى معًا" من 2 إلى 4 منتجات بخصم يُطبّق تلقائيًا عند إتمام الطلب.', '"Frequently bought together" offers of two to four products with a discount applied automatically at checkout.'] },
};

export default function StoreAppSettingsPage() {
    const context = useStoreContext();
    const { app } = useParams();
    return <AppSettings key={`${context.apiBase}:${app}`} context={context} app={app} />;
}

function AppSettings({ context: { apiBase, uiBase, access }, app }) {
    const { ar, text } = useAppCopy();
    const definition = APPS[app];
    const allowed = Boolean(definition) && access.canStoreSettings && (app !== 'bundles' || access.canStoreCoupons);
    const [draft, setDraft] = useState(null);const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);const [busy, setBusy] = useState(false);const [error, setError] = useState('');const [message, setMessage] = useState('');const [reload, setReload] = useState(0);
    const working = useRef(false);
    useEffect(() => {
        if (!allowed) return undefined;
        let active = true;setLoading(true);setError('');
        api.get(`${apiBase}/apps/${app}/settings`).then(({ data }) => { if (active) { setDraft(data.data);setMeta(data.meta || {}); } })
            .catch((failure) => { if (active) setError(errorText(failure)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [allowed, apiBase, app, reload]);
    if (!allowed) return <Navigate to={`${uiBase}/apps`} replace />;
    const update = (changes) => { setMessage('');setDraft((before) => ({ ...before, ...changes })); };
    const save = async (event) => {
        event.preventDefault();if (working.current) return;working.current = true;setBusy(true);setError('');setMessage('');
        try { const { data } = await api.put(`${apiBase}/apps/${app}/settings`, draft);setDraft(data.data);setMeta(data.meta || {});setMessage(text('تم حفظ الإعدادات', 'Settings saved')); }
        catch (failure) { setError(errorText(failure)); } finally { working.current = false;setBusy(false); }
    };
    const Form = { 'social-proof': SocialProofForm, 'country-restriction': CountryRestrictionForm, 'fake-orders': FakeOrdersForm, bundles: BundlesForm }[app];
    return <div className="ws-apps-page ws-app-settings" dir={ar ? 'rtl' : 'ltr'}>
        <header className="ws-apps-page-header"><div><h1>{text(...definition.title)}</h1><p>{text(...definition.description)}</p></div><Link to={`${uiBase}/apps/${app}`}>{text('تفاصيل التطبيق', 'App details')}</Link></header>
        {error ? <div className="ws-apps-error" role="alert">{error} <button type="button" disabled={busy} onClick={() => setReload((value) => value + 1)}>{text('إعادة تحميل الإعدادات', 'Reload settings')}</button></div> : null}
        {message ? <p className="ws-apps-success" role="status">{message}</p> : null}
        {loading ? <p role="status">{text('جارٍ تحميل الإعدادات…', 'Loading settings…')}</p> : draft ? <form onSubmit={save}><fieldset disabled={busy}>
            <Form draft={draft} update={update} meta={meta} text={text} ar={ar} apiBase={apiBase} access={access} />
            <button type="submit" className="ws-apps-primary">{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button>
        </fieldset></form> : null}
    </div>;
}

function Switch({ checked, onChange, children, disabled = false }) {
    return <label className="ws-apps-check"><input type="checkbox" role="switch" checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />{children}</label>;
}

function NumberField({ label, value, min, max, onChange }) {
    return <label className="ws-apps-field">{label}<input type="number" inputMode="numeric" min={min} max={max} step="1" required value={value} onChange={(event) => onChange(numeric(event.target.value))} /></label>;
}

function LocalizedFields({ value, onChange, label, text, maxLength = 300 }) {
    return <div className="ws-app-settings-grid">{['ar', 'en'].map((locale) => <label className="ws-apps-field" key={locale}>{label} — {locale === 'ar' ? 'العربية' : 'English'}<input dir={locale === 'ar' ? 'rtl' : 'ltr'} maxLength={maxLength} value={value?.[locale] || ''} placeholder={text('اختياري: تُستخدم رسالة افتراضية مهذبة', 'Optional: a polite default is used')} onChange={(event) => onChange({ ...value, [locale]: event.target.value })} /></label>)}</div>;
}

function SocialProofForm({ draft, update, meta, text }) {
    const pages = [['home', text('الصفحة الرئيسية', 'Home page')], ['product', text('صفحات المنتجات', 'Product pages')], ['collection', text('الأقسام والمجموعات والبحث', 'Categories, collections and search')], ['cart', text('السلة', 'Cart')]];
    const sample = [draft.show_initial ? 'M.' : '', draft.show_city ? text('من القاهرة', 'in Cairo') : ''].filter(Boolean).join(' ') || text('شخص', 'Someone');
    return <>
        <Switch checked={draft.enabled} onChange={(enabled) => update({ enabled })}>{text('تفعيل إشعارات المبيعات', 'Enable sales notifications')}</Switch>
        <div className="ws-app-settings-grid">
            <NumberField label={text('الطلبات خلال آخر (أيام)', 'Orders from the last (days)')} min={1} max={90} value={draft.lookback_days} onChange={(lookback_days) => update({ lookback_days })} />
            <NumberField label={text('أقصى عدد إشعارات لكل زيارة', 'Maximum notifications per visit')} min={1} max={20} value={draft.max_events} onChange={(max_events) => update({ max_events })} />
            <NumberField label={text('أول إشعار بعد (ثوانٍ)', 'First notification after (seconds)')} min={0} max={120} value={draft.first_delay_seconds} onChange={(first_delay_seconds) => update({ first_delay_seconds })} />
            <NumberField label={text('الفاصل بين الإشعارات (ثوانٍ)', 'Time between notifications (seconds)')} min={8} max={600} value={draft.interval_seconds} onChange={(interval_seconds) => update({ interval_seconds })} />
            <NumberField label={text('مدة ظهور الإشعار (ثوانٍ)', 'Notification visible for (seconds)')} min={3} max={20} value={draft.display_seconds} onChange={(display_seconds) => update({ display_seconds })} />
            <label className="ws-apps-field">{text('موضع الإشعار على الكمبيوتر', 'Desktop position')}<select value={draft.position} onChange={(event) => update({ position: event.target.value })}><option value="bottom-start">{text('أسفل البداية (يمين في العربية)', 'Bottom start (left in English)')}</option><option value="bottom-end">{text('أسفل النهاية (يسار في العربية)', 'Bottom end (right in English)')}</option></select></label>
        </div>
        <fieldset className="ws-app-settings-group"><legend>{text('الصفحات التي يظهر فيها', 'Pages that show notifications')}</legend>{pages.map(([key, label]) => <Switch key={key} checked={draft.pages[key]} onChange={(value) => update({ pages: { ...draft.pages, [key]: value } })}>{label}</Switch>)}<p className="ws-apps-note">{text('لا تظهر الإشعارات أبدًا في صفحة إتمام الطلب. على الهاتف تظهر أعلى الشاشة حتى لا تغطي أزرار الشراء.', 'Notifications never appear at checkout. On phones they appear at the top so they never cover buy buttons.')}</p></fieldset>
        <fieldset className="ws-app-settings-group"><legend>{text('ما يظهر في الإشعار', 'What a notification shows')}</legend>
            <Switch checked={draft.show_initial} onChange={(show_initial) => update({ show_initial })}>{text('الحرف الأول من الاسم الأول', 'First initial of the first name')}</Switch>
            <Switch checked={draft.show_city} onChange={(show_city) => update({ show_city })}>{text('المدينة', 'City')}</Switch>
            <Switch checked={draft.show_time} onChange={(show_time) => update({ show_time })}>{text('منذ متى تم الطلب', 'How long ago the order was placed')}</Switch>
        </fieldset>
        <p className="ws-app-settings-preview" aria-label={text('معاينة', 'Preview')}>{sample} {text('اشترى', 'bought')} <strong>{text('اسم المنتج', 'Product name')}</strong>{draft.show_time ? <small>{text('قبل 5 دقائق', '5 minutes ago')}</small> : null}</p>
        <p className="ws-apps-note">{text('تعتمد الإشعارات على طلبات حقيقية من متجرك فقط، ولا تعرض الهاتف أو البريد أو العنوان أو الاسم الكامل.', 'Notifications use only real orders from your store and never show a phone, email, address or full name.')}</p>
        {meta.viewers_available === false ? <p className="ws-apps-note">{text('عدد "الزوار الذين يشاهدون الآن" غير متاح لأن المنصة لا تسجّل الزيارات الحية لكل منتج، ولن نعرض أرقامًا غير حقيقية.', '"People viewing now" counts are not offered: the platform does not record live visits per product, and we never show invented numbers.')}</p> : null}
    </>;
}

function CountryRestrictionForm({ draft, update, meta, text, ar }) {
    const names = useMemo(() => { try { return new Intl.DisplayNames([ar ? 'ar' : 'en'], { type: 'region' }); } catch { return null; } }, [ar]);
    const name = (code) => names?.of(code) || code;
    const options = useMemo(() => (meta.countries || []).filter((code) => !draft.countries.includes(code)).map((code) => [code, names?.of(code) || code]).sort((a, b) => a[1].localeCompare(b[1], ar ? 'ar' : 'en')), [meta.countries, draft.countries, ar, names]);
    return <>
        <Switch checked={draft.enabled} onChange={(enabled) => update({ enabled })}>{text('تفعيل تقييد الدول', 'Enable country restriction')}</Switch>
        <fieldset className="ws-app-settings-group"><legend>{text('نوع القائمة', 'List type')}</legend>
            <label className="ws-app-settings-radio"><input type="radio" name="country-mode" value="allow" checked={draft.mode === 'allow'} onChange={() => update({ mode: 'allow' })} />{text('قبول الطلبات لهذه الدول فقط', 'Accept orders only for these countries')}</label>
            <label className="ws-app-settings-radio"><input type="radio" name="country-mode" value="block" checked={draft.mode === 'block'} onChange={() => update({ mode: 'block' })} />{text('رفض الطلبات لهذه الدول', 'Refuse orders for these countries')}</label>
        </fieldset>
        <label className="ws-apps-field">{text('أضف دولة', 'Add a country')}<select value="" onChange={(event) => { if (event.target.value) update({ countries: [...draft.countries, event.target.value] }); }}><option value="">{text('اختر دولة', 'Choose a country')}</option>{options.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
        <ul className="ws-app-settings-chips" aria-label={text('الدول المختارة', 'Selected countries')}>{draft.countries.map((code) => <li key={code}>{name(code)} <button type="button" aria-label={`${text('إزالة', 'Remove')} ${name(code)}`} onClick={() => update({ countries: draft.countries.filter((value) => value !== code) })}>×</button></li>)}</ul>
        {!draft.countries.length ? <p className="ws-apps-note">{text('لم تُختر أي دولة بعد.', 'No countries selected yet.')}</p> : null}
        <Switch checked={draft.check_ip} disabled={!meta.ip_lookup_available && !draft.check_ip} onChange={(check_ip) => update({ check_ip })}>{text('التحقق أيضًا من دولة الزائر حسب عنوان IP', 'Also check the visitor IP country')}</Switch>
        <p className="ws-apps-note">{meta.ip_lookup_available ? text('دولة التوصيل هي الأساس دائمًا. لا يُرفض أي طلب إذا تعذّر تحديد دولة الزائر.', 'The delivery country always decides. An order is never refused when the visitor country cannot be determined.') : text('قاعدة بيانات دول IP غير متوفرة على الخادم حاليًا، لذلك يُطبّق التقييد حسب دولة التوصيل فقط.', 'The IP country database is not available on the server, so the restriction uses the delivery country only.')}</p>
        <LocalizedFields value={draft.message} onChange={(message) => update({ message })} label={text('رسالة للعميل', 'Message for shoppers')} text={text} />
        <p className="ws-apps-note">{text('عند التفعيل يصبح حقل الدولة مطلوبًا في نموذج الطلب، ولا تظهر مناطق التوصيل في الدول المرفوضة.', 'When enabled, the country field becomes required at checkout and delivery regions in refused countries are hidden.')}</p>
    </>;
}

function FakeOrdersForm({ draft, update, meta, text, ar }) {
    const rule = (key, changes) => update({ rules: { ...draft.rules, [key]: { ...draft.rules[key], ...changes } } });
    const classifications = { high_risk: text('مخاطر مرتفعة', 'High risk'), moderate_risk: text('مخاطر متوسطة', 'Moderate risk'), spam: text('طلب مزعج', 'Spam') };
    const [words, setWords] = useState(() => draft.rules.blocked_words.words.join('\n'));
    return <>
        <Switch checked={draft.enabled} onChange={(enabled) => update({ enabled })}>{text('تفعيل الحماية من الطلبات الوهمية', 'Enable fake order protection')}</Switch>
        <label className="ws-apps-field">{text('تصنيف الطلبات المميّزة', 'Classification for flagged orders')}<select value={draft.flag_classification} onChange={(event) => update({ flag_classification: event.target.value })}>{(meta.classifications || Object.keys(classifications)).map((key) => <option key={key} value={key}>{classifications[key] || key}</option>)}</select></label>
        {PROTECTION_RULES.map((key) => <fieldset className="ws-app-settings-group" key={key}><legend>{protectionRuleLabel(key, ar)}</legend>
            <Switch checked={draft.rules[key].enabled} onChange={(enabled) => rule(key, { enabled })}>{text('تفعيل القاعدة', 'Enable rule')}</Switch>
            <div className="ws-app-settings-grid">
                <label className="ws-apps-field">{text('الإجراء', 'Action')}<select value={draft.rules[key].action} onChange={(event) => rule(key, { action: event.target.value })}><option value="flag">{text('تمييز الطلب للمراجعة', 'Flag the order for review')}</option><option value="block">{text('منع الطلب برسالة لطيفة', 'Stop the order with a polite message')}</option></select></label>
                {key === 'repeat_phone' ? <><NumberField label={text('خلال (ساعات)', 'Within (hours)')} min={1} max={720} value={draft.rules[key].hours} onChange={(hours) => rule(key, { hours })} /><NumberField label={text('عدد الطلبات السابقة من نفس الهاتف', 'Previous orders from the same phone')} min={1} max={100} value={draft.rules[key].max_orders} onChange={(max_orders) => rule(key, { max_orders })} /></> : null}
                {key === 'open_cod' ? <NumberField label={text('طلبات دفع عند الاستلام مفتوحة لنفس الهاتف', 'Open cash-on-delivery orders for the same phone')} min={1} max={100} value={draft.rules[key].max_open} onChange={(max_open) => rule(key, { max_open })} /> : null}
                {key === 'high_quantity' ? <NumberField label={text('أكثر من عدد القطع', 'More than this many items')} min={1} max={10000} value={draft.rules[key].max_units} onChange={(max_units) => rule(key, { max_units })} /> : null}
            </div>
            {key === 'blocked_words' ? <label className="ws-apps-field">{text('كلمات ممنوعة (كلمة في كل سطر)', 'Blocked words (one per line)')}<textarea rows={4} value={words} onChange={(event) => { setWords(event.target.value);rule(key, { words: event.target.value.split(/\n|,|،/).map((word) => word.trim()).filter(Boolean) }); }} /></label> : null}
        </fieldset>)}
        <LocalizedFields value={draft.message} onChange={(message) => update({ message })} label={text('رسالة المنع للعميل', 'Message when an order is stopped')} text={text} />
        <p className="ws-apps-note">{text('التمييز لا يغيّر حالة الطلب أو الدفع؛ يظهر التصنيف والقاعدة التي فُعّلت في صفحة الطلب ويمكنك إزالته.', 'Flagging never changes order or payment status; the classification and the rule that fired appear on the order and you can clear them.')}</p>
    </>;
}

const newBundle = () => ({ title: { ar: '', en: '' }, product_ids: [], discount_percent: 10, active: true });

function BundlesForm({ draft, update, text, ar, apiBase, access }) {
    const [products, setProducts] = useState([]);const [search, setSearch] = useState('');const [productError, setProductError] = useState('');
    useEffect(() => {
        if (!access.canStoreProducts) return undefined;
        let active = true;
        const timer = setTimeout(() => { api.get(`${apiBase}/catalog/products`, { params: { search, per_page: 100 } }).then(({ data }) => { if (active) setProducts((before) => [...data.data, ...before.filter((row) => !data.data.some((next) => next.id === row.id))]); }).catch((failure) => { if (active) setProductError(errorText(failure)); }); }, 200);
        return () => { active = false;clearTimeout(timer); };
    }, [apiBase, search, access.canStoreProducts]);
    const productName = (id) => translated(products.find((row) => Number(row.id) === Number(id))?.name, ar) || `#${id}`;
    const change = (index, changes) => update({ bundles: draft.bundles.map((bundle, position) => position === index ? { ...bundle, ...changes } : bundle) });
    return <>
        <Switch checked={draft.enabled} onChange={(enabled) => update({ enabled })}>{text('تفعيل حزم المنتجات', 'Enable product bundles')}</Switch>
        <label className="ws-apps-field">{text('ابحث عن منتج', 'Search products')}<input type="search" value={search} disabled={!access.canStoreProducts} onChange={(event) => setSearch(event.target.value)} /></label>
        {productError ? <p role="alert" className="ws-apps-note">{productError}</p> : null}
        {draft.bundles.map((bundle, index) => <fieldset className="ws-app-settings-group" key={bundle.id || `new-${index}`}><legend>{text('حزمة', 'Bundle')} {index + 1}</legend>
            <div className="ws-app-settings-grid">{['ar', 'en'].map((locale) => <label className="ws-apps-field" key={locale}>{text('عنوان الحزمة', 'Bundle title')} — {locale === 'ar' ? 'العربية' : 'English'}<input required dir={locale === 'ar' ? 'rtl' : 'ltr'} maxLength={120} value={bundle.title[locale]} onChange={(event) => change(index, { title: { ...bundle.title, [locale]: event.target.value } })} /></label>)}</div>
            <label className="ws-apps-field">{text('أضف منتجًا إلى الحزمة', 'Add a product to the bundle')}<select value="" disabled={bundle.product_ids.length >= 4} onChange={(event) => { const id = Number(event.target.value);if (id && !bundle.product_ids.includes(id)) change(index, { product_ids: [...bundle.product_ids, id] }); }}><option value="">{text('اختر منتجًا', 'Choose a product')}</option>{products.filter((row) => !bundle.product_ids.includes(Number(row.id))).map((row) => <option key={row.id} value={String(row.id)}>{translated(row.name, ar)}</option>)}</select></label>
            <ul className="ws-app-settings-chips" aria-label={text('منتجات الحزمة', 'Bundle products')}>{bundle.product_ids.map((id) => <li key={id}>{productName(id)} <button type="button" aria-label={`${text('إزالة', 'Remove')} ${productName(id)}`} onClick={() => change(index, { product_ids: bundle.product_ids.filter((value) => value !== id) })}>×</button></li>)}</ul>
            <p className="ws-apps-note">{text('من 2 إلى 4 منتجات بدون خيارات أو تخصيص.', 'Two to four products without variants or personalization.')}</p>
            <div className="ws-app-settings-grid"><NumberField label={text('خصم الحزمة (%)', 'Bundle discount (%)')} min={1} max={90} value={bundle.discount_percent} onChange={(discount_percent) => change(index, { discount_percent })} /></div>
            <Switch checked={bundle.active} onChange={(active) => change(index, { active })}>{text('الحزمة مفعّلة', 'Bundle active')}</Switch>
            <button type="button" className="ws-apps-outlined" onClick={() => update({ bundles: draft.bundles.filter((_, position) => position !== index) })}>{text('حذف الحزمة', 'Remove bundle')}</button>
        </fieldset>)}
        <button type="button" className="ws-apps-outlined" disabled={draft.bundles.length >= 20} onClick={() => update({ bundles: [...draft.bundles, newBundle()] })}>{text('إضافة حزمة', 'Add bundle')}</button>
        <p className="ws-apps-note">{text('يُحسب خصم الحزمة على الخادم عند إتمام الطلب عندما تكون كل منتجاتها في السلة، ولا يُجمع مع كود خصم آخر.', 'The bundle discount is calculated on the server at checkout when every product is in the cart, and does not stack with another discount code.')}</p>
    </>;
}
