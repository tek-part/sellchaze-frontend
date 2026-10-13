import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import useWorkspaceAppearance from '../components/workspace/useWorkspaceAppearance';
import { HiOutlinePencil, HiOutlineTrash } from '../components/workspace/WorkspaceIcons';
import Field from '../components/store/orders/ManualOrderField';
import PersonalizationFields from '../components/store/orders/OrderPersonalizationFields';
import ManualProductPicker from '../components/store/orders/ManualProductPicker';
import { manualAmount, manualMoney, manualPayload, manualTotals } from '../components/store/orders/manual-order';
import '../components/store/orders/orders-workspace.css';
import '../components/store/orders/manual-order.css';

const emptyFields = { name: '', phone: '', email: '', address: '', notes: '', totalOverride: null };



export default function StoreManualOrderPage() {
    const { apiBase, uiBase } = useStoreScope();
    const { permissions = [] } = useOutletContext(); const canManage = permissions.includes('store.orders.manage');
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const { theme } = useWorkspaceAppearance(); const navigate = useNavigate();
    const [items, setItems] = useState([]); const [fields, setFields] = useState(emptyFields);
    const [shipping, setShipping] = useState('0.00'); const [shippingEdited, setShippingEdited] = useState(false);
    const [store, setStore] = useState(null); const [reload, setReload] = useState(0);
    const [picker, setPicker] = useState(false); const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
    const [busy, setBusy] = useState(false); const [uploads, setUploads] = useState(0); const [error, setError] = useState('');
    const submitRef = useRef(false); const generation = useRef(0);
    useEffect(() => { generation.current += 1; submitRef.current = false; setBusy(false); setUploads(0); setItems([]); setFields(emptyFields); setStore(null); setShippingEdited(false); setRequestKey(crypto.randomUUID()); setError(''); setPicker(false); return () => { generation.current += 1; }; }, [apiBase]);
    useEffect(() => {
        if (!canManage) return;
        let active = true;
        api.get(`${apiBase}/orders/manual/products`, { params: { per_page: 10 } }).then(({ data }) => { if (active) { setStore(data.store); setShipping(data.store.shipping_total); } }).catch(e => { if (active) setError(e.response?.data?.message || e.message); });
        return () => { active = false; };
    }, [apiBase, canManage, reload]);
    const digital = items.some(line => line.product.digital_type !== 'physical');
    const allDigital = items.length > 0 && items.every(line => line.product.digital_type !== 'physical');
    const delivery = allDigital ? '0.00' : shipping;
    const totals = manualTotals(items, delivery, store, fields.totalOverride);
    const currency = store?.currency === 'EGP' && ar ? 'ج.م' : store?.currency || '';
    const amount = value => `${String(value ?? '0.00').replace(/\.00$/, '')} ${currency}`;
    const locked = busy || uploads > 0;
    function changed() { setError(''); }
    function field(key, value) { setFields(current => ({ ...current, [key]: value })); changed(); }
    function itemChange(key, changes) { setItems(current => current.map(line => line.key === key ? { ...line, ...changes } : line)); changed(); }
    function customization(key, fieldKey, value, filename) {
        setItems(current => current.map(line => line.key !== key ? line : { ...line, personalization: { ...line.personalization, [fieldKey]: value }, uploadNames: { ...line.uploadNames, ...(filename ? { [fieldKey]: filename } : {}) } }));
        changed();
    }
    async function submit(event) {
        event.preventDefault();
        if (submitRef.current || locked || !canManage || !store || !items.length) return;
        const payload = manualPayload(items, fields, totals, requestKey);
        if (!payload) { setError(text('راجع السعر والكمية والشحن والإجمالي قبل إرسال الطلب.', 'Review prices, quantities, delivery and total before placing the order.')); return; }
        const currentGeneration = generation.current;
        submitRef.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.post(`${apiBase}/orders/manual`, payload);
            if (currentGeneration !== generation.current) return;
            navigate(data.orders_locked ? `${uiBase}/orders` : `${uiBase}/orders/${data.data.id}`, { replace: true });
        } catch (error) {
            if (currentGeneration !== generation.current) return;
            try {
                const existing = await api.get(`${apiBase}/orders/manual/request/${requestKey}`);
                if (currentGeneration !== generation.current) return;
                navigate(existing.data.orders_locked ? `${uiBase}/orders` : `${uiBase}/orders/${existing.data.data.id}`, { replace: true, state: { manualRecovered: true } });
                return;
            } catch { /* Keep the same request identity while the merchant corrects or retries this draft. */ }
            if (currentGeneration !== generation.current) return;
            const messages = Object.values(error.response?.data?.errors || {}).flat();
            setError(messages.length ? messages.join(' · ') : error.response?.data?.message || error.message);
        } finally { if (currentGeneration === generation.current) { submitRef.current = false; setBusy(false); } }
    }
    if (!canManage) return <p role="alert">{text('لا توجد صلاحية لإنشاء الطلبات.', 'You do not have permission to create orders.')}</p>;
    return <form className="ws-manual-order" onSubmit={event => void submit(event)} aria-busy={locked}>
        <h1 className="sr-only">{text('إنشاء طلب', 'Create order')}</h1>
        {error ? <div className="ws-orders-error" role="alert">{error}{!store ? <button type="button" onClick={() => setReload(value => value + 1)}>{text('إعادة التحميل', 'Reload')}</button> : null}</div> : null}
        {!store ? <p role="status">{text('جارٍ تحميل إعدادات المتجر…', 'Loading store settings…')}</p> : null}
        <div className="ws-manual-layout">
            <aside className="ws-manual-card ws-manual-notes"><h2>{text('اضافة ملاحظة', 'Add a note')}</h2><Field label={text('ملاحظة الطلب الخاصة بك', 'Your order note')} textarea value={fields.notes} disabled={locked} maxLength={5000} onChange={value => field('notes', value)} /></aside>
            <div className="ws-manual-main"><section className="ws-manual-card ws-manual-products"><h2>{text('المنتجات', 'Products')}</h2><button type="button" className="ws-manual-choose" disabled={locked || !store} onClick={() => setPicker(true)}>{text('اختر المنتجات', 'Choose products')}</button>
                {items.length ? <div className="ws-manual-lines"><div className="ws-manual-line-heading"><span>{text('المنتج', 'Product')}</span><span>{text('الكمية', 'Quantity')}</span><span>{text('الاجمالي', 'Total')}</span></div>{items.map(line => {
                    const cents = manualMoney(line.unitPrice); const validQuantity = /^[1-9]\d{0,2}$/.test(String(line.quantity));
                    return <div key={line.key} className="ws-manual-line"><div className="ws-manual-line-product">{line.variant?.image_url || line.product.image_url ? <img src={line.variant?.image_url || line.product.image_url} alt="" /> : null}<div><p>{line.product.name}</p>{line.variant ? <small>{Object.entries(line.variant.options || {}).map(([key, value]) => `${key}: ${value}`).join(' · ') || line.variant.name}</small> : null}<div className="ws-manual-price"><input type="number" min="0" step="0.01" inputMode="decimal" aria-label={`${text('سعر', 'Price for')} ${line.product.name}`} value={line.unitPrice} disabled={!line.priceEditable || locked} onChange={event => itemChange(line.key, { unitPrice: event.target.value, priceEdited: true })} /><button type="button" disabled={locked} aria-label={`${text('تعديل سعر', 'Edit price for')} ${line.product.name}`} onClick={() => itemChange(line.key, { priceEditable: !line.priceEditable })}><HiOutlinePencil aria-hidden /></button></div></div></div>
                        <input className="ws-manual-quantity" type="number" min="1" max="999" step="1" required value={line.quantity} disabled={locked} aria-label={`${text('كمية', 'Quantity of')} ${line.product.name}`} onChange={event => itemChange(line.key, { quantity: event.target.value })} /><div className="ws-manual-line-total"><span>{cents != null && validQuantity ? amount(manualAmount(cents * BigInt(line.quantity))) : '—'}</span><button type="button" disabled={locked} aria-label={`${text('إزالة', 'Remove')} ${line.product.name}`} onClick={() => { setItems(current => current.filter(item => item.key !== line.key)); changed(); }}><HiOutlineTrash aria-hidden /></button></div>
                        <PersonalizationFields line={line} apiBase={apiBase} ar={ar} busy={locked} onError={setError} onUploadState={started => setUploads(count => count + (started ? 1 : -1))} onChange={(key, value, filename) => customization(line.key, key, value, filename)} />
                    </div>;
                })}</div> : null}
            </section>
                <section className="ws-manual-card ws-manual-customer"><h2>{text('بيانات العميل', 'Customer details')}</h2><div className="ws-manual-customer-fields"><Field label={text('اسمك بالكامل', 'Full name')} required value={fields.name} disabled={locked} maxLength={200} onChange={value => field('name', value)} /><Field label={text('رقم الهاتف', 'Phone number')} type="tel" required value={fields.phone} disabled={locked} maxLength={50} onChange={value => field('phone', value)} />{digital ? <Field label={text('البريد الإلكتروني', 'Email address')} type="email" required value={fields.email} disabled={locked} maxLength={200} onChange={value => field('email', value)} /> : null}{!allDigital ? <Field label={text('العنوان بالتفصيل', 'Detailed address')} textarea required value={fields.address} disabled={locked} maxLength={2000} onChange={value => field('address', value)} /> : null}</div>
                    <div className="ws-manual-summary"><div><span>{text('اجمالي المنتجات:', 'Product subtotal:')}</span><span>{amount(totals?.subtotal)}</span></div><div><span>{text('رسوم التوصيل:', 'Delivery fee:')}</span><span className="ws-manual-edit-total"><button type="button" disabled={locked || allDigital} aria-label={text('تعديل رسوم التوصيل', 'Edit delivery fee')} onClick={() => setShippingEdited(value => !value)}><HiOutlinePencil aria-hidden /></button>{shippingEdited && !allDigital ? <input type="number" min="0" step="0.01" inputMode="decimal" aria-label={text('رسوم التوصيل', 'Delivery fee')} value={shipping} onChange={event => { setShipping(event.target.value); changed(); }} disabled={locked} /> : amount(delivery)}</span></div>{store?.tax_enabled ? <div><span>{store.tax_prices_include ? text('الضريبة المشمولة:', 'Included tax:') : text('الضريبة:', 'Tax:')}</span><span>{amount(totals?.tax)}</span></div> : null}
                        <div className="ws-manual-grand"><strong>{text('الاجمالي:', 'Total:')}</strong><span className="ws-manual-edit-total"><button type="button" disabled={locked || (!totals && fields.totalOverride == null)} aria-label={text('تعديل إجمالي الطلب', 'Edit order total')} onClick={() => field('totalOverride', fields.totalOverride == null ? totals.total : null)}><HiOutlinePencil aria-hidden /></button>{fields.totalOverride != null ? <input type="number" min="0" step="0.01" inputMode="decimal" aria-label={text('إجمالي الطلب', 'Order total')} value={fields.totalOverride} disabled={locked} onChange={event => field('totalOverride', event.target.value)} /> : <strong>{amount(totals?.total)}</strong>}</span></div>
                        {totals && totals.adjustment !== '0.00' ? <div className="ws-manual-adjustment"><span>{text('تسوية الإجمالي:', 'Total adjustment:')}</span><span>{amount(totals.adjustment)}</span></div> : null}
                        {allDigital ? <p>{text('الطلب الرقمي في انتظار تأكيد التحويل البنكي.', 'The digital order awaits bank transfer confirmation.')}</p> : null}
                    </div>
                </section>
            </div>
        </div>
        <footer className="ws-manual-submit"><button type="submit" disabled={locked || !store || !items.length || !totals}>{busy ? text('جارٍ إرسال الطلب…', 'Placing order…') : text('ارسال الطلب', 'Place order')}</button></footer>
        {picker ? <ManualProductPicker apiBase={apiBase} items={items} ar={ar} theme={theme} onClose={() => setPicker(false)} onApply={lines => { setItems(lines); setPicker(false); changed(); }} /> : null}
    </form>;
}
