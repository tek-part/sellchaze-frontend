import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import DiscountTargetPicker from '../components/store/DiscountTargetPicker';
import { HiOutlineBolt, HiOutlineGift, HiOutlineReceiptPercent, HiOutlineSparkles, HiOutlineTag, HiOutlineTicket, HiOutlineTruck, HiOutlineBanknotes } from '../components/workspace/WorkspaceIcons';
import {
    discountFieldErrors, discountFormFromApi, discountMethodLabel, discountPayload, discountTypeLabel, emptyDiscountForm, generateDiscountCode, summarizeForm,
} from '../features/store/discounts';

/** Fields that render their own server error; any other key is listed in the page alert. */
const FIELD_KEYS = new Set(['code', 'title', 'value', 'target_ids', 'minimum_order_amount', 'minimum_quantity', 'bxgy.buy_quantity', 'bxgy.buy_ids', 'bxgy.get_quantity', 'bxgy.get_ids', 'bxgy.get_percent', 'bxgy.max_uses_per_order', 'starts_at', 'expires_at', 'max_uses', 'max_uses_per_customer']);

const FIELD = 'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';
const LABEL = 'mb-1 block text-sm font-medium text-slate-700';
const CARD = 'min-w-0 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card';
const HEADING = 'text-base font-semibold text-slate-900';

function FieldError({ id, message }) {
    return message ? <p id={id} className="mt-1.5 text-xs font-medium text-red-600">{message}</p> : null;
}

/** Radio cards (method / type): a native radio group styled as Shopify-like choices. */
function ChoiceCards({ name, legend, value, onChange, options, columns = 'sm:grid-cols-2' }) {
    return (
        <fieldset className="min-w-0">
            <legend className={HEADING}>{legend}</legend>
            <div className={`mt-3 grid gap-3 ${columns}`}>
                {options.map(({ value: option, title, description, Icon }) => (
                    <label key={option} className="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-slate-300 has-[:checked]:border-brand has-[:checked]:bg-brand/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30">
                        <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} className="mt-1 shrink-0 accent-brand" />
                        {Icon ? <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /> : null}
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900">{title}</span>
                            {description ? <span className="mt-0.5 block text-xs text-slate-600">{description}</span> : null}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

/** All / specific products / specific categories, plus the picker for the chosen list. */
function ScopeField({ name, legend, scope, ids, onScope, onIds, error, apiBase, names, onNames, ar, allLabel }) {
    const text = (a, e) => (ar ? a : e);
    const options = [['all', allLabel], ['products', text('منتجات محددة', 'Specific products')], ['categories', text('أقسام محددة', 'Specific categories')]];
    const pickerId = `discount-${name}-picker`;
    return (
        <fieldset className="min-w-0 space-y-2">
            <legend className="mb-1 text-sm font-medium text-slate-700">{legend}</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
                {options.map(([option, label]) => (
                    <label key={option} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input type="radio" name={name} value={option} checked={scope === option} onChange={() => { onScope(option); if (option !== scope) onIds([]); }} className="accent-brand" />
                        {label}
                    </label>
                ))}
            </div>
            {scope !== 'all' ? (
                <DiscountTargetPicker key={scope} apiBase={apiBase} kind={scope} value={ids} onChange={onIds} names={names[scope] ?? {}} onNames={onNames} ar={ar} id={pickerId}
                    label={scope === 'categories' ? text(`${legend}: الأقسام`, `${legend}: categories`) : text(`${legend}: المنتجات`, `${legend}: products`)} error={error} invalid={Boolean(error)} />
            ) : error ? <FieldError id={`${pickerId}-error`} message={error} /> : null}
        </fieldset>
    );
}

export default function StoreCouponFormPage() {
    const { couponId } = useParams();
    const { apiBase, uiBase } = useStoreScope();
    const { store } = useOutletContext() ?? {};
    const isEdit = Boolean(couponId);
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar');
    const text = (a, e) => (ar ? a : e);
    const navigate = useNavigate();

    const [form, setForm] = useState(emptyDiscountForm);
    const [names, setNames] = useState({ products: {}, categories: {} });
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [errors, setErrors] = useState({});

    const addNames = useCallback((kind, map) => setNames((current) => ({ ...current, [kind]: { ...current[kind], ...map } })), []);

    useEffect(() => {
        if (!isEdit) return undefined;
        let active = true; setErr(''); setLoading(true);
        api.get(`${apiBase}/coupons/${couponId}`)
            .then(({ data }) => { if (active) setForm(discountFormFromApi(data.data)); })
            .catch((e) => { if (active) setErr(e.response?.data?.message || e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, couponId, isEdit]);

    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const fieldProps = (key, id) => ({
        id, 'aria-invalid': errors[key] ? 'true' : undefined, 'aria-describedby': errors[key] ? `${id}-error` : undefined,
        className: `${FIELD} ${errors[key] ? 'border-red-300' : 'border-slate-200'}`,
    });

    const money = (value) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: store?.currency || 'EGP', maximumFractionDigits: 2 }).format(Number(value));
    const fmtDate = (value) => new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`));
    const summary = summarizeForm(form, { ar, money, names });
    const valued = form.type === 'fixed' || form.type === 'percentage';
    const bxgy = form.type === 'buy_x_get_y';

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true); setErr(''); setErrors({});
        const payload = discountPayload(form);
        try {
            if (isEdit) await api.put(`${apiBase}/coupons/${couponId}`, payload);
            else await api.post(`${apiBase}/coupons`, payload);
            toast.success(text('تم حفظ الخصم', 'Discount saved'));
            navigate(`${uiBase}/coupons`);
        } catch (e2) {
            const fields = discountFieldErrors(e2.response?.data?.errors);
            const others = Object.entries(fields).filter(([key]) => !FIELD_KEYS.has(key)).map(([, message]) => message);
            setErrors(fields);
            setErr(Object.keys(fields).length
                ? [text('راجع الحقول المظللة.', 'Fix the highlighted fields.'), ...others].join(' ')
                : (e2.response?.data?.message || e2.message));
        } finally {
            setSaving(false);
        }
    };

    const methodOptions = [
        { value: 'code', title: text('كود خصم', 'Discount code'), description: text('يُدخله العميل عند الدفع.', 'Customers enter it at checkout.'), Icon: HiOutlineTicket },
        { value: 'automatic', title: text('خصم تلقائي', 'Automatic discount'), description: text('يُطبق تلقائيًا عند تحقق الشروط.', 'Applies by itself when the cart qualifies.'), Icon: HiOutlineBolt },
    ];
    const typeOptions = [
        { value: 'percentage', title: discountTypeLabel('percentage', ar), description: text('نسبة من سعر المنتجات.', 'A percentage off products.'), Icon: HiOutlineReceiptPercent },
        { value: 'fixed', title: discountTypeLabel('fixed', ar), description: text('مبلغ محدد من الطلب.', 'A set amount off the order.'), Icon: HiOutlineBanknotes },
        { value: 'free_shipping', title: discountTypeLabel('free_shipping', ar), description: text('يلغي رسوم الشحن.', 'Removes the shipping fee.'), Icon: HiOutlineTruck },
        { value: 'buy_x_get_y', title: discountTypeLabel('buy_x_get_y', ar), description: text('اشترِ كمية واحصل على منتجات مجانًا أو بخصم.', 'Buy a quantity, get items free or discounted.'), Icon: HiOutlineGift },
    ];
    const requirementOptions = [['none', text('بدون حد أدنى', 'No minimum requirements')], ['amount', text('حد أدنى لقيمة الطلب', 'Minimum purchase amount')], ['quantity', text('حد أدنى لعدد القطع', 'Minimum quantity of items')]];

    const usageLines = [
        form.max_uses ? text(`يُستخدم ${form.max_uses} مرات إجمالًا`, `Limited to ${form.max_uses} uses in total`) : text('استخدامات غير محدودة', 'Unlimited uses'),
        form.max_uses_per_customer ? text(`${form.max_uses_per_customer} مرات لكل عميل`, `${form.max_uses_per_customer} per customer`) : null,
        form.starts_at ? text(`يبدأ ${fmtDate(form.starts_at)}`, `Starts ${fmtDate(form.starts_at)}`) : text('يبدأ فور الحفظ', 'Starts when saved'),
        form.expires_at ? text(`ينتهي ${fmtDate(form.expires_at)}`, `Ends ${fmtDate(form.expires_at)}`) : null,
    ].filter(Boolean);
    const name = form.method === 'code' ? form.code.trim().toUpperCase() : form.title.trim();

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{isEdit ? text('تعديل الخصم', 'Edit discount') : text('إنشاء خصم', 'Create discount')}</h1>
                </div>
                <Link to={`${uiBase}/coupons`} className="text-sm font-medium text-slate-700 hover:text-slate-900">{text('→ الخصومات', '← Discounts')}</Link>
            </div>
            {err ? <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
            {loading ? <p role="status" className="text-sm text-slate-600">{text('جارٍ التحميل…', 'Loading…')}</p> : null}

            <form onSubmit={submit} noValidate className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]" aria-busy={loading || saving}>
                <div className="min-w-0 space-y-5">
                    <section className={CARD}>
                        <ChoiceCards name="method" legend={text('طريقة الخصم', 'Method')} value={form.method} onChange={(value) => set('method', value)} options={methodOptions} />
                        {form.method === 'code' ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="min-w-0">
                                    <label htmlFor="discount-code" className={LABEL}>{text('كود الخصم', 'Discount code')}</label>
                                    <div className="flex gap-2">
                                        <input {...fieldProps('code', 'discount-code')} required dir="ltr" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} className={`${fieldProps('code', 'discount-code').className} min-w-0 font-mono`} placeholder="SUMMER10" maxLength={50} />
                                        <button type="button" onClick={() => set('code', generateDiscountCode())} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                            <HiOutlineSparkles aria-hidden className="h-4 w-4" />{text('توليد', 'Generate')}
                                        </button>
                                    </div>
                                    <FieldError id="discount-code-error" message={errors.code} />
                                </div>
                                <div className="min-w-0">
                                    <label htmlFor="discount-title" className={LABEL}>{text('اسم يظهر للعميل (اختياري)', 'Name shown to customers (optional)')}</label>
                                    <input {...fieldProps('title', 'discount-title')} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={120} />
                                    <FieldError id="discount-title-error" message={errors.title} />
                                </div>
                            </div>
                        ) : (
                            <div className="min-w-0">
                                <label htmlFor="discount-title" className={LABEL}>{text('عنوان الخصم', 'Title')}</label>
                                <input {...fieldProps('title', 'discount-title')} required value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={120} placeholder={text('تخفيضات الخريف', 'Autumn sale')} />
                                <p className="mt-1.5 text-xs text-slate-600">{text('يراه العملاء في ملخص الطلب.', 'Customers see it in the order summary.')}</p>
                                <FieldError id="discount-title-error" message={errors.title} />
                            </div>
                        )}
                    </section>

                    <section className={CARD}>
                        <ChoiceCards name="type" legend={text('نوع الخصم', 'Discount type')} value={form.type} onChange={(value) => set('type', value)} options={typeOptions} />
                        {valued ? (
                            <div className="space-y-4">
                                <div className="max-w-xs">
                                    <label htmlFor="discount-value" className={LABEL}>{form.type === 'percentage' ? text('نسبة الخصم (%)', 'Percentage (%)') : text('قيمة الخصم', 'Amount')}</label>
                                    <input {...fieldProps('value', 'discount-value')} required type="number" inputMode="decimal" step="0.01" min="0.01" max={form.type === 'percentage' ? 100 : undefined} value={form.value} onChange={(e) => set('value', e.target.value)} />
                                    <FieldError id="discount-value-error" message={errors.value} />
                                </div>
                                <ScopeField name="applies_to" legend={text('ينطبق على', 'Applies to')} allLabel={text('كل المنتجات', 'All products')} scope={form.applies_to} ids={form.target_ids}
                                    onScope={(value) => set('applies_to', value)} onIds={(value) => set('target_ids', value)} error={errors.target_ids} apiBase={apiBase} names={names} onNames={addNames} ar={ar} />
                            </div>
                        ) : null}
                    </section>

                    {bxgy ? (
                        <section className={CARD} aria-labelledby="discount-bxgy-heading">
                            <h2 id="discount-bxgy-heading" className={HEADING}>{text('اشترِ X واحصل على Y', 'Buy X get Y')}</h2>
                            <div className="space-y-3 rounded-xl border border-slate-100 p-4">
                                <h3 className="text-sm font-semibold text-slate-900">{text('العميل يشتري', 'Customer buys')}</h3>
                                <div className="max-w-[10rem]">
                                    <label htmlFor="discount-buy-quantity" className={LABEL}>{text('الكمية', 'Quantity')}</label>
                                    <input {...fieldProps('bxgy.buy_quantity', 'discount-buy-quantity')} type="number" min="1" max="99" value={form.buy_quantity} onChange={(e) => set('buy_quantity', e.target.value)} />
                                    <FieldError id="discount-buy-quantity-error" message={errors['bxgy.buy_quantity']} />
                                </div>
                                <ScopeField name="buy_applies_to" legend={text('من', 'From')} allLabel={text('أي منتج', 'Any product')} scope={form.buy_applies_to} ids={form.buy_ids}
                                    onScope={(value) => set('buy_applies_to', value)} onIds={(value) => set('buy_ids', value)} error={errors['bxgy.buy_ids']} apiBase={apiBase} names={names} onNames={addNames} ar={ar} />
                            </div>
                            <div className="space-y-3 rounded-xl border border-slate-100 p-4">
                                <h3 className="text-sm font-semibold text-slate-900">{text('العميل يحصل على', 'Customer gets')}</h3>
                                <div className="max-w-[10rem]">
                                    <label htmlFor="discount-get-quantity" className={LABEL}>{text('الكمية', 'Quantity')}</label>
                                    <input {...fieldProps('bxgy.get_quantity', 'discount-get-quantity')} type="number" min="1" max="99" value={form.get_quantity} onChange={(e) => set('get_quantity', e.target.value)} />
                                    <FieldError id="discount-get-quantity-error" message={errors['bxgy.get_quantity']} />
                                </div>
                                <ScopeField name="get_applies_to" legend={text('من', 'From')} allLabel={text('أي منتج', 'Any product')} scope={form.get_applies_to} ids={form.get_ids}
                                    onScope={(value) => set('get_applies_to', value)} onIds={(value) => set('get_ids', value)} error={errors['bxgy.get_ids']} apiBase={apiBase} names={names} onNames={addNames} ar={ar} />
                                <fieldset className="space-y-2">
                                    <legend className="mb-1 text-sm font-medium text-slate-700">{text('بقيمة', 'At a discounted value')}</legend>
                                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="radio" name="get_reward" checked={form.get_free} onChange={() => set('get_free', true)} className="accent-brand" />{text('مجانًا', 'Free')}</label>
                                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="radio" name="get_reward" checked={!form.get_free} onChange={() => set('get_free', false)} className="accent-brand" />{text('نسبة خصم', 'Percentage off')}</label>
                                    </div>
                                    {!form.get_free ? (
                                        <div className="max-w-[10rem]">
                                            <label htmlFor="discount-get-percent" className={LABEL}>{text('نسبة الخصم (%)', 'Percentage (%)')}</label>
                                            <input {...fieldProps('bxgy.get_percent', 'discount-get-percent')} type="number" min="1" max="100" value={form.get_percent} onChange={(e) => set('get_percent', e.target.value)} />
                                        </div>
                                    ) : null}
                                    <FieldError id="discount-get-percent-error" message={errors['bxgy.get_percent']} />
                                </fieldset>
                                <div className="max-w-xs">
                                    <label htmlFor="discount-max-per-order" className={LABEL}>{text('أقصى عدد مرات لكل طلب (اختياري)', 'Maximum uses per order (optional)')}</label>
                                    <input {...fieldProps('bxgy.max_uses_per_order', 'discount-max-per-order')} type="number" min="1" max="99" value={form.max_uses_per_order} onChange={(e) => set('max_uses_per_order', e.target.value)} placeholder={text('غير محدود', 'Unlimited')} />
                                    <FieldError id="discount-max-per-order-error" message={errors['bxgy.max_uses_per_order']} />
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section className={CARD}>
                            <fieldset className="min-w-0 space-y-2">
                                <legend className={HEADING}>{text('الحد الأدنى للشراء', 'Minimum purchase requirements')}</legend>
                                {requirementOptions.map(([option, label]) => (
                                    <label key={option} className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-slate-700">
                                        <input type="radio" name="requirement" checked={form.requirement === option} onChange={() => set('requirement', option)} className="accent-brand" />{label}
                                    </label>
                                ))}
                                {form.requirement === 'amount' ? (
                                    <div className="max-w-xs pt-1">
                                        <label htmlFor="discount-min-amount" className={LABEL}>{text('أقل قيمة للطلب', 'Minimum amount')}</label>
                                        <input {...fieldProps('minimum_order_amount', 'discount-min-amount')} type="number" inputMode="decimal" step="0.01" min="0" value={form.minimum_order_amount} onChange={(e) => set('minimum_order_amount', e.target.value)} />
                                        <FieldError id="discount-min-amount-error" message={errors.minimum_order_amount} />
                                    </div>
                                ) : null}
                                {form.requirement === 'quantity' ? (
                                    <div className="max-w-xs pt-1">
                                        <label htmlFor="discount-min-quantity" className={LABEL}>{text('أقل عدد قطع', 'Minimum quantity of items')}</label>
                                        <input {...fieldProps('minimum_quantity', 'discount-min-quantity')} type="number" min="1" max="999" value={form.minimum_quantity} onChange={(e) => set('minimum_quantity', e.target.value)} />
                                        <FieldError id="discount-min-quantity-error" message={errors.minimum_quantity} />
                                    </div>
                                ) : null}
                            </fieldset>
                        </section>
                    )}

                    <section className={CARD} aria-labelledby="discount-limits-heading">
                        <h2 id="discount-limits-heading" className={HEADING}>{text('حدود الاستخدام', 'Usage limits')}</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="min-w-0">
                                <label htmlFor="discount-max-uses" className={LABEL}>{text('أقصى عدد استخدامات', 'Total number of uses')}</label>
                                <input {...fieldProps('max_uses', 'discount-max-uses')} type="number" min="1" value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} placeholder={text('غير محدود', 'Unlimited')} />
                                <FieldError id="discount-max-uses-error" message={errors.max_uses} />
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="discount-max-per-customer" className={LABEL}>{text('أقصى استخدام لكل عميل', 'Uses per customer')}</label>
                                <input {...fieldProps('max_uses_per_customer', 'discount-max-per-customer')} type="number" min="1" value={form.max_uses_per_customer} onChange={(e) => set('max_uses_per_customer', e.target.value)} placeholder={text('غير محدود', 'Unlimited')} />
                                <FieldError id="discount-max-per-customer-error" message={errors.max_uses_per_customer} />
                            </div>
                        </div>
                    </section>

                    <section className={CARD} aria-labelledby="discount-dates-heading">
                        <h2 id="discount-dates-heading" className={HEADING}>{text('فترة التفعيل', 'Active dates')}</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="min-w-0">
                                <label htmlFor="discount-starts" className={LABEL}>{text('تاريخ البدء', 'Start date')}</label>
                                <input {...fieldProps('starts_at', 'discount-starts')} type="date" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
                                <FieldError id="discount-starts-error" message={errors.starts_at} />
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="discount-expires" className={LABEL}>{text('تاريخ الانتهاء (اختياري)', 'End date (optional)')}</label>
                                <input {...fieldProps('expires_at', 'discount-expires')} type="date" value={form.expires_at} min={form.starts_at || undefined} onChange={(e) => set('expires_at', e.target.value)} />
                                <FieldError id="discount-expires-error" message={errors.expires_at} />
                            </div>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-brand" />
                            <span className="text-sm text-slate-700">{text('مفعّل', 'Active')}</span>
                        </label>
                    </section>
                </div>

                <aside className="min-w-0 space-y-4 lg:sticky lg:top-4">
                    <section className={CARD} aria-labelledby="discount-summary-heading">
                        <h2 id="discount-summary-heading" className={HEADING}>{text('الملخص', 'Summary')}</h2>
                        <div className="flex min-w-0 items-start gap-2">
                            <HiOutlineTag aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
                            <div className="min-w-0">
                                <p className={`break-words text-sm font-semibold text-slate-900 ${form.method === 'code' && name ? 'font-mono' : ''}`} dir={form.method === 'code' && name ? 'ltr' : undefined}>
                                    {name || (form.method === 'code' ? text('لا يوجد كود بعد', 'No code yet') : text('بدون عنوان بعد', 'No title yet'))}
                                </p>
                                <p className="text-xs text-slate-600">{discountMethodLabel(form.method, ar)} · {discountTypeLabel(form.type, ar)}</p>
                            </div>
                        </div>
                        <p className="break-words text-sm text-slate-800" data-discount-summary aria-live="polite">{summary}</p>
                        <ul className="list-disc space-y-1 ps-5 text-sm text-slate-700">
                            {usageLines.map((line) => <li key={line}>{line}</li>)}
                            <li>{form.is_active ? text('مفعّل', 'Active') : text('غير مفعّل', 'Inactive')}</li>
                        </ul>
                    </section>
                    <div className="flex gap-2">
                        <button type="submit" disabled={saving || loading} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                            {saving ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ الخصم', 'Save discount')}
                        </button>
                        <button type="button" onClick={() => navigate(`${uiBase}/coupons`)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
                            {text('إلغاء', 'Cancel')}
                        </button>
                    </div>
                </aside>
            </form>
        </div>
    );
}
