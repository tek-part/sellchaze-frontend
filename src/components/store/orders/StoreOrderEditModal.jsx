import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import api from '../../../api/client';
import { HiOutlinePencil, HiOutlineTrash, HiOutlineXMark } from '../../workspace/WorkspaceIcons';
import { PersonalizationSummary } from '../../../apps/storefront/foundation/components/PersonalizationSummary';
import Field from './ManualOrderField';
import ManualProductPicker from './ManualProductPicker';
import PersonalizationFields from './OrderPersonalizationFields';
import { manualMoney } from './manual-order';
import { orderEditLines, orderEditPayload, orderEditTotals } from './order-edit';
import './manual-order.css';
import './order-edit.css';

const errorText = error => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const empty = { name: '', phone: '', email: '', phoneAlt: '', country: '', region: '', city: '', address: '', line2: '', note: '', override: null };
const reasons = {
    shipment_exists: ['هذا الطلب مرتبط بشحنة. راجع تحديث بياناتها مع شركة الشحن قبل تغيير الطلب.', 'This order has a shipment. Review its details with the carrier before changing the order.'],
    order_closed: ['هذا الطلب مكتمل أو ملغى؛ بياناته محفوظة في السجل.', 'This order is completed or cancelled. Its details remain in the history.'],
    payment_or_inventory_locked: ['يمكن تصحيح بيانات العميل. تعديل المبالغ أو السلة يحتاج معالجة الدفع أو المخزون المسوّى أولًا.', 'Customer details can be corrected. Cart or amount changes require reviewing the payment or settled inventory first.'],
};

export default function StoreOrderEditModal({ apiBase, orderId, ar, theme, onClose, onSaved }) {
    const text = (a, e) => ar ? a : e; const endpoint = `${apiBase}/orders/${orderId}`;
    const [result, setResult] = useState(null); const [items, setItems] = useState([]); const [fields, setFields] = useState(empty);
    const [shipping, setShipping] = useState('0.00'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
    const [picker, setPicker] = useState(false); const [uploads, setUploads] = useState(0); const [uncertain, setUncertain] = useState(false); const [conflict, setConflict] = useState(false);
    const generation = useRef(0); const working = useRef(false); const pending = useRef(null); const key = useRef(crypto.randomUUID());
    const load = useCallback(async () => {
        const scope = ++generation.current; pending.current = null; key.current = crypto.randomUUID(); working.current = false;
        setResult(null); setItems([]); setFields(empty); setError(''); setBusy(false); setUploads(0); setUncertain(false); setConflict(false); setPicker(false);
        try {
            const { data } = await api.get(`${endpoint}/edit`);
            if (scope !== generation.current) return;
            const order = data.data; const address = order.shipping_address || {};
            setResult({ ...data, scope: endpoint }); setItems(orderEditLines(order)); setShipping(order.shipping_total);
            setFields({ ...empty, name: order.customer.name || '', phone: order.customer.phone || '', email: order.customer.email || '',
                phoneAlt: address.phone_alt || '', country: address.country || '', region: address.region || address.governorate || address.state || '', city: address.city || '', address: address.line1 || '', line2: address.line2 || '' });
        } catch (e) { if (scope === generation.current) setError(errorText(e)); }
    }, [endpoint]);
    useEffect(() => { void load(); return () => { generation.current += 1; }; }, [load]);
    function close() { if (!working.current && !picker && !uploads) onClose(); }
    function field(name, value) { setFields(current => ({ ...current, [name]: value })); setError(''); }
    function lineChange(key, changes) { setItems(current => current.map(line => line.key === key ? { ...line, ...changes } : line)); setError(''); }
    function custom(lineKey, fieldKey, value, filename) { setItems(current => current.map(line => line.key !== lineKey ? line : { ...line, personalization: { ...line.personalization, [fieldKey]: value }, uploadNames: { ...line.uploadNames, ...(filename ? { [fieldKey]: filename } : {}) } })); }
    const current = result?.scope === endpoint ? result : null;
    const financial = current?.edit.financial; const contact = current?.edit.contact;
    const locked = busy || uncertain || conflict || uploads > 0; const cartLocked = locked || !financial;
    const totals = current ? orderEditTotals(items, shipping, current.pricing, current.data, fields.override) : null;
    const digital = items.some(line => line.product.digital_type !== 'physical'); const physical = items.some(line => line.product.digital_type === 'physical');
    const money = value => `${String(value ?? '0.00')} ${current?.data.currency || ''}`;
    async function submit(event) {
        event.preventDefault(); if (working.current || !current || !contact || uploads) return;
        const payload = pending.current || orderEditPayload(items, fields, shipping, totals, current.edit.token, key.current);
        if (!payload) { setError(text('راجع المنتجات والكميات والمبالغ قبل الحفظ.', 'Review products, quantities and amounts before saving.')); return; }
        const scope = generation.current; pending.current = payload; working.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.post(`${endpoint}/edit`, payload);
            if (scope === generation.current) onSaved(data.data, false);
        } catch (e) {
            if (scope !== generation.current) return;
            if (!e.response || e.response.status >= 500) {
                setUncertain(true);
                try { const { data } = await api.get(`${endpoint}/edits/request/${payload.request_key}`); if (scope === generation.current) { onSaved(data.data, true); return; } }
                catch { /* Retry the same request; absence is not proof that an in-flight save will not commit. */ }
                if (scope === generation.current) setError(text('لم يصل تأكيد الحفظ. أعد المحاولة بنفس البيانات للتحقق دون تكرار التعديل.', 'Save confirmation was not received. Retry the same data to reconcile without duplicating the edit.'));
            } else if (e.response.status === 409) { setConflict(true); setError(errorText(e)); }
            else { pending.current = null; key.current = crypto.randomUUID(); setError(errorText(e)); }
        } finally { if (scope === generation.current) { working.current = false; setBusy(false); } }
    }
    return <>
        <Dialog open onClose={close} className="ws-orders-dialog ws-order-edit-dialog" dir={ar ? 'rtl' : 'ltr'} data-workspace-theme={theme}>
            <DialogBackdrop transition className="ws-orders-backdrop ws-order-transition" /><div className="ws-orders-dialog-position"><DialogPanel transition className="ws-order-edit-panel ws-order-transition"><form onSubmit={submit}>
                <header><DialogTitle>{text('تعديل الطلب', 'Edit order')}{current ? <bdi> #{current.data.order_number}</bdi> : null}</DialogTitle><button type="button" onClick={close} disabled={busy || Boolean(uploads)} aria-label={text('إغلاق تعديل الطلب', 'Close order editor')}><HiOutlineXMark aria-hidden /></button></header>
                <div className="ws-order-edit-body">
                    {current ? <>
                        {current.edit.reason ? <p className="ws-orders-notice">{reasons[current.edit.reason]?.[ar ? 0 : 1] || current.edit.reason}</p> : null}
                        <div className="ws-order-edit-grid"><div className="ws-order-edit-cart ws-order-edit-card"><div className="ws-order-edit-cart-toolbar"><h2>{text('عناصر سلة التسوق', 'Cart items')}</h2><button className="ws-manual-choose" type="button" disabled={cartLocked} onClick={() => setPicker(true)}>{text('اختر المنتجات', 'Choose products')}</button></div>
                            <div className="ws-order-edit-lines">{items.map(line => <div className="ws-order-edit-line" key={line.key}><div><strong>{line.product.name}</strong>{line.variant?.name ? <small>{line.variant.name}</small> : null}{line.itemId ? <PersonalizationSummary entries={line.snapshotPersonalization} /> : <PersonalizationFields line={line} apiBase={apiBase} ar={ar} busy={cartLocked} onChange={(name, value, filename) => custom(line.key, name, value, filename)} onUploadState={uploading => setUploads(value => Math.max(0, value + (uploading ? 1 : -1)))} onError={setError} />}</div>
                                <label>{text('السعر', 'Price')}<input type="number" min="0" max="9999999999.99" step="0.01" disabled={cartLocked} required value={line.unitPrice} onChange={event => lineChange(line.key, { unitPrice: event.target.value, priceEdited: true })} /></label>
                                <label>{text('الكمية', 'Quantity')}<input type="number" min="1" max="999" step="1" disabled={cartLocked} required value={line.quantity} onChange={event => lineChange(line.key, { quantity: event.target.value })} /></label>
                                <button type="button" disabled={cartLocked} aria-label={`${text('حذف', 'Remove')} ${line.product.name}`} onClick={() => setItems(current => current.filter(item => item.key !== line.key))}><HiOutlineTrash aria-hidden /></button>
                            </div>)}</div>
                            {!items.length ? <p className="ws-order-muted">{text('اختر منتجًا واحدًا على الأقل.', 'Choose at least one product.')}</p> : null}
                            <h2>{text('ملخص الطلب', 'Order summary')}</h2><dl className="ws-order-summary"><div><dt>{text('مجموع المنتجات', 'Subtotal')}</dt><dd><bdi>{money(totals?.subtotal)}</bdi></dd></div><div><dt>{text('تكلفة الشحن', 'Shipping cost')}</dt><dd><input className="ws-order-edit-shipping" aria-label={text('تكلفة الشحن', 'Shipping cost')} type="number" min="0" max="9999999999.99" step="0.01" required value={shipping} disabled={cartLocked} onChange={event => { setShipping(event.target.value); setError(''); }} /></dd></div><div><dt>{text('الخصم المسجل', 'Recorded discount')}</dt><dd><bdi>{money(totals?.discount)}</bdi></dd></div>{Number(totals?.tax) !== 0 ? <div><dt>{totals?.included ? text('الضريبة المشمولة', 'Included tax') : text('الضريبة', 'Tax')}</dt><dd><bdi>{money(totals?.tax)}</bdi></dd></div> : null}{Number(totals?.adjustment) !== 0 ? <div><dt>{text('تسوية الإجمالي', 'Total adjustment')}</dt><dd><bdi>{money(totals?.adjustment)}</bdi></dd></div> : null}<div><dt>{text('الإجمالي', 'Total')}</dt><dd className="ws-order-edit-total">{fields.override != null ? <input aria-label={text('إجمالي مخصص', 'Custom total')} type="number" min="0" step="0.01" max="9999999999.99" value={fields.override} disabled={cartLocked} onChange={event => field('override', event.target.value)} /> : <strong><bdi>{money(totals?.total)}</bdi></strong>}<button type="button" disabled={cartLocked} aria-label={text('تعديل الإجمالي', 'Edit total')} onClick={() => field('override', fields.override == null ? totals?.total || current.data.grand_total : null)}><HiOutlinePencil aria-hidden /></button></dd></div></dl>
                            {current.data.coupon_code ? <small>{text('يبقى الخصم المسجل على الطلب؛ لا تُستهلك قسيمة جديدة.', 'The recorded discount is retained. No new coupon redemption is made.')}</small> : null}
                        </div><div className="ws-order-edit-customer"><section className="ws-order-edit-card"><h2>{text('بيانات العميل', 'Customer details')}</h2><div className="ws-order-edit-fields">
                            <Field label={text('اسم العميل', 'Customer name')} value={fields.name} required disabled={locked || !contact} maxLength={200} onChange={value => field('name', value)} />
                            <Field label={text('بريد العميل', 'Customer email')} type="email" value={fields.email} required={digital} disabled={locked || !contact} maxLength={200} onChange={value => field('email', value)} />
                            <Field label={text('رقم هاتف العميل', 'Customer phone')} type="tel" value={fields.phone} required disabled={locked || !contact} maxLength={50} onChange={value => field('phone', value)} />
                            <Field label={text('رقم هاتف بديل', 'Alternative phone')} type="tel" value={fields.phoneAlt} disabled={locked || !contact} maxLength={50} onChange={value => field('phoneAlt', value)} />
                        </div></section><section className="ws-order-edit-card"><h2>{text('بيانات الشحن', 'Shipping details')}</h2><div className="ws-order-edit-fields">
                            <Field label={text('الدولة', 'Country')} value={fields.country} disabled={locked || !contact} maxLength={100} onChange={value => field('country', value)} />
                            <Field label={text('المحافظة', 'Governorate')} value={fields.region} disabled={locked || !contact} maxLength={200} onChange={value => field('region', value)} />
                            <Field label={text('العنوان بالتفصيل', 'Full address')} value={fields.address} textarea required={physical} disabled={locked || !contact} maxLength={2000} onChange={value => field('address', value)} />
                        </div></section></div></div>
                        {!totals ? <p role="alert" className="ws-orders-error">{text('راجع القيم الرقمية وتسوية الإجمالي.', 'Review the numeric values and total adjustment.')}</p> : null}
                    </> : !error ? <p role="status">{text('جار تحميل بيانات الطلب…', 'Loading order details…')}</p> : null}
                    {error ? <p role="alert" className="ws-orders-error">{error}{!current || conflict ? <button type="button" disabled={busy} onClick={() => void load()}>{text('إعادة تحميل بيانات الطلب', 'Reload order details')}</button> : null}</p> : null}
                </div><footer><button type="button" onClick={close} disabled={busy || Boolean(uploads)}>{text('إلغاء', 'Cancel')}</button><button className="ws-order-primary-button" type="submit" disabled={busy || !contact || uploads > 0 || (!uncertain && (!totals || !items.length || conflict || manualMoney(shipping) == null))}>{busy ? text('جار الحفظ…', 'Saving…') : uncertain ? text('إعادة المحاولة والتحقق', 'Retry and reconcile') : text('حفظ', 'Save')}</button></footer>
            </form></DialogPanel></div>
        </Dialog>
        {picker ? <ManualProductPicker apiBase={apiBase} items={items} ar={ar} theme={theme} onClose={() => setPicker(false)} onApply={rows => { setItems(rows); setPicker(false); setError(''); }} /> : null}
    </>;
}
