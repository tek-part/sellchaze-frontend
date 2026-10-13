import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdCheckCircleOutline } from 'react-icons/md';
import { BiArrowBack } from 'react-icons/bi';
import api from '../../api/client';
import './merchant-subscriptions.css';

const money = value => (value / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 });
function failureMessage(failure, text) {
    if (failure.response?.status === 402) return text('رصيد المحفظة غير كافٍ للاشتراك.', 'Your wallet balance is insufficient.');
    if (failure.response?.status === 409) return text('تغيرت الباقة أو إعداداتها. حدّث البيانات قبل المحاولة مجددًا.', 'The offer or settings changed. Refresh before trying again.');
    if (failure.response?.status === 503) return text('الاشتراكات المدفوعة غير متاحة حاليًا.', 'Paid subscriptions are currently unavailable.');
    return text('تعذر إكمال العملية. حاول مجددًا.', 'The operation could not be completed. Try again.');
}
export default function MerchantSubscriptionsPage() {
    const { me } = useOutletContext(); const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const owner = me?.roles?.some(role => ['Merchant', 'Supplier'].includes(role)) && !me?.parent_user_id;
    const [data, setData] = useState(null); const [retry, setRetry] = useState(0); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
    const [choice, setChoice] = useState(null); const [autoRenew, setAutoRenew] = useState(false); const dialog = useRef(null);
    const request = useRef(null);
    useEffect(() => {
        if (!owner) return;
        const controller = new AbortController();
        api.get('/me/merchant-subscription', { signal: controller.signal }).then(response => { setData(response.data); setError(''); })
            .catch(failure => { if (!controller.signal.aborted) setError(failureMessage(failure, (a, e) => ar ? a : e)); });
        return () => controller.abort();
    }, [owner, retry, ar]);
    if (!owner) return <Navigate to="/dashboard" replace />;
    const choose = plan => {
        if (!request.current || request.current.cycle !== plan.cycle || request.current.quote !== plan.quote) request.current = { key: crypto.randomUUID(), cycle: plan.cycle, quote: plan.quote };
        setChoice(plan); setAutoRenew(false); dialog.current.showModal();
    };
    const purchase = async () => {
        if (busy || !data.available || !choice) return;
        setBusy(true); setError('');
        try {
            await api.post('/me/merchant-subscription', { cycle: choice.cycle, quote: request.current.quote, request_key: request.current.key, auto_renew: autoRenew });
            dialog.current.close(); setChoice(null); request.current = null; setRetry(value => value + 1);
        } catch (failure) { setError(failureMessage(failure, text)); }
        finally { setBusy(false); }
    };
    const preference = async enabled => {
        if (busy) return; setBusy(true); setError('');
        try { await api.put('/me/merchant-subscription/preferences', { auto_renew: enabled, version: data.preferences.version }); setRetry(value => value + 1); }
        catch (failure) { setError(failureMessage(failure, text)); }
        finally { setBusy(false); }
    };
    const monthly = data?.plans?.find(plan => plan.cycle === 'monthly'); const yearly = data?.plans?.find(plan => plan.cycle === 'yearly');
    const discount = monthly && yearly ? Math.max(0, Math.round((1 - yearly.price_milli / (monthly.price_milli * 12)) * 100)) : 0;
    const monthFeatures = [text('عدد غير محدود من الطلبات', 'Unlimited orders'), text('لا يتم خصم أي عمولات على الطلبات', 'No per-order fees'), text('أولوية في الدعم الفني والتقني', 'Priority technical support'), text('عدد زيارات غير محدود', 'Unlimited visits'), text('عند تفعيل التجديد التلقائي تُجدد الباقة ويُسجل المبلغ المستحق حتى إذا لم يكفِ الرصيد. عند إيقافه تنتهي الباقة ويعود احتساب الرسوم بالطلب.', 'Auto-renewal records the renewal amount due even when your balance is insufficient. Without auto-renewal, the plan expires and per-order billing resumes.')];
    const yearFeatures = [text(`خصم ${discount}%`, `${discount}% discount`), text('أولوية في الدعم الفني والتقني', 'Priority technical support'), text('عدد غير محدود من الطلبات', 'Unlimited orders'), text('دفع سنوي', 'Annual billing')];
    return <section className="merchant-subscriptions" dir={ar ? 'rtl' : 'ltr'}>
        <header className="merchant-subscriptions-intro"><h1>{text('أهلا بك في الاشتراكات ✨', 'Welcome to subscriptions ✨')}</h1><p>{text('ادفع اشتراكًا شهريًا ثابتًا للحصول على عدد غير محدود من الطلبات', 'Pay a fixed subscription for unlimited orders')}</p></header>
        {!data && !error ? <p role="status">{text('جارٍ تحميل الباقات…', 'Loading plans…')}</p> : null}
        {monthly && yearly ? <div className="merchant-subscription-plans">
            <article className="merchant-subscription-card is-monthly"><h2><b dir="ltr">${money(monthly.price_milli)}</b><span>{text('/ شهريا', '/ monthly')}</span></h2><p className="merchant-subscription-description">{text('إذا كان متجرك يستقبل عددًا كبيرًا من الطلبات، يمكنك الاشتراك بمبلغ ثابت كل شهر لتوفير رسوم الطلبات وإدارة مبيعاتك دون حد لعدد الطلبات.', 'For stores with a high volume of orders, a fixed monthly subscription can reduce per-order costs while keeping order volume unlimited.')}</p><button type="button" className="merchant-subscription-buy" disabled={Boolean(data.active)} onClick={() => choose(monthly)}>{text('اشترك الان', 'Subscribe now')}<BiArrowBack aria-hidden /></button><ul>{monthFeatures.map(feature => <li key={feature}><MdCheckCircleOutline aria-hidden /><span>{feature}</span></li>)}</ul></article>
            <article className="merchant-subscription-card is-yearly"><h2>{text('الخطة السنوية', 'Annual plan')}</h2><p className="merchant-subscription-description">{text(`يمكنك الاشتراك في الخطة السنوية مقابل ${money(yearly.price_milli)}$ سنويا`, `Subscribe to the annual plan for $${money(yearly.price_milli)} per year`)}</p><button type="button" className="merchant-subscription-buy" disabled={Boolean(data.active)} onClick={() => choose(yearly)}>{text('اشترك الان', 'Subscribe now')}<BiArrowBack aria-hidden /></button><ul>{yearFeatures.map(feature => <li key={feature}><MdCheckCircleOutline aria-hidden /><span>{feature}</span></li>)}</ul></article>
        </div> : null}
        {error ? <div className="merchant-subscription-notice" role="alert">{error}<button type="button" onClick={() => setRetry(value => value + 1)}>{text('إعادة تحميل', 'Reload')}</button></div> : null}
        {data?.active ? <section className="merchant-subscription-current"><h2>{text('باقتك الحالية', 'Your current plan')}</h2><p>{text(data.active.cycle === 'yearly' ? 'الخطة السنوية' : 'الخطة الشهرية', data.active.cycle === 'yearly' ? 'Annual plan' : 'Monthly plan')} · ${money(data.active.price_milli)}</p><p>{text('تنتهي في', 'Expires on')} {new Date(data.active.ends_at).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}</p><label><input type="checkbox" role="switch" checked={data.preferences.auto_renew} disabled={busy} onChange={event => preference(event.target.checked)} />{text('التجديد التلقائي', 'Auto-renewal')}</label><p>{text('يمكنك إيقاف التجديد مع الاحتفاظ بالباقة حتى نهاية مدتها.', 'Turn off renewal and keep your plan until its expiry date.')}</p></section> : null}
        {data?.history?.length ? <details className="merchant-subscription-history"><summary>{text('سجل الاشتراكات', 'Subscription history')}</summary><div className="merchant-subscription-history-scroll"><table><thead><tr><th>{text('الباقة', 'Plan')}</th><th>{text('المبلغ', 'Amount')}</th><th>{text('البداية', 'Start')}</th><th>{text('النهاية', 'End')}</th></tr></thead><tbody>{data.history.map(row => <tr key={row.id}><td>{row.cycle === 'yearly' ? text('سنوية', 'Annual') : text('شهرية', 'Monthly')}</td><td>${money(row.price_milli)}</td><td>{new Date(row.starts_at).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}</td><td>{new Date(row.ends_at).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}</td></tr>)}</tbody></table></div></details> : null}
        <dialog ref={dialog} className="merchant-subscription-dialog" aria-labelledby="subscription-confirm-title" onCancel={event => { if (busy) event.preventDefault(); }}><h2 id="subscription-confirm-title">{text('تأكيد الاشتراك', 'Confirm subscription')}</h2>{choice ? <><p>{text(choice.cycle === 'yearly' ? 'الخطة السنوية' : 'الخطة الشهرية', choice.cycle === 'yearly' ? 'Annual plan' : 'Monthly plan')} · ${money(choice.price_milli)}</p><p>{text('سيتم خصم المبلغ من رصيد محفظتك.', 'The amount will be deducted from your wallet.')}</p><label><input type="checkbox" checked={autoRenew} disabled={busy} onChange={event => setAutoRenew(event.target.checked)} />{text('تفعيل التجديد التلقائي', 'Enable auto-renewal')}</label>{autoRenew ? <p>{text('يسمح التجديد التلقائي بتسجيل مديونية إذا لم يكن الرصيد كافيًا عند التجديد.', 'Auto-renewal records an amount due if your balance is insufficient when the plan renews.')}</p> : null}{!data?.available ? <p role="status">{text('الاشتراكات المدفوعة غير متاحة حاليًا.', 'Paid subscriptions are currently unavailable.')}</p> : data.balance_milli < choice.price_milli ? <p>{text('رصيد المحفظة غير كافٍ.', 'Your wallet balance is insufficient.')} <Link to="/top-up" onClick={() => dialog.current.close()}>{text('شحن المحفظة', 'Fund wallet')}</Link></p> : null}</> : null}<div><button type="button" disabled={busy} onClick={() => dialog.current.close()}>{text('إلغاء', 'Cancel')}</button><button type="button" disabled={busy || !data?.available || data.balance_milli < (choice?.price_milli || 0)} onClick={purchase}>{text(busy ? 'جارٍ التفعيل…' : 'تأكيد الاشتراك', busy ? 'Activating…' : 'Confirm subscription')}</button></div>{error ? <p role="alert">{error}</p> : null}</dialog>
    </section>;
}
