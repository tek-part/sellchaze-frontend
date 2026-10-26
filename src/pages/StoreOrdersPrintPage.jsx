import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { orderPrintIds } from '../components/store/orders/order-workspace';
import { invoiceAddress, invoiceCollect, invoicePaymentLine } from '../lib/order-invoice';
import { safeHttpUrl } from '../lib/order-deposit';
import '../components/store/orders/orders-workspace.css';
import '../components/store/orders/order-invoice.css';

const FORMATS = ['a4', 'thermal'];

function Invoice({ order, store, ar }) {
    const text = (a, e) => ar ? a : e;
    const money = (value) => <bdi dir="ltr">{order.currency} {value}</bdi>;
    const address = invoiceAddress(order);
    const website = safeHttpUrl(store.website);
    const collect = invoiceCollect(order);
    const nonZero = (value) => Number(value || 0) !== 0;
    return <article className="ws-invoice" dir={ar ? 'rtl' : 'ltr'} lang={ar ? 'ar' : 'en'}>
        <header className="ws-invoice-head">
            <div className="ws-invoice-brand">{store.logo_url ? <img src={store.logo_url} alt={store.name} /> : null}<strong>{store.name}</strong></div>
            <div className="ws-invoice-meta"><h2>{text('فاتورة', 'Invoice')}</h2><p><bdi dir="ltr">{order.order_number}</bdi></p>{order.placed_at ? <p>{new Date(order.placed_at).toLocaleString(ar ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p> : null}</div>
        </header>
        <section className="ws-invoice-customer" aria-label={text('بيانات العميل', 'Customer details')}>
            <dl>
                <div><dt>{text('العميل', 'Customer')}</dt><dd>{order.customer?.name || '—'}</dd></div>
                <div><dt>{text('الهاتف', 'Phone')}</dt><dd>{address.phones.length ? address.phones.map((phone) => <bdi key={phone} dir="ltr">{phone}</bdi>) : '—'}</dd></div>
                <div><dt>{text('المحافظة', 'Governorate')}</dt><dd>{address.governorate || '—'}</dd></div>
                {address.area ? <div><dt>{text('المنطقة', 'Area')}</dt><dd>{address.area}</dd></div> : null}
                <div className="is-wide"><dt>{text('العنوان', 'Address')}</dt><dd>{address.street || '—'}</dd></div>
            </dl>
        </section>
        <table className="ws-invoice-items">
            <thead><tr><th>{text('المنتج', 'Product')}</th><th>{text('الكمية', 'Qty')}</th><th>{text('السعر', 'Price')}</th><th>{text('الإجمالي', 'Total')}</th></tr></thead>
            <tbody>{(order.items ?? []).map((item) => <tr key={item.id}><td>{item.name}{item.variant_name ? <small>{item.variant_name}</small> : null}</td><td>{item.quantity}</td><td><bdi dir="ltr">{item.unit_price}</bdi></td><td><bdi dir="ltr">{item.line_total}</bdi></td></tr>)}</tbody>
        </table>
        <dl className="ws-invoice-totals">
            <div><dt>{text('مجموع المنتجات', 'Subtotal')}</dt><dd>{money(order.subtotal)}</dd></div>
            <div><dt>{text('الشحن', 'Shipping')}</dt><dd>{money(order.shipping_total)}</dd></div>
            {nonZero(order.discount_total) ? <div><dt>{text('الخصم', 'Discount')}</dt><dd>−{money(order.discount_total)}</dd></div> : null}
            {nonZero(order.tax_total) ? <div><dt>{order.manual_tax_included ? text('الضريبة المشمولة', 'Included tax') : text('الضريبة', 'Tax')}</dt><dd>{money(order.tax_total)}</dd></div> : null}
            {nonZero(order.payment_adjustment_total) ? <div><dt>{Number(order.payment_adjustment_total) < 0 ? text('خصم طريقة الدفع', 'Payment method discount') : text('رسوم طريقة الدفع', 'Payment method fee')}</dt><dd>{money(order.payment_adjustment_total)}</dd></div> : null}
            {nonZero(order.manual_adjustment_total) ? <div><dt>{text('تسوية الإجمالي', 'Total adjustment')}</dt><dd>{money(order.manual_adjustment_total)}</dd></div> : null}
            <div className="is-total"><dt>{text('الإجمالي', 'Total')}</dt><dd>{money(order.grand_total)}</dd></div>
            {nonZero(order.gift_card_total) ? <div><dt>{text('مدفوع ببطاقات الهدايا', 'Paid with gift cards')}</dt><dd>−{money(order.gift_card_total)}</dd></div> : null}
        </dl>
        <section className="ws-invoice-payment" aria-label={text('الدفع', 'Payment')}>
            <p>{invoicePaymentLine(order, ar)}</p>
            {Number(collect) > 0 ? <p className="ws-invoice-collect">{text('المطلوب تحصيله عند الاستلام', 'To collect on delivery')}: <strong>{money(collect)}</strong></p> : null}
        </section>
        {order.customer_notes ? <p className="ws-invoice-notes"><b>{text('ملاحظات العميل', 'Customer notes')}:</b> {order.customer_notes}</p> : null}
        <footer className="ws-invoice-foot">
            {website ? <a href={website} dir="ltr">{website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a> : null}
            {store.phone ? <span>{text('خدمة العملاء', 'Customer support')}: <bdi dir="ltr">{store.phone}</bdi></span> : null}
        </footer>
    </article>;
}

export default function StoreOrdersPrintPage() {
    const { apiBase } = useStoreScope(); const [params, setParams] = useSearchParams(); const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar');
    const raw = params.get('ids') || ''; const format = FORMATS.includes(params.get('format')) ? params.get('format') : 'a4';
    const [data, setData] = useState(null); const [error, setError] = useState('');
    useEffect(() => { let active = true; setData(null); const ids = orderPrintIds(raw); if (!ids.length) { setError(ar ? 'اختر من طلب واحد إلى 100 طلب للطباعة.' : 'Select between one and 100 orders to print.'); return; } setError(''); api.get(`${apiBase}/orders/print-data`, { params: { ids } }).then(({ data }) => { if (active) setData(data); }).catch(e => { if (active) setError(e.response?.data?.message || e.message); }); return () => { active = false; }; }, [apiBase, raw, ar]);
    const choose = (value) => { const next = new URLSearchParams(params); next.set('format', value); setParams(next, { replace: true }); };
    return <div className={`ws-orders-print ws-invoices is-${format}`}>
        <style>{format === 'thermal' ? '@media print{@page{size:80mm auto;margin:3mm}}' : '@media print{@page{size:A4;margin:12mm}}'}</style>
        <header><h1>{ar ? 'طباعة الفواتير' : 'Print invoices'}</h1>
            <div className="ws-invoice-tools">
                <fieldset><legend className="sr-only">{ar ? 'مقاس الورق' : 'Paper size'}</legend>
                    <label><input type="radio" name="invoice-format" checked={format === 'a4'} onChange={() => choose('a4')} />A4</label>
                    <label><input type="radio" name="invoice-format" checked={format === 'thermal'} onChange={() => choose('thermal')} />{ar ? 'طابعة حرارية 80 مم' : 'Thermal 80 mm'}</label>
                </fieldset>
                <button type="button" disabled={!data} onClick={() => window.print()}>{ar ? 'طباعة' : 'Print'}</button>
            </div>
        </header>
        {error ? <p role="alert">{error}</p> : !data ? <p role="status">{ar ? 'جارٍ تحميل الطلبات…' : 'Loading orders…'}</p> : data.data.map(order => <Invoice key={order.id} order={order} store={data.store ?? {}} ar={ar} />)}
    </div>;
}
