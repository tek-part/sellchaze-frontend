import { useEffect, useState } from 'react';
import { Navigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import '../store/merchant-catalog.css';
import './platform-wallet.css';

const money = (milli, digits = 3) => new Intl.NumberFormat('en', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(milli / 1000);
const commissionMoney = (milli) => new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(milli / 1000);

export default function PlatformWalletPage({ mode = 'wallet' }) {
    const { me } = useOutletContext();
    const [searchParams] = useSearchParams();
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const owner = me?.roles?.some((role) => role === 'Merchant' || role === 'Supplier');
    const [data, setData] = useState(null); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
    const [page, setPage] = useState(1); const [perPage, setPerPage] = useState(25); const [sort, setSort] = useState('created_at'); const [direction, setDirection] = useState('desc');
    const [copied, setCopied] = useState(false); const [creating, setCreating] = useState(false);
    const [payment, setPayment] = useState(null); const [fundingBusy, setFundingBusy] = useState(false); const [fundingError, setFundingError] = useState('');
    useEffect(() => {
        if (!owner) return undefined;
        const controller = new AbortController(); let current = true; setData(null); setError('');
        const path = mode === 'referral' ? '/me/platform-referral' : mode === 'transactions' ? '/me/platform-wallet/entries' : '/me/platform-wallet';
        api.get(path, { params: mode === 'transactions' ? { page, per_page: perPage, sort, direction } : {}, signal: controller.signal }).then(({ data: result }) => { if (current) { setData(result); if (mode === 'wallet' && result.pending_payment) setPayment(result.pending_payment); } }).catch((failure) => { if (current && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); });
        return () => { current = false; controller.abort(); };
    }, [owner, mode, page, perPage, sort, direction, retry]);
    const returnPayment = searchParams.get('wallet_payment');
    useEffect(() => {
        if (!owner || mode !== 'wallet' || !returnPayment || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(returnPayment)) return undefined;
        const controller = new AbortController(); let current = true;
        api.post(`/me/platform-wallet/payments/${returnPayment}/refresh`, {}, { signal: controller.signal }).then(({ data: result }) => { if (current) { setPayment(result); if (['paid', 'expired'].includes(result.status)) { try { sessionStorage.removeItem(`sellchaze:wallet-payment:v1:${me.id}`); } catch { /* Browser storage may be disabled. */ } } setRetry((old) => old + 1); } }).catch((failure) => { if (current && !controller.signal.aborted) setFundingError(failure.response?.data?.message || failure.message); });
        return () => { current = false; controller.abort(); };
    }, [owner, mode, returnPayment, me?.id]);
    if (!owner) return <Navigate to="/dashboard" replace />;
    const title = mode === 'referral' ? text('اربح معنا بالتسويق بالعمولة', 'Earn with our referral program') : mode === 'transactions' ? text('المعاملات', 'Transactions') : text('المحفظة', 'Wallet');
    const subtitle = mode === 'referral' ? text('شارك رابط المنصة وتابع العمولات النقدية الناتجة عن شحن الرصيد.', 'Share the platform link and track cash commissions from confirmed funding.') : mode === 'transactions' ? text('ستجد اخر المعاملات التي قمت بها مثل الشحن او الخصومات', 'View your latest funding, fees and refunds') : text('هذه الصفحة مختصة باظهار رصيدك والمبلغ المستحق الدفع وشحن الرصيد', 'View your wallet balance, amount due and funding information');
    const labels = { topup: text('شحن رصيد المحفظة', 'Wallet funding'), refund: text('استرداد شحن الرصيد', 'Funding refund'), order_fee: text('رسوم طلب', 'Order fee') };
    const toggleSort = (field) => { setDirection(sort === field && direction === 'asc' ? 'desc' : 'asc'); setSort(field); setPage(1); };
    const pendingPayment = payment && ['creating', 'uncertain', 'pending'].includes(payment.status);
    const startFunding = async (amount) => {
        setFundingBusy(true); setFundingError('');
        try {
            const storageKey = `sellchaze:wallet-payment:v1:${me.id}`;
            let request; try { request = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { request = null; }
            if (!request || request.amount !== amount || !/^[a-f0-9-]{36}$/i.test(request.key || '')) request = { amount, key: crypto.randomUUID() };
            sessionStorage.setItem(storageKey, JSON.stringify(request));
            const result = await api.post('/me/platform-wallet/fund', { amount_milli: amount, request_key: request.key });
            setPayment(result.data);
            if (['paid', 'expired'].includes(result.data.status)) sessionStorage.removeItem(storageKey);
            if (result.data.status === 'pending' && result.data.redirect_url) window.location.assign(result.data.redirect_url);
        } catch (failure) { setFundingError(failure.response?.data?.message || failure.message); setRetry((old) => old + 1); }
        finally { setFundingBusy(false); }
    };
    return <div className={`ws-platform-wallet is-${mode}`} dir={ar ? 'rtl' : 'ltr'}><header className="ws-catalog-header"><div><h1>{title}</h1><p>{subtitle}</p></div></header>
        {error ? <div role="alert" className="ws-catalog-error"><p>{error}</p><button onClick={() => setRetry((old) => old + 1)}>{text('إعادة المحاولة', 'Try again')}</button></div> : !data ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : mode === 'wallet' ? <>
            <div className="ws-platform-wallet-balance"><div><p>{text('رصيدك الحالي', 'Current balance')}</p><strong dir="ltr">{money(data.balance_milli)} $</strong></div><div><p>{text('المبلغ المستحق الدفع', 'Amount due')}</p><strong dir="ltr">{money(data.amount_due_milli, 2)} $</strong></div></div>
            <p className="ws-platform-wallet-explanation">{data.fees_enabled ? text(`يُخصم ${money(data.fee_milli, 2)} دولار من رصيدك لكل طلب جديد.`, `${money(data.fee_milli, 2)} USD is deducted for each new order.`) : text('خصم رسوم الطلبات غير مفعّل حاليًا.', 'Order fees are currently disabled.')}</p>
            {data.fees_enabled ? <p className="ws-platform-wallet-notice">{text(`عند مديونية ${data.debt_order_limit} طلبات تُحجب بيانات الطلبات الجديدة حتى تسوية المديونية. تبقى الطلبات القديمة متاحة ويستمر استقبال طلبات العملاء.`, `At a debt of ${data.debt_order_limit} order fees, new order details are hidden until the debt is settled. Existing orders remain available and customers can still order.`)}</p> : null}
            {!data.funding_provider_configured ? <p className="ws-platform-wallet-notice">{text('شحن الرصيد الإلكتروني غير متاح حاليًا.', 'Online funding is currently unavailable.')}</p> : null}
            {fundingError ? <p role="alert" className="ws-catalog-error">{fundingError}</p> : null}
            {payment ? <div className="ws-platform-payment-status" role="status"><p>{payment.status === 'paid' ? payment.test_mode ? text('اكتمل دفع تجريبي؛ لم يُضف رصيد مالي.', 'Sandbox payment completed; no real wallet credit was added.') : text('تم تأكيد الدفع وإضافة الرصيد.', 'Payment verified and wallet credited.') : payment.status === 'expired' ? text('انتهت صلاحية فاتورة الدفع.', 'The payment invoice expired.') : text('توجد محاولة شحن قيد الانتظار أو التحقق. أكمل الفاتورة نفسها قبل إنشاء محاولة جديدة.', 'A funding attempt is pending or needs verification. Complete the same invoice before starting another.')}</p>{pendingPayment && payment.redirect_url ? <a href={payment.redirect_url}>{text('متابعة الدفع لدى فواتيرك', 'Continue with Fawaterak')}</a> : null}{pendingPayment ? <button disabled={fundingBusy} onClick={async () => { setFundingBusy(true); setFundingError(''); try { const result = await api.post(`/me/platform-wallet/payments/${payment.id}/refresh`); setPayment(result.data); if (["paid", "expired"].includes(result.data.status)) { try { sessionStorage.removeItem(`sellchaze:wallet-payment:v1:${me.id}`); } catch { /* Optional browser storage. */ } } setRetry((old) => old + 1); } catch (failure) { setFundingError(failure.response?.data?.message || failure.message); } finally { setFundingBusy(false); } }}>{text('التحقق من الدفع', 'Check payment')}</button> : null}</div> : null}
            <section className="ws-platform-funding" aria-label={text('شحن رصيد المحفظة', 'Fund your wallet')}><h2>{text('شحن الرصيد باستخدام فواتيرك', 'Add credit with Fawaterak')}</h2><p>{text('تُعرض طرق الدفع المتاحة في صفحة فواتيرك الآمنة. المبالغ التالية بالدولار الأمريكي.', 'Available payment methods are shown on the secure Fawaterak checkout. Amounts below are in USD.')}</p>{data.funding_test_mode && data.funding_provider_configured ? <p className="ws-platform-wallet-notice">{text('وضع الاختبار مفعّل؛ المدفوعات التجريبية لا تُضاف إلى الرصيد ولا تولّد عمولات.', 'Sandbox mode: test payments do not add wallet credit or generate commission.')}</p> : null}<div className="ws-platform-funding-grid">{data.funding_presets_milli?.map((amount) => <article key={amount}><strong dir="ltr">${amount / 1000}</strong><p>{text(`اشحن رصيدك بقيمة ${amount / 1000} دولار`, `Add ${amount / 1000} USD in wallet credit`)}</p><ul><li>{text('الرصيد دون تاريخ انتهاء', 'Credit has no expiry date')}</li><li>{text('رسوم الطلبات الجديدة فقط', 'Fees apply to new orders only')}</li><li>{text('إضافة الرصيد بعد تأكيد الدفع', 'Credit added after payment verification')}</li></ul><button disabled={!data.funding_provider_configured || fundingBusy || pendingPayment} onClick={() => startFunding(amount)}>{text('شحن محفظتك', 'Fund your wallet')}</button></article>)}</div></section>
        </> : mode === 'referral' ? <>
            <div className="ws-platform-commission-card"><div><p>{text('عمولتك', 'Your commission')}</p><strong dir="ltr">{commissionMoney(data.commission_milli)} $</strong></div></div>
            <p className="ws-platform-referral-explanation">{data.commissions_enabled ? text(`عمولتك ${data.commission_basis_points / 100}% من شحن الرصيد المؤكد للمستخدمين الذين سجلوا من خلال رابطك، وتُحسب نقدًا ولا تُضاف إلى رصيد المحفظة.`, `Your cash commission is ${data.commission_basis_points / 100}% of confirmed funding by referred members and is separate from wallet credit.`) : text('احتساب العمولات غير مفعّل حاليًا. يمكنك إنشاء رابطك ومتابعة إحالاتك.', 'Commission accrual is currently disabled. You can create your link and track referrals.')}</p>
            <p>{text('عدد المتاجر المُحالة', 'Referred stores')}: {data.referred_stores}</p><p className="ws-platform-wallet-notice">{text(`يتطلب سحب العمولة إنشاء ${data.minimum_referred_stores} متاجر من خلال الإحالات.`, `Commission withdrawal requires ${data.minimum_referred_stores} referred stores.`)}</p>
            <h2>{text('الرابط الخاص بك', 'Your referral link')}</h2>{data.link ? <button className="ws-platform-referral-link" dir="ltr" onClick={async () => { try { await navigator.clipboard.writeText(data.link); setCopied(true); } catch { setError(text('تعذر النسخ. حدد الرابط وانسخه يدويًا.', 'Copy failed. Select and copy the link manually.')); } }}>{data.link}</button> : <button className="ws-platform-create" disabled={creating} onClick={async () => { setCreating(true); try { const result = await api.post('/me/platform-referral'); setData(result.data); } catch (failure) { setError(failure.response?.data?.message || failure.message); } finally { setCreating(false); } }}>{text('إنشاء رابط الإحالة', 'Create referral link')}</button>}{copied ? <p role="status">{text('تم نسخ الرابط', 'Link copied')}</p> : null}
        </> : <>
            <div className="ws-platform-transactions"><table><thead><tr><th aria-sort={sort === 'type' ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button onClick={() => toggleSort('type')}>{text('تفاصيل المعاملة', 'Transaction details')}</button></th><th aria-sort={sort === 'amount' ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button onClick={() => toggleSort('amount')}>{text('القيمة', 'Amount')}</button></th><th>{text('حالة العملية', 'Status')}</th><th aria-sort={sort === 'created_at' ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button onClick={() => toggleSort('created_at')}>{text('تاريخ الإنشاء', 'Created at')}</button></th></tr></thead><tbody>{data.data.length ? data.data.map((row) => <tr key={row.id}><td>{row.row_kind === 'balance' ? text('رصيدك بعد المعاملة', 'Balance after transaction') + ': ' + money(row.balance_after_milli) + ' $' : labels[row.type] || row.type}</td><td dir="ltr">{row.amount_milli === null ? '' : money(row.amount_milli) + ' $'}</td><td>{row.row_kind === 'balance' ? text('تفاصيل الرصيد', 'Balance details') : text('مسجلة', 'Recorded')}</td><td>{new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { dateStyle: 'short' }).format(new Date(row.created_at))}</td></tr>) : <tr><td colSpan="4">{text('لا توجد معاملات', 'No transactions')}</td></tr>}</tbody></table></div>
            <div className="ws-platform-pagination"><label>{text('الصفوف لكل صفحة:', 'Rows per page:')}<select value={perPage} onChange={(event) => { setPerPage(Number(event.target.value)); setPage(1); }}>{[25, 50, 100].map((value) => <option key={value}>{value}</option>)}</select></label><span>{data.meta.total ? `${(page - 1) * perPage + 1}-${Math.min(page * perPage, data.meta.total)}` : '0-0'} {text('من', 'of')} {data.meta.total}</span><button disabled={page <= 1} onClick={() => setPage((old) => old - 1)}>{text('السابق', 'Previous')}</button><button disabled={page >= data.meta.last_page} onClick={() => setPage((old) => old + 1)}>{text('التالى', 'Next')}</button></div>
        </>}
    </div>;
}
