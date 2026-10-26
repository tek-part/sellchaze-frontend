import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { useDebounced } from '../hooks/useDebounced';
import useWorkspaceAppearance from '../components/workspace/useWorkspaceAppearance';
import ConfirmDialog from '../components/ConfirmDialog';
import ManualProductPicker from '../components/store/orders/ManualProductPicker';
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTrash } from '../components/workspace/WorkspaceIcons';
import {
    clampQuantity, customLine, draftPayload, emptyDraftState, mergeProductLines, parseTags, stateFromDraft, validMoney, whatsappShareUrl,
} from '../components/store/orders/draft-orders';
import { draftStatusLabel, draftStatusTone } from './StoreDraftOrdersPage';
import '../components/store/orders/draft-orders.css';

function errorText(error) {
    const messages = Object.values(error?.response?.data?.errors || {}).flat();
    return messages.length ? messages.join(' · ') : error?.response?.data?.message || error?.message || '';
}

function Field({ id, label, children, hint }) {
    return <div className="ws-draft-field"><label htmlFor={id}>{label}</label>{children}{hint ? <small>{hint}</small> : null}</div>;
}

export default function StoreDraftOrderEditorPage() {
    const { draftId } = useParams();
    const isNew = !draftId;
    const { apiBase, uiBase } = useStoreScope();
    const { permissions = [] } = useOutletContext() ?? {};
    const canManage = permissions.includes('store.orders.manage');
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar'); const text = (a, e) => (ar ? a : e);
    const { theme } = useWorkspaceAppearance();
    const navigate = useNavigate();

    const [draft, setDraft] = useState(null);
    const [state, setState] = useState(emptyDraftState);
    const [dirty, setDirty] = useState(false);
    const [options, setOptions] = useState(null);
    const [loading, setLoading] = useState(!isNew);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState('');
    const [totals, setTotals] = useState(null);
    const [calcError, setCalcError] = useState('');
    const [calculating, setCalculating] = useState(false);
    const [picker, setPicker] = useState(false);
    const [custom, setCustom] = useState(null);
    const [invoice, setInvoice] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [tagsInput, setTagsInput] = useState('');
    const searchCustomer = useDebounced(customerQuery, 300);
    const calcRun = useRef(0);

    const editable = isNew || Boolean(draft?.editable);
    const currency = draft?.currency || options?.currency || '';
    const money = (value) => {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return '—';
        try { return new Intl.NumberFormat(ar ? 'ar-EG' : 'en', currency ? { style: 'currency', currency, maximumFractionDigits: 2 } : { maximumFractionDigits: 2 }).format(amount); } catch { return amount.toFixed(2); }
    };

    useEffect(() => {
        if (!canManage) return undefined;
        let active = true;
        api.get(`${apiBase}/draft-orders/options`).then(({ data }) => { if (active) setOptions(data.data); }).catch(() => {});
        return () => { active = false; };
    }, [apiBase, canManage]);

    useEffect(() => {
        if (!canManage || isNew) { setDraft(null); setState(emptyDraftState()); setTagsInput(''); setLoading(false); return undefined; }
        let active = true; setLoading(true); setError(''); setInvoice(null);
        api.get(`${apiBase}/draft-orders/${draftId}`).then(({ data }) => {
            if (!active) return;
            setDraft(data.data); setState(stateFromDraft(data.data)); setTagsInput((data.data.tags || []).join(', ')); setTotals(data.data.totals); setDirty(false);
        }).catch((e) => { if (active) setError(errorText(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, draftId, isNew, canManage]);

    useEffect(() => {
        if (!canManage || !editable || searchCustomer.trim().length < 2) { setCustomerResults([]); return undefined; }
        let active = true;
        api.get(`${apiBase}/customers/directory`, { params: { search: searchCustomer.trim(), per_page: 5 } })
            .then(({ data }) => { if (active) setCustomerResults(data.data || []); }).catch(() => { if (active) setCustomerResults([]); });
        return () => { active = false; };
    }, [apiBase, searchCustomer, canManage, editable]);

    const payload = useMemo(() => draftPayload(state), [state]);
    const payloadKey = JSON.stringify(payload);
    const debouncedKey = useDebounced(payloadKey, 400);
    useEffect(() => {
        if (!canManage || !editable || loading) return undefined;
        const body = JSON.parse(debouncedKey);
        if (!body.line_items.length) { setTotals(null); setCalcError(''); return undefined; }
        const run = ++calcRun.current; setCalculating(true);
        const path = draft?.id ? `${apiBase}/draft-orders/${draft.id}/calculate` : `${apiBase}/draft-orders/calculate`;
        api.post(path, body).then(({ data }) => { if (run === calcRun.current) { setTotals(data.data); setCalcError(''); } })
            .catch((e) => { if (run === calcRun.current) setCalcError(errorText(e)); })
            .finally(() => { if (run === calcRun.current) setCalculating(false); });
        return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedKey, apiBase, canManage, editable, loading]);

    const change = useCallback((patch) => { setState((current) => ({ ...current, ...(typeof patch === 'function' ? patch(current) : patch) })); setDirty(true); setNotice(''); setError(''); }, []);
    const setLine = (key, patch) => change((current) => ({ lines: current.lines.map((line) => (line.key === key ? { ...line, ...patch } : line)) }));
    const lineTotal = (line, index) => totals?.line_items?.[index]?.line_total ?? (validMoney(line.unit_price) ? (Number(line.unit_price) * clampQuantity(line.quantity)).toFixed(2) : null);

    async function save() {
        if (!state.lines.length) { setError(text('أضف منتجًا أو عنصرًا مخصصًا أولًا.', 'Add a product or a custom item first.')); return null; }
        setBusy('save'); setError('');
        try {
            const { data } = isNew ? await api.post(`${apiBase}/draft-orders`, payload) : await api.put(`${apiBase}/draft-orders/${draft.id}`, payload);
            setDraft(data.data); setTotals(data.data.totals); setDirty(false);
            setNotice(text('تم حفظ المسودة.', 'Draft saved.'));
            if (isNew) navigate(`${uiBase}/draft-orders/${data.data.id}`, { replace: true });
            return data.data;
        } catch (e) { setError(errorText(e)); return null; } finally { setBusy(''); }
    }

    async function ensureSaved() {
        if (!isNew && !dirty) return draft;
        return save();
    }

    async function createInvoice() {
        const saved = await ensureSaved();
        if (!saved) return null;
        setBusy('invoice'); setError('');
        try {
            const { data } = await api.post(`${apiBase}/draft-orders/${saved.id}/invoice`, { locale: ar ? 'ar' : 'en' });
            setDraft(data.data); setInvoice(data.invoice);
            return data.invoice;
        } catch (e) { setError(errorText(e)); return null; } finally { setBusy(''); }
    }

    async function copyInvoice() {
        const link = invoice ?? await createInvoice();
        if (!link) return;
        try { await navigator.clipboard.writeText(link.url); setNotice(text('تم نسخ رابط الفاتورة.', 'Invoice link copied.')); } catch { setNotice(text('رابط الفاتورة جاهز، انسخه من الحقل.', 'Invoice link ready — copy it from the field.')); }
    }

    async function complete(paymentStatus) {
        const saved = await ensureSaved();
        if (!saved) { setConfirm(null); return; }
        setBusy('complete'); setError('');
        try {
            const { data } = await api.post(`${apiBase}/draft-orders/${saved.id}/complete`, { payment_status: paymentStatus });
            setDraft(data.data); setTotals(data.data.totals); setInvoice(null);
            setNotice(paymentStatus === 'paid' ? text(`تم إنشاء الطلب ${data.order.order_number} مدفوعًا.`, `Order ${data.order.order_number} created as paid.`) : text(`تم إنشاء الطلب ${data.order.order_number} بانتظار الدفع.`, `Order ${data.order.order_number} created with payment pending.`));
        } catch (e) { setError(errorText(e)); } finally { setBusy(''); setConfirm(null); }
    }

    async function duplicate() {
        setBusy('duplicate'); setError('');
        try {
            const { data } = await api.post(`${apiBase}/draft-orders/${draft.id}/duplicate`);
            navigate(`${uiBase}/draft-orders/${data.data.id}`);
            setNotice(text('تم إنشاء نسخة من المسودة.', 'Draft duplicated.'));
        } catch (e) { setError(errorText(e)); } finally { setBusy(''); }
    }

    async function cancelDraft() {
        setBusy('cancel'); setError('');
        try {
            const { data } = await api.post(`${apiBase}/draft-orders/${draft.id}/cancel`);
            setDraft(data.data); setInvoice(null); setNotice(text('تم إلغاء المسودة.', 'Draft cancelled.'));
        } catch (e) { setError(errorText(e)); } finally { setBusy(''); setConfirm(null); }
    }

    if (!canManage) return <p role="alert">{text('لا توجد صلاحية لإدارة الطلبات.', 'You do not have permission to manage orders.')}</p>;
    if (loading) return <p role="status" className="ws-draft-loading">{text('جارٍ تحميل المسودة…', 'Loading draft…')}</p>;
    if (!isNew && !draft) return <div className="ws-draft-editor"><p role="alert" className="ws-draft-alert">{error || text('المسودة غير موجودة.', 'Draft not found.')}</p><Link to={`${uiBase}/draft-orders`}>{text('العودة إلى المسودات', 'Back to drafts')}</Link></div>;

    const shipping = options?.shipping;
    const rateOptions = shipping?.options ?? [];
    const regions = shipping?.regions ?? [];
    const label = (value) => (typeof value === 'object' && value ? value[ar ? 'ar' : 'en'] || value.en || value.ar : value);
    const locked = Boolean(busy) || !editable;
    const message = invoice ? invoice.messages?.[ar ? 'ar' : 'en'] ?? invoice.message : '';
    const waUrl = invoice ? whatsappShareUrl(state.customer.phone, message) : '';
    const title = isNew ? text('مسودة جديدة', 'New draft') : draft.number;

    return <form className="ws-draft-editor" onSubmit={(event) => { event.preventDefault(); void save(); }} aria-busy={Boolean(busy)}>
        <header className="ws-draft-header">
            <div>
                <Link className="ws-draft-back" to={`${uiBase}/draft-orders`}>{ar ? '→' : '←'} {text('المسودات', 'Drafts')}</Link>
                <h1><span dir="ltr">{title}</span>{draft ? <span className={`ws-dt-badge ${draftStatusTone(draft.status)}`}>{draftStatusLabel(draft.status, ar)}</span> : null}</h1>
            </div>
            {editable ? <div className="ws-draft-header-actions">
                <button type="submit" className="ws-dt-button ws-dt-button-primary" disabled={locked || !state.lines.length}>{busy === 'save' ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button>
            </div> : null}
        </header>

        {error ? <div className="ws-draft-alert" role="alert">{error}</div> : null}
        {notice ? <div className="ws-draft-notice" role="status">{notice}</div> : null}
        {draft?.status === 'completed' && draft.completed_order_id ? <div className="ws-draft-notice" role="status">
            {text('تم تحويل هذه المسودة إلى طلب.', 'This draft was converted into an order.')} <Link to={`${uiBase}/orders/${draft.completed_order_id}`} dir="ltr">{draft.completed_order_number || `#${draft.completed_order_id}`}</Link>
        </div> : null}

        <div className="ws-draft-layout">
            <div className="ws-draft-main">
                <section className="ws-draft-card" aria-labelledby="draft-products">
                    <div className="ws-draft-card-head"><h2 id="draft-products">{text('المنتجات', 'Products')}</h2>
                        {editable ? <div className="ws-draft-inline-actions">
                            <button type="button" className="ws-dt-button" disabled={locked} onClick={() => setPicker(true)}>{text('تصفح المنتجات', 'Browse products')}</button>
                            <button type="button" className="ws-dt-button" disabled={locked} onClick={() => setCustom({ title: '', price: '', quantity: 1, requiresShipping: true })}>{text('عنصر مخصص', 'Custom item')}</button>
                        </div> : null}
                    </div>
                    {custom ? <div className="ws-draft-custom" role="group" aria-label={text('عنصر مخصص', 'Custom item')}>
                        <Field id="custom-title" label={text('اسم العنصر', 'Item name')}><input id="custom-title" value={custom.title} maxLength={255} onChange={(event) => setCustom({ ...custom, title: event.target.value })} /></Field>
                        <Field id="custom-price" label={text('السعر', 'Price')}><input id="custom-price" inputMode="decimal" dir="ltr" value={custom.price} onChange={(event) => setCustom({ ...custom, price: event.target.value })} /></Field>
                        <Field id="custom-qty" label={text('الكمية', 'Quantity')}><input id="custom-qty" type="number" min="1" max="999" value={custom.quantity} onChange={(event) => setCustom({ ...custom, quantity: event.target.value })} /></Field>
                        <label className="ws-draft-check"><input type="checkbox" checked={custom.requiresShipping} onChange={(event) => setCustom({ ...custom, requiresShipping: event.target.checked })} />{text('يحتاج إلى شحن', 'Requires shipping')}</label>
                        <div className="ws-draft-inline-actions">
                            <button type="button" className="ws-dt-button ws-dt-button-primary" disabled={!custom.title.trim() || !validMoney(custom.price)} onClick={() => { change((current) => ({ lines: [...current.lines, customLine(custom)] })); setCustom(null); }}>{text('إضافة العنصر', 'Add item')}</button>
                            <button type="button" className="ws-dt-button" onClick={() => setCustom(null)}>{text('إلغاء', 'Cancel')}</button>
                        </div>
                    </div> : null}
                    {state.lines.length ? <ul className="ws-draft-lines">{state.lines.map((line, index) => <li key={line.key} className="ws-draft-line">
                        {line.image_url ? <img src={line.image_url} alt="" /> : <span className="ws-draft-thumb" aria-hidden />}
                        <div className="ws-draft-line-info">
                            <p>{line.title}</p>
                            {line.variant_label ? <small>{line.variant_label}</small> : null}
                            <small>{line.type === 'custom' ? text('عنصر مخصص', 'Custom item') : line.sku || ''} · <bdi>{money(totals?.line_items?.[index]?.unit_price ?? line.unit_price)}</bdi></small>
                        </div>
                        <div className="ws-draft-stepper" role="group" aria-label={`${text('كمية', 'Quantity of')} ${line.title}`}>
                            <button type="button" disabled={locked || clampQuantity(line.quantity) <= 1} aria-label={`${text('تقليل كمية', 'Decrease quantity of')} ${line.title}`} onClick={() => setLine(line.key, { quantity: clampQuantity(line.quantity) - 1 })}><HiOutlineMinus aria-hidden /></button>
                            <input type="number" min="1" max="999" value={line.quantity} disabled={locked} aria-label={`${text('كمية', 'Quantity of')} ${line.title}`} onChange={(event) => setLine(line.key, { quantity: event.target.value })} onBlur={() => setLine(line.key, { quantity: clampQuantity(line.quantity) })} />
                            <button type="button" disabled={locked || clampQuantity(line.quantity) >= 999} aria-label={`${text('زيادة كمية', 'Increase quantity of')} ${line.title}`} onClick={() => setLine(line.key, { quantity: clampQuantity(line.quantity) + 1 })}><HiOutlinePlus aria-hidden /></button>
                        </div>
                        <span className="ws-draft-line-total"><bdi>{lineTotal(line, index) != null ? money(lineTotal(line, index)) : '—'}</bdi></span>
                        {editable ? <button type="button" className="ws-draft-remove" disabled={locked} aria-label={`${text('إزالة', 'Remove')} ${line.title}`} onClick={() => change((current) => ({ lines: current.lines.filter((row) => row.key !== line.key) }))}><HiOutlineTrash aria-hidden /></button> : null}
                    </li>)}</ul> : <p className="ws-draft-empty">{text('لم تتم إضافة منتجات بعد.', 'No products added yet.')}</p>}
                </section>

                <section className="ws-draft-card" aria-labelledby="draft-payment">
                    <h2 id="draft-payment">{text('الدفع', 'Payment')}</h2>
                    <fieldset className="ws-draft-fieldset" disabled={locked}>
                        <div className="ws-draft-grid">
                            <Field id="draft-discount-type" label={text('الخصم', 'Discount')}>
                                <select id="draft-discount-type" value={state.discount.type} onChange={(event) => change((current) => ({ discount: { ...current.discount, type: event.target.value } }))}>
                                    <option value="none">{text('بدون خصم (تطبق الخصومات التلقائية)', 'None (automatic discounts apply)')}</option>
                                    <option value="code">{text('كود خصم', 'Discount code')}</option>
                                    <option value="manual">{text('خصم يدوي', 'Manual discount')}</option>
                                </select>
                            </Field>
                            {state.discount.type === 'code' ? <Field id="draft-discount-code" label={text('الكود', 'Code')}><input id="draft-discount-code" dir="ltr" maxLength={100} value={state.discount.code} onChange={(event) => change((current) => ({ discount: { ...current.discount, code: event.target.value } }))} /></Field> : null}
                            {state.discount.type === 'manual' ? <>
                                <Field id="draft-discount-kind" label={text('النوع', 'Type')}><select id="draft-discount-kind" value={state.discount.value_type} onChange={(event) => change((current) => ({ discount: { ...current.discount, value_type: event.target.value } }))}><option value="fixed">{text('مبلغ ثابت', 'Fixed amount')}</option><option value="percentage">{text('نسبة مئوية', 'Percentage')}</option></select></Field>
                                <Field id="draft-discount-value" label={text('القيمة', 'Value')}><input id="draft-discount-value" inputMode="decimal" dir="ltr" value={state.discount.value} onChange={(event) => change((current) => ({ discount: { ...current.discount, value: event.target.value } }))} /></Field>
                                <Field id="draft-discount-reason" label={text('السبب', 'Reason')}><input id="draft-discount-reason" maxLength={255} value={state.discount.reason} onChange={(event) => change((current) => ({ discount: { ...current.discount, reason: event.target.value } }))} /></Field>
                            </> : null}
                        </div>
                        <div className="ws-draft-grid">
                            <Field id="draft-shipping-type" label={text('الشحن', 'Shipping')}>
                                <select id="draft-shipping-type" value={state.shipping.type} onChange={(event) => change((current) => ({ shipping: { ...current.shipping, type: event.target.value } }))}>
                                    <option value="none">{text('بدون شحن', 'No shipping')}</option>
                                    <option value="rate">{text('سعر شحن المتجر', 'Store shipping rate')}</option>
                                    <option value="custom">{text('شحن مخصص', 'Custom shipping')}</option>
                                </select>
                            </Field>
                            {state.shipping.type === 'rate' && shipping?.regions_enabled ? <Field id="draft-shipping-region" label={text('المنطقة', 'Region')}><select id="draft-shipping-region" value={state.shipping.shipping_region_id} onChange={(event) => change((current) => ({ shipping: { ...current.shipping, shipping_region_id: event.target.value } }))}><option value="">{text('اختر المنطقة', 'Choose a region')}</option>{regions.map((region) => <option key={region.id} value={region.id}>{label(region.name)} · {region.rate}</option>)}</select></Field> : null}
                            {state.shipping.type === 'rate' && rateOptions.length ? <Field id="draft-shipping-option" label={text('طريقة الشحن', 'Shipping option')}><select id="draft-shipping-option" value={state.shipping.shipping_option_id} onChange={(event) => change((current) => ({ shipping: { ...current.shipping, shipping_option_id: event.target.value } }))}><option value="">{text('اختر طريقة الشحن', 'Choose an option')}</option>{rateOptions.map((option) => <option key={option.id} value={option.id}>{label(option.name)} · {option.rate}</option>)}</select></Field> : null}
                            {state.shipping.type === 'custom' ? <>
                                <Field id="draft-shipping-title" label={text('اسم الشحن', 'Shipping name')}><input id="draft-shipping-title" maxLength={120} value={state.shipping.title} onChange={(event) => change((current) => ({ shipping: { ...current.shipping, title: event.target.value } }))} /></Field>
                                <Field id="draft-shipping-price" label={text('سعر الشحن', 'Shipping price')}><input id="draft-shipping-price" inputMode="decimal" dir="ltr" value={state.shipping.price} onChange={(event) => change((current) => ({ shipping: { ...current.shipping, price: event.target.value } }))} /></Field>
                            </> : null}
                        </div>
                    </fieldset>
                    <dl className="ws-draft-totals" aria-live="polite">
                        {calculating ? <p role="status" className="ws-draft-muted">{text('جارٍ حساب الإجمالي…', 'Calculating totals…')}</p> : null}
                        {calcError ? <p role="alert" className="ws-draft-alert">{calcError}</p> : null}
                        <div><dt>{text('المجموع الفرعي', 'Subtotal')}</dt><dd>{money(totals?.subtotal ?? 0)}</dd></div>
                        <div><dt>{text('الخصم', 'Discount')}{totals?.discounts?.[0]?.title ? <small> · {totals.discounts[0].code || totals.discounts[0].title}</small> : null}</dt><dd>−{money(totals?.discount_total ?? 0)}</dd></div>
                        <div><dt>{text('الشحن', 'Shipping')}{totals?.shipping?.title ? <small> · {totals.shipping.title}</small> : null}</dt><dd>{money(totals?.shipping_total ?? 0)}</dd></div>
                        <div><dt>{totals?.tax_included ? text('الضريبة المشمولة', 'Included tax') : text('الضريبة', 'Tax')}</dt><dd>{money(totals?.tax_total ?? 0)}</dd></div>
                        <div className="ws-draft-grand"><dt>{text('الإجمالي', 'Total')}</dt><dd>{money(totals?.grand_total ?? 0)}</dd></div>
                    </dl>
                    {editable && !isNew ? <div className="ws-draft-complete">
                        <button type="button" className="ws-dt-button ws-dt-button-primary" disabled={locked || !state.lines.length} onClick={() => setConfirm('paid')}>{text('تحديد كمدفوع وإنشاء الطلب', 'Mark as paid & create order')}</button>
                        <button type="button" className="ws-dt-button" disabled={locked || !state.lines.length} onClick={() => setConfirm('pending')}>{text('إنشاء الطلب بانتظار الدفع', 'Create order with payment pending')}</button>
                    </div> : null}
                </section>

                {!isNew ? <section className="ws-draft-card" aria-labelledby="draft-invoice">
                    <h2 id="draft-invoice">{text('فاتورة العميل', 'Customer invoice')}</h2>
                    <p className="ws-draft-muted">{text('أنشئ رابطًا خاصًا يراجع منه العميل الطلب ويدفع. لا ترسل المنصة أي رسالة؛ أنت من يشارك الرابط.', 'Create a private link where the customer reviews and pays. The platform sends nothing — you share the link yourself.')}</p>
                    <div className="ws-draft-inline-actions">
                        <button type="button" className="ws-dt-button" disabled={locked || !state.lines.length} onClick={() => void copyInvoice()}>{busy === 'invoice' ? text('جارٍ إنشاء الرابط…', 'Creating link…') : text('نسخ رابط الفاتورة', 'Copy invoice link')}</button>
                        {invoice ? <a className="ws-dt-button" href={waUrl} target="_blank" rel="noopener noreferrer">{text('فتح مشاركة واتساب', 'Open WhatsApp share')}</a>
                            : <button type="button" className="ws-dt-button" disabled={locked || !state.lines.length} onClick={() => void createInvoice()}>{text('مشاركة عبر واتساب', 'Share on WhatsApp')}</button>}
                    </div>
                    {invoice ? <div className="ws-draft-invoice">
                        <Field id="draft-invoice-url" label={text('رابط الفاتورة', 'Invoice link')}><input id="draft-invoice-url" readOnly dir="ltr" value={invoice.url} onFocus={(event) => event.currentTarget.select()} /></Field>
                        <Field id="draft-invoice-message" label={text('نص الرسالة', 'Message text')}><textarea id="draft-invoice-message" readOnly rows={4} value={message} onFocus={(event) => event.currentTarget.select()} /></Field>
                        <small className="ws-draft-muted">{text('ينتهي الرابط في', 'The link expires on')} {new Date(invoice.expires_at).toLocaleDateString(ar ? 'ar-EG' : 'en')}. {text('إنشاء رابط جديد يوقف الرابط السابق.', 'Creating a new link disables the previous one.')}</small>
                    </div> : draft?.invoice_sent_at ? <p className="ws-draft-muted">{text('تم إنشاء رابط سابقًا. لعرضه مجددًا أنشئ رابطًا جديدًا.', 'A link was created before. Create a new link to see it again.')}</p> : null}
                </section> : null}
            </div>

            <aside className="ws-draft-side">
                <section className="ws-draft-card" aria-labelledby="draft-customer">
                    <h2 id="draft-customer">{text('العميل', 'Customer')}</h2>
                    <fieldset className="ws-draft-fieldset" disabled={locked}>
                        {editable ? <div className="ws-draft-search">
                            <Field id="draft-customer-search" label={text('ابحث عن عميل', 'Search customers')}><input id="draft-customer-search" type="search" value={customerQuery} maxLength={255} autoComplete="off" onChange={(event) => setCustomerQuery(event.target.value)} /></Field>
                            {customerResults.length ? <ul className="ws-draft-results" aria-label={text('نتائج العملاء', 'Customer results')}>{customerResults.map((row) => <li key={row.key}><button type="button" onClick={() => { change({ customerId: row.account_id ?? null, customer: { name: row.name || '', email: row.email || '', phone: row.phone || '' }, address: { ...state.address, city: state.address.city || row.city || '' } }); setCustomerQuery(''); setCustomerResults([]); }}>
                                <strong>{row.name || row.email || row.phone}</strong><small dir="ltr">{[row.phone, row.email].filter(Boolean).join(' · ')}</small>
                            </button></li>)}</ul> : null}
                        </div> : null}
                        <Field id="draft-customer-name" label={text('الاسم', 'Name')}><input id="draft-customer-name" maxLength={200} value={state.customer.name} onChange={(event) => change((current) => ({ customer: { ...current.customer, name: event.target.value } }))} /></Field>
                        <Field id="draft-customer-phone" label={text('الهاتف', 'Phone')}><input id="draft-customer-phone" type="tel" dir="ltr" maxLength={50} value={state.customer.phone} onChange={(event) => change((current) => ({ customer: { ...current.customer, phone: event.target.value } }))} /></Field>
                        <Field id="draft-customer-email" label={text('البريد الإلكتروني', 'Email')}><input id="draft-customer-email" type="email" dir="ltr" maxLength={200} value={state.customer.email} onChange={(event) => change((current) => ({ customer: { ...current.customer, email: event.target.value } }))} /></Field>
                        {state.customerId ? <p className="ws-draft-muted">{text('مرتبط بحساب عميل مسجل.', 'Linked to a registered customer account.')} <button type="button" className="ws-draft-link" onClick={() => change({ customerId: null })}>{text('إلغاء الربط', 'Unlink')}</button></p> : null}
                    </fieldset>
                </section>
                <section className="ws-draft-card" aria-labelledby="draft-address">
                    <h2 id="draft-address">{text('عنوان الشحن', 'Shipping address')}</h2>
                    <fieldset className="ws-draft-fieldset" disabled={locked}>
                        <Field id="draft-address-line1" label={text('العنوان', 'Address')}><input id="draft-address-line1" maxLength={255} value={state.address.line1} onChange={(event) => change((current) => ({ address: { ...current.address, line1: event.target.value } }))} /></Field>
                        <Field id="draft-address-city" label={text('المدينة', 'City')}><input id="draft-address-city" maxLength={120} value={state.address.city} onChange={(event) => change((current) => ({ address: { ...current.address, city: event.target.value } }))} /></Field>
                        <Field id="draft-address-country" label={text('رمز الدولة', 'Country code')}><input id="draft-address-country" dir="ltr" maxLength={2} value={state.address.country} onChange={(event) => change((current) => ({ address: { ...current.address, country: event.target.value.toUpperCase() } }))} /></Field>
                    </fieldset>
                </section>
                <section className="ws-draft-card" aria-labelledby="draft-notes">
                    <h2 id="draft-notes">{text('ملاحظات ووسوم', 'Notes & tags')}</h2>
                    <fieldset className="ws-draft-fieldset" disabled={locked}>
                        <Field id="draft-note" label={text('ملاحظة داخلية', 'Internal note')}><textarea id="draft-note" rows={3} maxLength={5000} value={state.note} onChange={(event) => change({ note: event.target.value })} /></Field>
                        <Field id="draft-tags" label={text('الوسوم', 'Tags')} hint={text('افصل بين الوسوم بفاصلة.', 'Separate tags with commas.')}><input id="draft-tags" value={tagsInput} onChange={(event) => { setTagsInput(event.target.value); change({ tags: parseTags(event.target.value) }); }} /></Field>
                    </fieldset>
                </section>
                {!isNew ? <section className="ws-draft-card ws-draft-more" aria-label={text('إجراءات أخرى', 'More actions')}>
                    <button type="button" className="ws-dt-button" disabled={Boolean(busy)} onClick={() => void duplicate()}>{text('نسخ المسودة', 'Duplicate')}</button>
                    {editable ? <button type="button" className="ws-dt-button ws-draft-danger" disabled={Boolean(busy)} onClick={() => setConfirm('cancel')}>{text('إلغاء المسودة', 'Cancel draft')}</button> : null}
                </section> : null}
            </aside>
        </div>

        {picker ? <ManualProductPicker apiBase={apiBase} items={[]} ar={ar} theme={theme} onClose={() => setPicker(false)} onApply={(selections) => { change((current) => ({ lines: mergeProductLines(current.lines, selections) })); setPicker(false); }} /> : null}
        <ConfirmDialog open={confirm === 'paid' || confirm === 'pending'} onClose={() => setConfirm(null)} loading={busy === 'complete' || busy === 'save'}
            title={confirm === 'paid' ? text('تحديد كمدفوع وإنشاء الطلب؟', 'Mark as paid and create the order?') : text('إنشاء الطلب بانتظار الدفع؟', 'Create the order with payment pending?')}
            body={text(`سيتم حجز المخزون وإنشاء طلب بقيمة ${money(totals?.grand_total ?? draft?.grand_total ?? 0)}. لا يمكن تعديل المسودة بعد ذلك.`, `Stock will be reserved and an order for ${money(totals?.grand_total ?? draft?.grand_total ?? 0)} created. The draft can no longer be edited.`)}
            confirmLabel={text('إنشاء الطلب', 'Create order')} cancelLabel={text('رجوع', 'Back')} onConfirm={() => void complete(confirm)} />
        <ConfirmDialog open={confirm === 'cancel'} onClose={() => setConfirm(null)} loading={busy === 'cancel'} danger
            title={text('إلغاء هذه المسودة؟', 'Cancel this draft?')} body={text('سيتوقف رابط الفاتورة ولن يمكن تعديل المسودة.', 'The invoice link stops working and the draft can no longer be edited.')}
            confirmLabel={text('إلغاء المسودة', 'Cancel draft')} cancelLabel={text('رجوع', 'Back')} onConfirm={() => void cancelDraft()} />
    </form>;
}
