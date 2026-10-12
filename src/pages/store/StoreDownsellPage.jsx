import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import useStoreContext from '../../hooks/useStoreContext';
import SearchableSelect from '../../components/ui/SearchableSelect';
import './merchant-apps.css';
import './merchant-downsell.css';

const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const translated = (value, ar) => typeof value === 'object' ? value?.[ar ? 'ar' : 'en'] || Object.values(value || {})[0] : value;
export default function StoreDownsellPage() {
    const context = useStoreContext();
    return <DownsellEditor key={context.apiBase} context={context} />;
}
function DownsellEditor({ context: { apiBase, uiBase, access } }) {
    const { i18n } = useTranslation();const ar = i18n.language.startsWith('ar');const text = (a, e) => ar ? a : e;
    const allowed = access.canStoreSettings && access.canStoreCoupons;
    const [draft, setDraft] = useState(null);const [coupons, setCoupons] = useState([]);const [products, setProducts] = useState([]);
    const [couponSearch, setCouponSearch] = useState('');const [productSearch, setProductSearch] = useState('');const [couponLoading, setCouponLoading] = useState(false);const [productLoading, setProductLoading] = useState(false);
    const [loading, setLoading] = useState(true);const [busy, setBusy] = useState(false);const [error, setError] = useState('');const [couponError, setCouponError] = useState('');const [productError, setProductError] = useState('');const [message, setMessage] = useState('');const [reload, setReload] = useState(0);
    const working = useRef(false);
    useEffect(() => {
        if (!allowed) return;let active = true;setLoading(true);setError('');
        api.get(`${apiBase}/downsell`).then(({ data }) => { if (active) setDraft(data.data); }).catch((failure) => { if (active) setError(errorText(failure)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [allowed, apiBase, reload]);
    useEffect(() => {
        if (!allowed) return;let active = true;setCouponLoading(true);setCouponError('');
        const timer = setTimeout(() => { api.get(`${apiBase}/coupons`, { params: { search: couponSearch, per_page: 100 } }).then(({ data }) => { if (active) setCoupons(data.data); }).catch((failure) => { if (active) setCouponError(errorText(failure)); }).finally(() => { if (active) setCouponLoading(false); }); }, 200);
        return () => { active = false;clearTimeout(timer); };
    }, [allowed, apiBase, couponSearch, reload]);
    useEffect(() => {
        if (!allowed || !access.canStoreProducts || draft?.all_products !== false) return;let active = true;setProductLoading(true);setProductError('');
        const timer = setTimeout(() => { api.get(`${apiBase}/catalog/products`, { params: { search: productSearch, per_page: 100 } }).then(({ data }) => { if (active) setProducts(data.data); }).catch((failure) => { if (active) setProductError(errorText(failure)); }).finally(() => { if (active) setProductLoading(false); }); }, 200);
        return () => { active = false;clearTimeout(timer); };
    }, [allowed, access.canStoreProducts, apiBase, draft?.all_products, productSearch]);
    if (!allowed) return <Navigate to={`${uiBase}/apps`} replace />;
    const update = (field, value) => { setMessage('');setDraft((before) => ({ ...before, [field]: value })); };
    const coupon = coupons.find((row) => Number(row.id) === Number(draft?.coupon_id));
    const save = async (event) => {
        event.preventDefault();if (working.current) return;working.current = true;setBusy(true);setError('');setMessage('');
        try { const { data } = await api.put(`${apiBase}/downsell`, draft);setDraft(data.data);setMessage(text('تم حفظ نافذة الخصم', 'Discount popup saved')); }
        catch (failure) { setError(errorText(failure)); } finally { working.current = false;setBusy(false); }
    };
    return <div className="ws-apps-page ws-downsell-page" dir={ar ? 'rtl' : 'ltr'}>
        <header className="ws-apps-page-header"><div><h1>Downsell</h1><p>{text('اعرض كوبون خصم عند تردد العميل أو محاولة مغادرة المتجر.', 'Show a discount coupon when customers hesitate or attempt to leave.')}</p></div><Link to={`${uiBase}/apps`}>{text('التطبيقات', 'Apps')}</Link></header>
        {error ? <div className="ws-apps-error" role="alert">{error} <button type="button" disabled={busy} onClick={() => setReload((value) => value + 1)}>{text('إعادة تحميل الإعدادات', 'Reload settings')}</button></div> : null}
        {message ? <p className="ws-apps-success" role="status">{message}</p> : null}
        {loading ? <p role="status">{text('جارٍ تحميل الإعدادات…', 'Loading settings…')}</p> : draft ? <div className="ws-downsell-layout"><form onSubmit={save}><fieldset disabled={busy || loading}>
            <label className="ws-apps-check"><input type="checkbox" role="switch" checked={draft.enabled} onChange={(event) => update('enabled', event.target.checked)} />{text('تفعيل نافذة الخصم', 'Enable discount popup')}</label>
            <div className="ws-apps-field"><label htmlFor="downsell-coupon">{text('كوبون الخصم', 'Discount coupon')}</label><SearchableSelect id="downsell-coupon" value={String(draft.coupon_id || '')} onSearch={setCouponSearch} searchThreshold={-1} loading={couponLoading} onChange={(event) => update('coupon_id', event.target.value ? Number(event.target.value) : null)}><option value="">{text('اختر الكوبون', 'Choose a coupon')}</option>{draft.coupon_id && !coupon ? <option value={String(draft.coupon_id)}>{text('الكوبون المحفوظ', 'Saved coupon')} #{draft.coupon_id}</option> : null}{coupons.map((row) => <option key={row.id} value={String(row.id)}>{row.code} — {row.type === 'percentage' ? `${Number(row.value)}%` : Number(row.value)}{!row.is_active ? text(' (غير مفعّل)', ' (inactive)') : ''}</option>)}</SearchableSelect>{couponError ? <p role="alert">{couponError}</p> : null}<Link to={`${uiBase}/coupons`}>{text('إدارة الكوبونات', 'Manage coupons')}</Link></div>
            <label className="ws-apps-field">{text('متى يظهر العرض؟', 'When should the offer appear?')}<select value={draft.trigger} onChange={(event) => update('trigger', event.target.value)}><option value="both">{text('بعد وقت محدد أو عند المغادرة', 'After a delay or on exit')}</option><option value="timer">{text('بعد وقت محدد', 'After a delay')}</option><option value="exit">{text('عند محاولة المغادرة', 'On exit intent')}</option></select></label>
            <div className="ws-downsell-fields">{[['delay_seconds', text('وقت الظهور بالثواني', 'Delay in seconds'), 1, 600], ['minimum_visit_seconds', text('أقل مدة للزيارة بالثواني', 'Minimum visit in seconds'), 0, 300], ['frequency_hours', text('الفاصل بين مرات الظهور بالساعات', 'Repeat interval in hours'), 1, 720]].map(([field, label, min, max]) => <label className="ws-apps-field" key={field}>{label}<input type="number" min={min} max={max} step="1" required value={draft[field]} onChange={(event) => update(field, event.target.value)} /></label>)}</div>
            <p className="ws-apps-note">{text('محاولة المغادرة تعمل عند تحريك المؤشر خارج أعلى الصفحة على الكمبيوتر. استخدم الوقت المحدد للوصول إلى زوار الهاتف.', 'Exit intent detects the pointer leaving the top edge on desktop. Use the timer to reach phone visitors.')}</p>
            <label className="ws-apps-check"><input type="checkbox" checked={draft.cart_required} onChange={(event) => update('cart_required', event.target.checked)} />{text('الظهور فقط عند وجود منتجات في السلة', 'Show only when the cart contains products')}</label>
            <label className="ws-apps-check"><input type="checkbox" checked={draft.all_products} onChange={(event) => update('all_products', event.target.checked)} />{text('الظهور لجميع المنتجات', 'Show for all products')}</label>
            {!draft.all_products ? <div className="ws-apps-field"><label htmlFor="downsell-product">{text('منتج لظهور النافذة', 'Product that triggers the popup')}</label><SearchableSelect id="downsell-product" disabled={!access.canStoreProducts} value="" onSearch={setProductSearch} searchThreshold={-1} loading={productLoading} onChange={(event) => { const id = Number(event.target.value);if (id && !draft.product_ids.includes(id)) update('product_ids', [...draft.product_ids, id]); }}><option value="">{text('أضف منتجًا', 'Add a product')}</option>{products.map((row) => <option key={row.id} value={String(row.id)}>{translated(row.name, ar)}</option>)}</SearchableSelect>{productError ? <p role="alert">{productError}</p> : null}<div className="ws-downsell-products">{draft.product_ids.map((id) => <button type="button" key={id} onClick={() => update('product_ids', draft.product_ids.filter((value) => value !== id))}>{translated(products.find((row) => Number(row.id) === id)?.name, ar) || `#${id}`} ×</button>)}</div></div> : null}
            <p className="ws-apps-note">{text('اختيار المنتجات يحدد مكان ظهور النافذة. شروط الخصم وقيمته وحدود استخدامه تُدار من الكوبون نفسه.', 'Product selection controls where the popup appears. The coupon controls the discount and its usage limits.')}</p>
            <h2>{text('محتوى النافذة', 'Popup content')}</h2>{[['title', text('العنوان', 'Title'), 160], ['body', text('النص', 'Description'), 600], ['button', text('زر العرض', 'Offer button'), 80]].map(([field, label, maximum]) => <div className="ws-downsell-fields" key={field}>{['ar', 'en'].map((locale) => <label className="ws-apps-field" key={locale}>{label} — {locale === 'ar' ? 'العربية' : 'English'}<input required dir={locale === 'ar' ? 'rtl' : 'ltr'} maxLength={maximum} value={draft[field][locale]} onChange={(event) => update(field, { ...draft[field], [locale]: event.target.value })} /></label>)}</div>)}
            <h2>{text('ألوان النافذة', 'Popup colors')}</h2><div className="ws-downsell-colors">{[['background_color', text('الخلفية', 'Background')], ['text_color', text('النص', 'Text')], ['accent_color', text('شريط الخصم', 'Discount badge')], ['border_color', text('الإطار', 'Border')], ['button_color', text('الزر', 'Button')], ['button_text_color', text('نص الزر', 'Button text')]].map(([field, label]) => <label key={field}>{label}<input type="color" value={draft[field]} onChange={(event) => update(field, event.target.value)} /></label>)}</div>
            <button type="submit" className="ws-apps-primary">{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button>
        </fieldset></form><aside><h2>{text('معاينة النافذة', 'Popup preview')}</h2><div className="ws-downsell-preview" style={{ background: draft.background_color, color: draft.text_color, borderColor: draft.border_color }}><h3>{translated(draft.title, ar)}</h3><strong className="ws-downsell-badge" style={{ background: draft.accent_color }}>{coupon ? `${Number(coupon.value)}${coupon.type === 'percentage' ? '%' : ''}` : '—'} {text('خصم', 'off')}</strong><p>{translated(draft.body, ar)}</p><strong className="ws-downsell-preview-code" dir="ltr">{coupon?.code || text('اختر كوبونًا', 'Choose a coupon')}</strong>{Number(coupon?.minimum_order_amount) > 0 ? <p>{text('الحد الأدنى للطلب:', 'Minimum order:')} {Number(coupon.minimum_order_amount)}</p> : null}<span className="ws-downsell-preview-button" style={{ background: draft.button_color, color: draft.button_text_color }}>{translated(draft.button, ar)}</span></div><p className="ws-apps-note">{text('هذه معاينة فقط. لا يظهر العرض للعملاء حتى تحفظ الإعدادات وتفعّل كوبونًا صالحًا.', 'This is a preview. Customers see the offer only after you save and enable a valid coupon.')}</p></aside></div> : null}
    </div>;
}
