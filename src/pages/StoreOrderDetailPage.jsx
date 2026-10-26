import PaymentMethodLogo from '../shared/payments/PaymentMethodLogo';
import { protectionSignalText } from '../lib/order-protection';
import StoreOrderTransferProofs from '../components/store/StoreOrderTransferProofs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import useWorkspaceAppearance from '../components/workspace/useWorkspaceAppearance';
import { HiOutlineArchiveBox, HiOutlineArrowPath, HiOutlinePrinter, HiOutlineXMark } from '../components/workspace/WorkspaceIcons';
import { PersonalizationSummary } from '../apps/storefront/foundation/components/PersonalizationSummary';
import { DigitalDeliverySummary } from '../apps/storefront/foundation/components/DigitalDeliverySummary';
import StatusBadge from '../components/StatusBadge';
import StoreOrderShipment from '../components/store/StoreOrderShipment';
import StoreOrderDigitalEmail from '../components/store/StoreOrderDigitalEmail';
import StoreOrderDigitalDelivery from '../components/store/StoreOrderDigitalDelivery';
import StoreOrderNotifications from '../components/store/StoreOrderNotifications';
import StoreOrderCashPayment from '../components/store/StoreOrderCashPayment';
import StoreOrderEditModal from '../components/store/orders/StoreOrderEditModal';
import StoreOrderRefunds from '../components/store/orders/StoreOrderRefunds';
import StoreOrderFulfillments from '../components/store/orders/StoreOrderFulfillments';
import { FULFILLABLE_ORDER_STATUSES, FULFILLMENT_STATUSES, FULFILLMENT_STATUS_TONES, vocabularyLabel as fulfillmentLabel } from '../components/store/orders/order-fulfillments';
import { PAYMENT_STATUS_LABELS } from '../components/store/orders/order-refunds';
import { orderAmountDue } from '../lib/cash-collection';
import { orderBotLabel } from '../components/store/orders/OrderBotVerification';
import { ORDER_RETURN_STATUSES, orderStatusLabel } from '../components/store/orders/order-workspace';
import '../components/store/orders/orders-workspace.css';
import '../components/store/orders/order-detail.css';

const errorMessage = error => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const reviewLabels = { moderate_risk: ['مخاطر متوسطة', 'Moderate risk'], high_risk: ['مخاطر مرتفعة', 'High risk'], spam: ['طلب مزعج', 'Spam'], clear: ['إزالة التصنيف', 'Clear classification'] };
const actionLabels = { status: ['تحديث حالة الطلب', 'Update order status'], review: ['تصنيف الطلب', 'Classify order'], block: ['حظر رقم الهاتف', 'Block phone number'], webhook: ['إعادة إرسال الويب هوك', 'Resend webhook'], archive: ['أرشفة الطلب', 'Archive order'], restore: ['استرجاع الطلب', 'Restore order'], bank: ['تأكيد التحويل البنكي', 'Confirm bank transfer'] };
const eventLabels = { merchant_payment_pending: ['الدفع بانتظار التحصيل', 'Payment awaiting collection'], merchant_payment_failed: ['وُثّق فشل الدفع اليدوي', 'Manual payment failure recorded'], merchant_edit: ['عُدّل الطلب', 'Order edited'], merchant_archive: ['أُرشف الطلب', 'Order archived'], merchant_restore: ['استُرجع الطلب', 'Order restored'], merchant_phone_block: ['حُظر رقم الهاتف', 'Phone blocked'], merchant_webhook_resend: ['طُلب إعادة إرسال الويب هوك', 'Webhook resend requested'], merchant_review_clear: ['أُزيل التصنيف', 'Classification cleared'], merchant_review_moderate_risk: reviewLabels.moderate_risk, merchant_review_high_risk: reviewLabels.high_risk, merchant_review_spam: reviewLabels.spam, refund: ['سُجل استرداد', 'Refund recorded'], return_refund: ['سُجل استرداد للمرتجع', 'Return refunded'], return_requested: ['طلب العميل إرجاعًا', 'Return requested'], return_approved: ['قُبل طلب الإرجاع', 'Return approved'], return_rejected: ['رُفض طلب الإرجاع', 'Return rejected'], return_received: ['استُلم المرتجع', 'Return received'], return_closed: ['أُغلق طلب الإرجاع', 'Return closed'] , order_protection: ['علّمته الحماية من الطلبات الوهمية', 'Flagged by fake order protection'] };
// Refunds are recorded after fulfilment, or for cancelled orders that were paid.
const REFUND_STATUSES = ['shipped', 'delivered', 'returning_from_delivery', 'request_refund', 'refund_in_progress', 'refunded', 'cancelled'];
// Shipments exist from confirmation on; unconfirmed orders cannot ship yet.
const shipmentsVisible = (order, requiresShipping) => requiresShipping && (!['pending', 'cancelled'].includes(order.status) || (order.fulfillment_status && order.fulfillment_status !== 'unfulfilled'));
const refundsVisible = order => REFUND_STATUSES.includes(order.status) && (order.status !== 'cancelled' || ['paid', 'partially_refunded', 'refunded'].includes(order.payment_status));

function DetailCard({ title, children, className = '' }) {
    return <section className={`ws-order-card ${className}`}><h2>{title}</h2>{children}</section>;
}
function DataRow({ label, children }) { return <div><dt>{label}</dt><dd>{children || '—'}</dd></div>; }

export default function StoreOrderDetailPage() {
    const { orderId } = useParams(); const { apiBase, uiBase } = useStoreScope(); const location = useLocation();
    const { permissions = [], me, store } = useOutletContext() ?? {}; const canManage = permissions.includes('store.orders.manage');
    const scopeKey = `${me?.id ?? ''}:${store?.id ?? ''}`;
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const { theme } = useWorkspaceAppearance(); const [order, setOrder] = useState(null); const [error, setError] = useState('');
    const [dialog, setDialog] = useState(null); const [note, setNote] = useState(''); const [classification, setClassification] = useState('');
    const [status, setStatus] = useState(''); const [bankReference, setBankReference] = useState(''); const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(''); const [actionError, setActionError] = useState('');
    const [editing, setEditing] = useState(false); const [refundOpen, setRefundOpen] = useState(false); const [fulfilOpen, setFulfilOpen] = useState(false);
    const [loadedScope, setLoadedScope] = useState(null);
    const generation = useRef(0); const fetchVersion = useRef(0); const submitting = useRef(false); const requestKey = useRef(null);
    const endpoint = `${apiBase}/orders/${orderId}`;
    const load = useCallback(async () => {
        const scope = generation.current; const version = ++fetchVersion.current;
        try {
            const { data } = await api.get(`${endpoint}${canManage ? '/detail' : ''}`);
            if (generation.current === scope && fetchVersion.current === version) { setOrder(data.data); setLoadedScope(scopeKey); setError(''); }
        } catch (e) { if (generation.current === scope && fetchVersion.current === version) setError(errorMessage(e)); }
    }, [endpoint, canManage, scopeKey]);
    useEffect(() => {
        generation.current += 1; fetchVersion.current += 1; submitting.current = false; requestKey.current = null;
        setOrder(null); setError(''); setDialog(null); setEditing(false); setRefundOpen(false); setFulfilOpen(false); setBusy(false); setNotice(''); setNote(''); setBankReference('');
        void load(); return () => { generation.current += 1; fetchVersion.current += 1; };
    }, [load]);
    function open(kind) {
        setDialog(kind); setActionError(''); setNote(''); setStatus(''); setBankReference('');
        setClassification(order.review?.classification || 'clear'); requestKey.current = crypto.randomUUID();
    }
    function close() { if (!submitting.current) { setDialog(null); setActionError(''); } }
    async function submit(event) {
        event.preventDefault(); if (submitting.current || !canManage) return;
        const scope = generation.current; submitting.current = true; setBusy(true); setActionError('');
        let path; let payload;
        if (dialog === 'status') { path = 'status'; payload = { status, note: note || null }; }
        else if (dialog === 'review') { path = 'review'; payload = { classification: classification === 'clear' ? null : classification, version: order.review?.version || 0, note: note || null }; }
        else if (dialog === 'block') { path = 'block-phone'; payload = { note: note || null }; }
        else if (dialog === 'webhook') { path = 'resend-webhook'; payload = { request_key: requestKey.current }; }
        else if (dialog === 'bank') { path = 'payment/confirm-bank'; payload = { reference: bankReference, note: note || null }; }
        else { path = 'archive'; payload = { archived: dialog === 'archive', expected_updated_at: order.updated_at }; }
        try {
            const { data } = await api.post(`${endpoint}/${path}`, payload);
            if (scope !== generation.current) return;
            fetchVersion.current += 1;
            if (data.data) setOrder(data.data); else await load();
            if (scope !== generation.current) return;
            setNotice(dialog === 'webhook' ? text('سُجلت محاولة الإرسال. يمكنك متابعة نتيجتها في إعدادات الويب هوك.', 'The delivery request is queued. Follow its outcome in webhook settings.') : text('حُفظ الإجراء.', 'Action saved.'));
            setDialog(null); setNote('');
        } catch (e) { if (scope === generation.current) setActionError(errorMessage(e)); }
        finally { if (scope === generation.current) { submitting.current = false; setBusy(false); } }
    }
    if (!order || loadedScope !== scopeKey) return <div className="ws-order-detail">{error ? <p role="alert" className="ws-orders-error">{error}<button onClick={() => void load()}>{text('إعادة المحاولة', 'Retry')}</button></p> : <p role="status">{text('جار تحميل الطلب…', 'Loading order…')}</p>}</div>;
    const archived = Boolean(order.archived_at); const money = value => `${String(value ?? '0.00')} ${order.currency}`;
    const address = order.shipping_address || {}; const digital = order.items?.some(item => item.digital_delivery); const requiresShipping = order.fulfillment?.requires_shipping !== false;
    const next = order.next_statuses || []; const label = actionLabels[dialog]; const phone = order.customer?.phone;
    const whatsappPhone = order.customer?.whatsapp_phone || phone;
    const whatsapp = whatsappPhone && /^\+?[1-9]\d{7,14}$/.test(whatsappPhone.replace(/[\s()-]/g, '')) ? `https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text(`مرحبًا، نود تأكيد طلبك ${order.order_number} بقيمة ${money(order.grand_total)}.`, `Hello, please confirm your order ${order.order_number} for ${money(order.grand_total)}.`))}` : null;
    const date = value => value ? new Date(value).toLocaleString(ar ? 'ar-EG' : 'en-GB') : '—';
    return <div className="ws-order-detail" dir={ar ? 'rtl' : 'ltr'}>
        <header className="ws-order-heading"><div><h1>{text('تفاصيل الطلب', 'Order details')} <bdi>#{order.order_number}</bdi></h1><p>{date(order.placed_at || order.created_at)}</p></div><Link to={`${uiBase}/orders`}>{text('الطلبات', 'Orders')}</Link></header>
        {location.state?.manualRecovered ? <p role="status" className="ws-orders-notice">{text('عثرنا على طلب هذه المحاولة. راجع بياناته قبل تعديلها.', 'We found the order from this attempt. Review its details before making changes.')}</p> : null}
        {error ? <p role="alert" className="ws-orders-error">{error}<button onClick={() => void load()}>{text('إعادة التحميل', 'Reload')}</button></p> : null}
        {notice ? <p role="status" className="ws-orders-notice">{notice}</p> : null}
        <div className="ws-order-toolbar"><StatusBadge status={order.status} label={orderStatusLabel(order.status, ar)} />{archived ? <span className="ws-order-archived">{text('مؤرشف', 'Archived')}</span> : null}{order.review?.classification ? <span className={`ws-order-review is-${order.review.classification}`}>{reviewLabels[order.review.classification]?.[ar ? 0 : 1]}</span> : null}
            {requiresShipping && order.fulfillment_status ? <span className={`ws-dt-badge ${FULFILLMENT_STATUS_TONES[order.fulfillment_status] || ''}`} data-testid="order-fulfillment-badge">{fulfillmentLabel(FULFILLMENT_STATUSES, order.fulfillment_status, ar)}</span> : null}
            {canManage && !archived ? <>
                <button type="button" onClick={() => setEditing(true)}>{text('تعديل الطلب', 'Edit order')}</button>
                <button type="button" onClick={() => open('status')} disabled={!next.length}>{text('تحديث الحالة', 'Update status')}</button>
                {requiresShipping && FULFILLABLE_ORDER_STATUSES.includes(order.status) && order.fulfillment_status !== 'fulfilled' ? <button type="button" onClick={() => setFulfilOpen(true)}>{text('شحن المنتجات', 'Fulfill items')}</button> : null}
                {refundsVisible(order) ? <button type="button" onClick={() => setRefundOpen(true)}>{text('استرداد', 'Refund')}</button> : null}
                <button type="button" onClick={() => open('review')}>{text('تصنيف الطلب', 'Classify order')}</button>
                {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer">{text('تأكيد عبر واتساب', 'Confirm via WhatsApp')}</a> : null}
                <button type="button" onClick={() => open('webhook')}><HiOutlineArrowPath aria-hidden />{text('إعادة إرسال الويب هوك', 'Resend webhook')}</button>
                <Link to={`${uiBase}/orders/print?ids=${order.id}`} target="_blank" rel="noopener noreferrer"><HiOutlinePrinter aria-hidden />{text('طباعة الطلب', 'Print order')}</Link>
                <button type="button" onClick={() => open('block')} disabled={!phone}>{text('حظر الرقم', 'Block phone')}</button>
                {['cancelled', 'delivered', 'refunded'].includes(order.status) ? <button type="button" onClick={() => open('archive')}><HiOutlineArchiveBox aria-hidden />{text('أرشفة', 'Archive')}</button> : null}
            </> : null}
            {canManage && archived ? <button type="button" onClick={() => open('restore')}>{text('استرجاع الطلب', 'Restore order')}</button> : null}
        </div>
        <div className="ws-order-layout"><div className="ws-order-primary">
            <DetailCard title={text('عناصر سلة التسوق', 'Cart items')}><div className="ws-order-cart-scroll"><table><thead><tr><th>{text('المنتج', 'Product')}</th><th>{text('السعر', 'Price')}</th><th>{text('الكمية', 'Quantity')}</th><th>{text('الإجمالي', 'Total')}</th></tr></thead><tbody>{(order.items || []).map(item => <tr key={item.id}><td><strong>{item.name}</strong>{item.variant_name ? <small>{item.variant_name}</small> : null}{item.sku ? <small><bdi>{item.sku}</bdi></small> : null}<PersonalizationSummary entries={item.personalization} /><DigitalDeliverySummary delivery={item.digital_delivery} /></td><td><bdi>{money(item.unit_price)}</bdi></td><td>{item.quantity}</td><td><bdi>{money(item.line_total)}</bdi></td></tr>)}</tbody></table></div>{!order.items?.length ? <p className="ws-order-muted">{text('لا توجد عناصر في الطلب.', 'This order has no items.')}</p> : null}</DetailCard>
            <DetailCard title={text('ملخص الطلب', 'Order summary')}><dl className="ws-order-summary"><DataRow label={text('مجموع المنتجات', 'Subtotal')}><bdi>{money(order.subtotal)}</bdi></DataRow><DataRow label={text('تكلفة الشحن', 'Shipping cost')}><bdi>{money(order.shipping_total)}</bdi></DataRow><DataRow label={text('الخصم', 'Discount')}><bdi>−{money(order.discount_total)}</bdi></DataRow>{Number(order.tax_total) !== 0 ? <DataRow label={order.manual_tax_included ? text('الضريبة المشمولة', 'Included tax') : text('الضريبة', 'Tax')}><bdi>{money(order.tax_total)}</bdi></DataRow> : null}{Number(order.payment_adjustment_total || 0) !== 0 ? <DataRow label={Number(order.payment_adjustment_total) < 0 ? text('خصم طريقة الدفع', 'Payment method discount') : text('رسوم طريقة الدفع', 'Payment method fee')}><bdi>{money(order.payment_adjustment_total)}</bdi></DataRow> : null}{Number(order.manual_adjustment_total) !== 0 ? <DataRow label={text('تسوية الإجمالي', 'Total adjustment')}><bdi>{money(order.manual_adjustment_total)}</bdi></DataRow> : null}<DataRow label={text('الإجمالي', 'Total')}><strong><bdi>{money(order.grand_total)}</bdi></strong></DataRow>{Number(order.gift_card_total || 0) > 0 ? <>{(order.gift_cards ?? []).map((card) => <DataRow key={`${card.gift_card_id}-${card.last4}`} label={<>{text('بطاقة هدية', 'Gift card')} <bdi dir="ltr">•••• {card.last4}</bdi></>}><bdi>−{money(card.amount)}</bdi></DataRow>)}<DataRow label={text('المبلغ المستحق', 'Amount due')}><strong><bdi>{money(orderAmountDue(order))}</bdi></strong></DataRow></> : null}</dl></DetailCard>
            {shipmentsVisible(order, requiresShipping) ? <StoreOrderFulfillments key={`fulfillments-${endpoint}:${scopeKey}`} orderVersion={`${order.status}:${order.updated_at}`} apiBase={apiBase} endpoint={endpoint} order={order} ar={ar} theme={theme} canManage={canManage && !archived} open={fulfilOpen} onOpenChange={setFulfilOpen} onOrderUpdated={() => void load()} /> : null}
            {refundsVisible(order) ? <StoreOrderRefunds key={`refunds-${endpoint}:${scopeKey}`} apiBase={apiBase} endpoint={endpoint} order={order} ar={ar} theme={theme} canManage={canManage && !archived} open={refundOpen} onOpenChange={setRefundOpen} onOrderUpdated={() => void load()} /> : null}
            {!archived ? <details className="ws-order-extra"><summary>{text('الدفع والشحن والتسليم', 'Payment, shipping and delivery')}</summary><div className="ws-order-extra-content">
                <DetailCard title={text('الدفع', 'Payment')}><PaymentMethodLogo slug={order.payment_method} /><p>{order.payment_method === 'bank_transfer' ? text('تحويل بنكي', 'Bank transfer') : order.payment_method === 'cod' ? text('الدفع عند الاستلام', 'Cash on delivery') : order.payment_method === 'gift_card' ? text('بطاقة هدية', 'Gift card') : order.payment_method} · {order.payment_status === 'paid' ? text('مدفوع', 'Paid') : PAYMENT_STATUS_LABELS[order.payment_status] && order.payment_status !== 'pending' ? PAYMENT_STATUS_LABELS[order.payment_status][ar ? 0 : 1] : text('بانتظار الدفع', 'Awaiting payment')}</p>{canManage && ['bank_transfer', 'transfer_receipt'].includes(order.payment_method) && order.payment_status !== 'paid' && !['cancelled', ...ORDER_RETURN_STATUSES].includes(order.status) ? <button className="ws-order-primary-button" onClick={() => open('bank')}>{text('مراجعة تأكيد الدفع', 'Review payment confirmation')}</button> : null}{canManage && order.payment_method === 'transfer_receipt' ? <StoreOrderTransferProofs endpoint={endpoint} ar={ar} canManage={canManage} paid={order.payment_status === 'paid'} /> : null}</DetailCard>
                <StoreOrderCashPayment key={`cash-${endpoint}`} order={order} apiBase={apiBase} onOrderUpdated={() => void load()} />
                {requiresShipping ? <StoreOrderShipment key={`shipment-${endpoint}`} order={order} apiBase={apiBase} uiBase={uiBase} onOrderUpdated={() => void load()} /> : <DetailCard title={text('التسليم الرقمي', 'Digital delivery')}><p>{text('يتاح للمشتري الإيصال الخاص والمنتجات بعد تأكيد الدفع.', 'The private receipt and products become available to the buyer after payment confirmation.')}</p></DetailCard>}
                {digital ? <><StoreOrderDigitalEmail key={`email-${endpoint}`} order={order} apiBase={apiBase} onOrderUpdated={() => void load()} /><StoreOrderDigitalDelivery key={`delivery-${endpoint}`} order={order} apiBase={apiBase} onOrderUpdated={() => void load()} /></> : null}
                <StoreOrderNotifications key={`notifications-${endpoint}`} order={order} apiBase={apiBase} />
            </div></details> : null}
            <DetailCard title={text('سجل الطلب', 'Order history')}><ol className="ws-order-history">{(order.timeline || []).map((event, index) => <li key={index}><strong>{eventLabels[event.source]?.[ar ? 0 : 1] || (event.from_status === event.to_status && event.notes ? text('ملاحظة', 'Note') : orderStatusLabel(event.to_status, ar))}</strong><small>{event.actor || text('النظام أو العميل', 'System or customer')} · {date(event.created_at)}</small>{event.notes ? <p>{event.notes}</p> : null}</li>)}</ol>{!order.timeline?.length ? <p className="ws-order-muted">{text('لا توجد أحداث بعد.', 'No events yet.')}</p> : null}</DetailCard>
        </div><aside className="ws-order-secondary">
            {order.protection?.length ? <DetailCard title={text('الحماية من الطلبات الوهمية', 'Fake order protection')}><p>{text('فُعّلت القواعد التالية عند إنشاء الطلب:', 'These rules fired when the order was placed:')}</p><ul className="ws-order-protection">{order.protection.map((signal) => <li key={signal.rule}>{protectionSignalText(signal, ar)}</li>)}</ul>{order.review?.automatic ? <p className="ws-order-muted">{text('التصنيف تلقائي ويمكنك تغييره أو إزالته.', 'The classification is automatic; you can change or clear it.')}</p> : null}</DetailCard> : null}
            <DetailCard title={text('بيانات العميل', 'Customer details')}><dl className="ws-order-data"><DataRow label={text('اسم العميل', 'Customer name')}>{order.customer?.name}</DataRow><DataRow label={text('رقم الهاتف', 'Phone')}><bdi>{phone || '—'}</bdi></DataRow><DataRow label={text('البريد الإلكتروني', 'Email')}><bdi>{order.customer?.email || '—'}</bdi></DataRow><DataRow label={text('رقم بديل', 'Alternative phone')}><bdi>{address.phone_alt || '—'}</bdi></DataRow><DataRow label={text('فحص الحماية', 'Bot protection')}>{orderBotLabel(order.bot_verified, ar)}</DataRow></dl></DetailCard>
            <DetailCard title={text('بيانات الشحن', 'Shipping details')}><dl className="ws-order-data"><DataRow label={text('الدولة', 'Country')}>{address.country}</DataRow><DataRow label={text('المحافظة', 'Governorate')}>{address.region || address.governorate || address.state}</DataRow><DataRow label={text('المدينة', 'City')}>{address.city}</DataRow><DataRow label={text('العنوان', 'Address')}>{[address.line1, address.line2].filter(Boolean).join(', ')}</DataRow>{address.national_address ? <DataRow label={text('العنوان الوطني', 'National address')}>{address.national_address}</DataRow> : null}{address.delivery_option ? <DataRow label={text('طريقة الشحن', 'Shipping option')}>{address.delivery_option}</DataRow> : null}</dl></DetailCard>
            <DetailCard title={text('الكوبونات والخصومات', 'Coupons and discounts')}><dl className="ws-order-data"><DataRow label={text('كود الكوبون', 'Coupon code')}>{order.coupon_code}</DataRow><DataRow label={text('الخصم', 'Discount')}><bdi>{money(order.discount_total)}</bdi></DataRow></dl></DetailCard>
            <DetailCard title={text('ملاحظات الطلب', 'Order notes')} className="ws-order-notes">{order.customer_notes ? <p>{order.customer_notes}</p> : <p className="ws-order-muted">{text('لا توجد ملاحظات من العميل.', 'No customer notes.')}</p>}{canManage && !archived ? <PrivateOrderNote key={endpoint} endpoint={endpoint} ar={ar} onSaved={() => void load()} /> : null}</DetailCard>
            <DetailCard title={text('مصدر الطلب', 'Order UTMs')}><dl className="ws-order-data"><DataRow label={text('مصدر الحملة', 'Campaign source')}>{order.marketing_attribution?.source}</DataRow><DataRow label={text('اسم الحملة', 'Campaign name')}>{order.marketing_attribution?.campaign}</DataRow><DataRow label={text('كود الإحالة', 'Referral code')}>{order.referral_attribution?.code}</DataRow><DataRow label={text('طريقة الإنشاء', 'Created via')}>{order.entry_source === 'manual' ? text('طلب يدوي', 'Manual order') : text('المتجر', 'Storefront')}</DataRow></dl></DetailCard>
        </aside></div>
        {editing && canManage && !archived ? <StoreOrderEditModal key={`${endpoint}:${scopeKey}`} apiBase={apiBase} orderId={order.id} ar={ar} theme={theme} onClose={() => setEditing(false)} onSaved={(updated, recovered) => { setOrder(updated); setLoadedScope(scopeKey); setEditing(false); setNotice(recovered ? text('تحققنا من حفظ التعديل. هذه أحدث بيانات الطلب.', 'We reconciled the saved edit. These are the latest order details.') : text('حُفظ تعديل الطلب.', 'Order changes saved.')); }} /> : null}
        <Dialog open={Boolean(dialog)} onClose={close} className="ws-orders-dialog" dir={ar ? 'rtl' : 'ltr'} data-workspace-theme={theme}><DialogBackdrop transition className="ws-orders-backdrop ws-order-transition" /><div className="ws-orders-dialog-position"><DialogPanel transition className="ws-order-action-panel ws-order-transition"><form onSubmit={submit}><header><DialogTitle>{label?.[ar ? 0 : 1]}</DialogTitle><button type="button" onClick={close} disabled={busy} aria-label={text('إغلاق', 'Close')}><HiOutlineXMark aria-hidden /></button></header><div className="ws-order-action-body">
            {dialog === 'status' ? <label>{text('الحالة الجديدة', 'New status')}<select required value={status} disabled={busy} onChange={event => setStatus(event.target.value)}><option value="">{text('اختر الحالة', 'Choose status')}</option>{next.map(value => <option value={value} key={value}>{orderStatusLabel(value, ar)}</option>)}</select></label> : null}
            {dialog === 'status' && ORDER_RETURN_STATUSES.includes(status) ? <p>{text('تتبع إرجاع المنتجات لا يصدر استردادًا ماليًا ولا يعيد المخزون تلقائيًا.', 'Tracking a product return does not issue a payment refund or automatically restock products.')}</p> : null}
            {dialog === 'review' ? <><p>{text('تصنيف يدوي للمراجعة؛ تبقى حالة الطلب والدفع كما هي.', 'A manual review classification. Order and payment status stay as recorded.')}</p><label>{text('التصنيف', 'Classification')}<select value={classification} disabled={busy} onChange={event => setClassification(event.target.value)}>{Object.entries(reviewLabels).map(([key, labels]) => <option key={key} value={key}>{labels[ar ? 0 : 1]}</option>)}</select></label></> : null}
            {dialog === 'block' ? <p>{text('سيمنع الحظر هذا الرقم من إنشاء طلبات جديدة في هذا المتجر. الطلب الحالي يبقى كما هو.', 'Blocking prevents this number from placing new orders in this store. The current order remains as recorded.')} <bdi>{phone}</bdi></p> : null}
            {dialog === 'webhook' ? <p>{text('إرسال بيانات الطلب الحالية إلى روابط استقبال الطلبات المفعّلة في إعدادات متجرك.', 'Send the current order snapshot to the enabled order webhook destinations in your store settings.')}</p> : null}
            {dialog === 'archive' || dialog === 'restore' ? <p>{dialog === 'archive' ? text('سيختفي الطلب من قائمة الطلبات. تُحفظ بياناته وسجله ويمكن استرجاعه من هذا الرابط.', 'This order will leave the orders list. Its data and history remain available for restoration from this link.') : text('سيعود الطلب إلى القائمة بحالته السابقة دون إرسال أو تحصيل جديد.', 'Restore the order to the list with its recorded status, without a new delivery or collection.')}</p> : null}
            {dialog === 'bank' ? <><p>{text('أكد فقط بعد التحقق من وصول', 'Confirm only after verifying receipt of')} <bdi>{money(orderAmountDue(order))}</bdi>. {text('يتيح التأكيد المنتجات الرقمية للمشتري.', 'Confirmation releases digital products to the buyer.')}</p><label>{text('مرجع التحويل البنكي', 'Bank transfer reference')}<input required maxLength={200} value={bankReference} disabled={busy} onChange={event => setBankReference(event.target.value)} /></label></> : null}
            {['status', 'review', 'block', 'bank'].includes(dialog) ? <label>{text('ملاحظة داخلية (اختياري)', 'Internal note (optional)')}<textarea rows={3} maxLength={2000} disabled={busy} value={note} onChange={event => setNote(event.target.value)} /></label> : null}
            {actionError ? <p role="alert" className="ws-orders-error">{actionError}</p> : null}
        </div><footer><button type="button" onClick={close} disabled={busy}>{text('إلغاء', 'Cancel')}</button><button className="ws-order-primary-button" type="submit" disabled={busy || (dialog === 'status' && !status) || (dialog === 'bank' && !bankReference.trim())}>{busy ? text('جار الحفظ…', 'Saving…') : text('تأكيد', 'Confirm')}</button></footer></form></DialogPanel></div></Dialog>
    </div>;
}

function PrivateOrderNote({ endpoint, ar, onSaved }) {
    const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const active = useRef(true); const working = useRef(false);
    useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
    async function save(event) {
        event.preventDefault(); if (working.current || !note.trim()) return; working.current = true; setBusy(true); setError('');
        try { await api.post(`${endpoint}/note`, { note }); if (active.current) { setNote(''); onSaved(); } }
        catch (e) { if (active.current) setError(errorMessage(e)); }
        finally { if (active.current) { working.current = false; setBusy(false); } }
    }
    return <form className="ws-order-note-form" onSubmit={save}><label>{ar ? 'ملاحظة داخلية' : 'Internal note'}<textarea required rows={3} maxLength={2000} value={note} disabled={busy} onChange={event => setNote(event.target.value)} /></label>{error ? <p role="alert" className="ws-orders-error">{error}</p> : null}<button className="ws-order-primary-button" disabled={busy || !note.trim()}>{ar ? 'إضافة ملاحظة' : 'Add note'}</button></form>;
}
