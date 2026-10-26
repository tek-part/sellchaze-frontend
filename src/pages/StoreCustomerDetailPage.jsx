import { useEffect, useId, useMemo, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { mergeTags, readCustomerKey } from '../lib/customerKeys';
import { HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlinePencilSquare, HiOutlineXMark } from '../components/workspace/WorkspaceIcons';
import { orderStatusLabel } from '../components/store/orders/order-workspace';
import '../components/data-table/data-table.css';
import '../components/store/orders/order-detail.css';
import './store/customer-detail.css';

const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;
const MAX_NOTE = 5000;

const sameTags = (a, b) => a.length === b.length && a.every((tag, index) => tag === b[index]);

function draftOf(customer) {
    return {
        tags: customer.profile.tags, note: customer.profile.note ?? '', accepts_marketing: customer.marketing.accepts_marketing,
        name: customer.profile.name ?? '', email: customer.profile.email ?? '', phone: customer.profile.phone ?? '',
    };
}

/**
 * One customer of the order-built directory (guest or registered), Shopify-style: stats, orders,
 * addresses, tags, an internal note, marketing consent and contact overrides.
 */
export default function StoreCustomerDetailPage() {
    const { apiBase, uiBase } = useStoreScope();
    const { store } = useOutletContext();
    const [params] = useSearchParams();
    const key = readCustomerKey(params.get('key'));
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => (ar ? a : e);
    const ids = useId();

    const [customer, setCustomer] = useState(null);
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [page, setPage] = useState(1);
    const [reload, setReload] = useState(0);
    const [known, setKnown] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [tagError, setTagError] = useState('');
    const [editingContact, setEditingContact] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState('');
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        let active = true;
        if (!key) { setLoading(false); setLoadError(text('لم يتم تحديد عميل.', 'No customer was selected.')); return undefined; }
        setLoading(true);
        setLoadError('');
        api.get(`${apiBase}/customers/profile`, { params: { key, page } })
            .then(({ data }) => {
                if (!active) return;
                setCustomer(data.data);
                setDraft((current) => (current && current.key === key ? current : { key, ...draftOf(data.data) }));
            })
            .catch((error) => { if (active) setLoadError(error.response?.status === 404 ? text('هذا العميل غير موجود في متجرك.', 'This customer does not exist in your store.') : errorText(error)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, key, page, reload]);

    useEffect(() => {
        let active = true;
        api.get(`${apiBase}/customers/tags`).then(({ data }) => { if (active) setKnown((data.data ?? []).map((row) => row.tag)); }).catch(() => {});
        return () => { active = false; };
    }, [apiBase]);

    const money = (value) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: customer?.stats.currency || store?.currency || 'EGP', maximumFractionDigits: 2 }).format(Number(value || 0));
    const date = (value) => (value ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—');

    const changes = useMemo(() => {
        if (!customer || !draft) return {};
        const base = draftOf(customer);
        const body = {};
        if (!sameTags(draft.tags, base.tags)) body.tags = draft.tags;
        if (draft.note.trim() !== base.note.trim()) body.note = draft.note.trim() || null;
        if (draft.accepts_marketing !== base.accepts_marketing) body.accepts_marketing = draft.accepts_marketing;
        for (const field of ['name', 'email', 'phone']) if (draft[field].trim() !== base[field].trim()) body[field] = draft[field].trim() || null;
        return body;
    }, [customer, draft]);
    const dirty = Object.keys(changes).length > 0;

    const patch = (values) => { setDraft((current) => ({ ...current, ...values })); setSaved(''); };
    const addTags = (value = tagInput) => {
        // Reuse the store's existing spelling so "vip" joins the "VIP" segment.
        const spelled = String(value).split(',').map((piece) => known.find((tag) => tag.toLowerCase() === piece.replace(/\s+/g, ' ').trim().toLowerCase()) ?? piece).join(',');
        const next = mergeTags(draft.tags, spelled);
        if (next.some((tag) => tag.length > MAX_TAG_LENGTH)) { setTagError(text(`يجب ألا يزيد الوسم عن ${MAX_TAG_LENGTH} حرفًا.`, `Tags can be at most ${MAX_TAG_LENGTH} characters.`)); return; }
        if (next.length > MAX_TAGS) { setTagError(text(`يمكن إضافة ${MAX_TAGS} وسمًا كحد أقصى.`, `A customer can have at most ${MAX_TAGS} tags.`)); return; }
        setTagError('');
        setTagInput('');
        if (next.length !== draft.tags.length) patch({ tags: next });
    };

    const save = async (event) => {
        event.preventDefault();
        if (!dirty || saving) return;
        setSaving(true); setSaveError(''); setSaved('');
        try {
            const { data } = await api.put(`${apiBase}/customers/profile`, { key, ...changes });
            setCustomer((current) => ({ ...data.data, orders: current?.orders ?? data.data.orders }));
            setDraft({ key, ...draftOf(data.data) });
            setEditingContact(false);
            setSaved(text('تم حفظ بيانات العميل.', 'Customer saved.'));
            if (changes.tags) setKnown((current) => mergeTags(current, data.data.profile.tags.join(',')));
        } catch (error) {
            setSaveError(errorText(error));
        } finally {
            setSaving(false);
        }
    };

    const back = <Link to={`${uiBase}/customers`} className="ws-customer-back">{ar ? <HiOutlineArrowRight aria-hidden /> : <HiOutlineArrowLeft aria-hidden />}{text('العملاء', 'Customers')}</Link>;
    if (loading && !customer) return <section className="ws-order-detail ws-customer-detail" aria-busy="true">{back}<p className="ws-order-muted">{text('جارٍ التحميل…', 'Loading…')}</p></section>;
    if (loadError && !customer) return <section className="ws-order-detail ws-customer-detail">{back}<div className="ws-customer-alert" role="alert">{loadError}
        {key ? <button type="button" onClick={() => setReload((value) => value + 1)}>{text('إعادة المحاولة', 'Retry')}</button> : null}</div></section>;

    const { contact, stats, marketing, account } = customer;
    const name = contact.name || text('عميل بدون اسم', 'Unnamed customer');
    const suggestions = known.filter((tag) => !draft.tags.some((item) => item.toLowerCase() === tag.toLowerCase()));
    const canSubscribe = marketing.can_subscribe || Boolean(draft.email.trim());
    const channels = [marketing.email.subscribed ? text('البريد', 'e-mail') : null, marketing.sms.subscribed ? text('الهاتف', 'SMS / WhatsApp') : null].filter(Boolean);
    const orders = customer.orders;

    return <section className="ws-order-detail ws-customer-detail">
        {back}
        <header className="ws-order-heading ws-customer-heading">
            <div>
                <h1 dir="auto">{name}</h1>
                <p className="ws-customer-contact">
                    {contact.phone ? <a href={`tel:${contact.phone}`} dir="ltr">{contact.phone}</a> : null}
                    {contact.email ? <a href={`mailto:${contact.email}`} dir="ltr">{contact.email}</a> : null}
                    <span className={`ws-dt-badge ${account ? 'is-info' : ''}`}>{account ? text('لديه حساب', 'Has an account') : text('ضيف', 'Guest checkout')}</span>
                    {marketing.accepts_marketing ? <span className="ws-dt-badge is-success">{text('مشترك في التسويق', 'Subscribed to marketing')}</span> : null}
                </p>
            </div>
        </header>

        <ul className="ws-customer-stats" aria-label={text('ملخص العميل', 'Customer summary')}>
            <li><span>{text('الطلبات', 'Orders')}</span><strong>{stats.orders_count}</strong></li>
            <li><span>{text('إجمالي الإنفاق', 'Amount spent')}</span><strong>{money(stats.total_spent)}</strong></li>
            <li><span>{text('متوسط قيمة الطلب', 'Average order value')}</span><strong>{money(stats.average_order_value)}</strong></li>
            <li><span>{text('أول طلب', 'First order')}</span><strong>{date(stats.first_order_at)}</strong></li>
            <li><span>{text('آخر طلب', 'Last order')}</span><strong>{date(stats.last_order_at)}</strong></li>
        </ul>

        <form className="ws-order-layout" onSubmit={save} noValidate>
            <div className="ws-order-primary">
                <section className="ws-order-card" aria-labelledby={`${ids}-orders`}>
                    <h2 id={`${ids}-orders`}>{text('الطلبات', 'Orders')} <span className="ws-order-muted">({orders.meta.total})</span></h2>
                    {stats.cancelled_count ? <p className="ws-order-muted ws-customer-hint">{text(`لا تُحتسب ${stats.cancelled_count} طلبات ملغاة في الإجمالي.`, `${stats.cancelled_count} cancelled order(s) are not counted in the totals.`)}</p> : null}
                    {orders.data.length ? <div className="ws-order-cart-scroll" tabIndex={0} role="region" aria-labelledby={`${ids}-orders`}>
                        <table className="ws-customer-orders">
                            <thead><tr><th scope="col">{text('الطلب', 'Order')}</th><th scope="col">{text('التاريخ', 'Date')}</th><th scope="col">{text('الحالة', 'Status')}</th><th scope="col">{text('الدفع', 'Payment')}</th><th scope="col">{text('الإجمالي', 'Total')}</th></tr></thead>
                            <tbody>{orders.data.map((order) => <tr key={order.id}>
                                <td><Link to={`${uiBase}/orders/${order.id}`}>#{order.order_number}</Link></td>
                                <td>{date(order.placed_at)}</td>
                                <td>{orderStatusLabel(order.status, ar)}</td>
                                <td>{paymentLabel(order.payment_status, ar)}</td>
                                <td className="ws-dt-num">{new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: order.currency || stats.currency, maximumFractionDigits: 2 }).format(order.grand_total)}</td>
                            </tr>)}</tbody>
                        </table>
                    </div> : <p className="ws-order-muted">{text('لا توجد طلبات بعد.', 'No orders yet.')}</p>}
                    {orders.meta.last_page > 1 ? <nav className="ws-customer-pager" aria-label={text('صفحات الطلبات', 'Order pages')}>
                        <button type="button" onClick={() => setPage((value) => value - 1)} disabled={page <= 1 || loading}>{text('السابق', 'Previous')}</button>
                        <span>{text(`صفحة ${orders.meta.current_page} من ${orders.meta.last_page}`, `Page ${orders.meta.current_page} of ${orders.meta.last_page}`)}</span>
                        <button type="button" onClick={() => setPage((value) => value + 1)} disabled={page >= orders.meta.last_page || loading}>{text('التالي', 'Next')}</button>
                    </nav> : null}
                </section>

                <section className="ws-order-card" aria-labelledby={`${ids}-note`}>
                    <h2 id={`${ids}-note`}>{text('ملاحظة داخلية', 'Internal note')}</h2>
                    <label className="sr-only" htmlFor={`${ids}-note-input`}>{text('ملاحظة عن العميل', 'Note about the customer')}</label>
                    <textarea id={`${ids}-note-input`} className="ws-customer-input" rows={4} maxLength={MAX_NOTE} value={draft.note} onChange={(event) => patch({ note: event.target.value })}
                        placeholder={text('مثال: يفضّل التوصيل مساءً. لا يراها العميل.', 'e.g. Prefers evening delivery. Customers never see this.')} aria-describedby={`${ids}-note-count`} />
                    <small id={`${ids}-note-count`} className="ws-order-muted">{draft.note.length}/{MAX_NOTE}</small>
                </section>
            </div>

            <div className="ws-order-secondary">
                <section className="ws-order-card" aria-labelledby={`${ids}-contact`}>
                    <div className="ws-customer-card-head">
                        <h2 id={`${ids}-contact`}>{text('بيانات التواصل', 'Contact')}</h2>
                        <button type="button" className="ws-customer-icon-button" onClick={() => setEditingContact((value) => !value)} aria-expanded={editingContact} aria-controls={`${ids}-contact-fields`}>
                            <HiOutlinePencilSquare aria-hidden />{editingContact ? text('إخفاء', 'Hide') : text('تعديل', 'Edit')}
                        </button>
                    </div>
                    {editingContact ? <div id={`${ids}-contact-fields`} className="ws-customer-fields">
                        <p className="ws-order-muted ws-customer-hint">{text('تُستخدم هذه القيم بدل بيانات الطلبات. اتركها فارغة لاستخدام بيانات آخر طلب.', 'These replace the details from orders. Leave empty to use the order details.')}</p>
                        <label>{text('الاسم', 'Name')}<input className="ws-customer-input" value={draft.name} maxLength={255} placeholder={customer.contact.name ?? ''} onChange={(event) => patch({ name: event.target.value })} /></label>
                        <label>{text('البريد الإلكتروني', 'Email')}<input className="ws-customer-input" type="email" dir="ltr" value={draft.email} maxLength={255} placeholder={customer.contact.email ?? ''} onChange={(event) => patch({ email: event.target.value })} /></label>
                        <label>{text('الهاتف', 'Phone')}<input className="ws-customer-input" type="tel" dir="ltr" value={draft.phone} maxLength={40} placeholder={customer.contact.phone ?? ''} onChange={(event) => patch({ phone: event.target.value })} /></label>
                    </div> : <dl className="ws-order-data">
                        <div><dt>{text('الاسم', 'Name')}</dt><dd dir="auto">{contact.name || '—'}</dd></div>
                        <div><dt>{text('الهاتف', 'Phone')}</dt><dd dir="ltr">{contact.phone || '—'}</dd></div>
                        <div><dt>{text('البريد', 'Email')}</dt><dd dir="ltr">{contact.email || '—'}</dd></div>
                        {account ? <div><dt>{text('الحساب', 'Account')}</dt><dd>{text(`مسجّل منذ ${date(account.created_at)}`, `Registered ${date(account.created_at)}`)}</dd></div> : null}
                    </dl>}
                </section>

                <section className="ws-order-card" aria-labelledby={`${ids}-marketing`}>
                    <h2 id={`${ids}-marketing`}>{text('التسويق', 'Marketing')}</h2>
                    <label className="ws-customer-switch">
                        <input type="checkbox" role="switch" checked={draft.accepts_marketing} disabled={!canSubscribe && !draft.accepts_marketing}
                            onChange={(event) => patch({ accepts_marketing: event.target.checked })} aria-describedby={`${ids}-marketing-hint`} />
                        <span>{text('وافق العميل على استلام رسائل تسويقية', 'Customer agreed to receive marketing')}</span>
                    </label>
                    <p id={`${ids}-marketing-hint`} className="ws-order-muted ws-customer-hint">
                        {!canSubscribe ? text('أضف بريدًا إلكترونيًا للعميل أولًا.', 'Add an email for this customer first.')
                            : marketing.accepts_marketing ? text(`مشترك عبر: ${channels.join('، ')}`, `Subscribed via ${channels.join(', ')}`) + (marketing.updated_at ? text(` · آخر تعديل ${date(marketing.updated_at)}`, ` · updated ${date(marketing.updated_at)}`) : '')
                                : text('يُضاف إلى قائمة النشرة البريدية للمتجر عند التفعيل.', 'Turning this on adds the customer to your store’s newsletter list.')}
                    </p>
                </section>

                <section className="ws-order-card" aria-labelledby={`${ids}-tags`}>
                    <h2 id={`${ids}-tags`}>{text('الوسوم', 'Tags')}</h2>
                    {draft.tags.length ? <ul className="ws-customer-tags" aria-label={text('وسوم العميل', 'Customer tags')}>
                        {draft.tags.map((tag) => <li key={tag}>
                            <Link to={`${uiBase}/customers?f.tag=${encodeURIComponent(tag)}`}>{tag}</Link>
                            <button type="button" aria-label={text(`إزالة الوسم ${tag}`, `Remove tag ${tag}`)} onClick={() => patch({ tags: draft.tags.filter((item) => item !== tag) })}><HiOutlineXMark aria-hidden /></button>
                        </li>)}
                    </ul> : null}
                    <div className="ws-customer-tag-add">
                        <label className="sr-only" htmlFor={`${ids}-tag-input`}>{text('إضافة وسم', 'Add a tag')}</label>
                        <input id={`${ids}-tag-input`} className="ws-customer-input" list={`${ids}-tag-options`} value={tagInput} maxLength={200} placeholder={text('مثال: VIP، جملة', 'e.g. VIP, wholesale')}
                            onChange={(event) => { setTagInput(event.target.value); setTagError(''); }}
                            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addTags(); } }}
                            aria-invalid={Boolean(tagError)} aria-describedby={`${ids}-tag-hint`} />
                        <datalist id={`${ids}-tag-options`}>{suggestions.map((tag) => <option key={tag} value={tag} />)}</datalist>
                        <button type="button" className="ws-customer-icon-button" onClick={() => addTags()} disabled={!tagInput.trim()}>{text('إضافة', 'Add')}</button>
                    </div>
                    <p id={`${ids}-tag-hint`} className={`ws-customer-hint ${tagError ? 'is-error' : 'ws-order-muted'}`} role={tagError ? 'alert' : undefined}>
                        {tagError || text(`${draft.tags.length}/${MAX_TAGS} · افصل بين الوسوم بفاصلة.`, `${draft.tags.length}/${MAX_TAGS} · Separate tags with commas.`)}
                    </p>
                </section>

                <section className="ws-order-card" aria-labelledby={`${ids}-address`}>
                    <h2 id={`${ids}-address`}>{text('عناوين الشحن', 'Shipping addresses')}</h2>
                    {customer.addresses.length ? <ul className="ws-customer-addresses">
                        {customer.addresses.map((address, index) => <li key={address.formatted}>
                            <p dir="auto">{address.formatted}</p>
                            <small className="ws-order-muted">{index === 0 ? text('الأحدث', 'Most recent') : text('استُخدم', 'Used')} · {date(address.used_at)}</small>
                        </li>)}
                    </ul> : <p className="ws-order-muted">{text('لا يوجد عنوان شحن.', 'No shipping address.')}</p>}
                </section>
            </div>

            <div className={`ws-customer-savebar ${dirty || saving ? 'is-dirty' : ''}`}>
                <div aria-live="polite">
                    {saved ? <p role="status" className="ws-customer-saved">{saved}</p> : null}
                    {saveError ? <p role="alert" className="ws-customer-hint is-error">{saveError}</p> : null}
                    {!saved && !saveError && dirty ? <p className="ws-order-muted">{text('لديك تغييرات غير محفوظة.', 'You have unsaved changes.')}</p> : null}
                </div>
                <div className="ws-customer-actions">
                    <button type="button" className="ws-customer-icon-button" disabled={!dirty || saving} onClick={() => { setDraft({ key, ...draftOf(customer) }); setSaveError(''); setTagError(''); }}>{text('تجاهل', 'Discard')}</button>
                    <button type="submit" className="ws-order-primary-button" disabled={!dirty || saving}>{saving ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button>
                </div>
            </div>
        </form>
    </section>;
}

function paymentLabel(status, ar) {
    const labels = { paid: ['مدفوع', 'Paid'], pending: ['في انتظار الدفع', 'Pending'], failed: ['فشل الدفع', 'Failed'], refunded: ['مسترد', 'Refunded'], partially_refunded: ['مسترد جزئيًا', 'Partially refunded'] };
    return labels[status]?.[ar ? 0 : 1] ?? status ?? '—';
}
