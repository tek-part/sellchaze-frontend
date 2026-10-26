import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import FormField, { INPUT_CLASS } from '../ui/FormField';
import Toggle from '../ui/Toggle';
import { notify } from '../ui/notify';
import { depositSettingsPayload } from '../../lib/order-deposit';

const ERRORS = {
    empty: ['أدخل نسبة العربون أو حدًا أدنى أو كليهما.', 'Enter a deposit percentage, a minimum amount, or both.'],
    percentage: ['النسبة بين 0 و100.', 'The percentage is between 0 and 100.'],
    minimum: ['أدخل حدًا أدنى صحيحًا.', 'Enter a valid minimum amount.'],
    scope: ['اختر الطلبات التي يُطلب منها العربون.', 'Choose which orders need a deposit.'],
};

/** G1 (TAR-036 #1): the store's deposit (عربون) setting, off by default. */
export default function StorePaymentDepositSettings({ apiBase, currency }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        api.get(`${apiBase}/payments/deposit`).then(({ data }) => { if (active) { setDraft(data.data); setError(''); } })
            .catch((failure) => { if (active) setError(failure.response?.data?.message || failure.message); });
        return () => { active = false; };
    }, [apiBase, attempt]);
    const patch = (value) => setDraft((current) => ({ ...current, ...value }));
    const save = async (event) => {
        event.preventDefault();
        if (saving || !draft) return;
        const result = depositSettingsPayload(draft);
        if (result.error) { setError(ERRORS[result.error][ar ? 0 : 1]); return; }
        setSaving(true); setError('');
        try {
            const { data } = await api.put(`${apiBase}/payments/deposit`, result.payload);
            setDraft(data.data);
            notify.success(text('تم حفظ إعدادات العربون', 'Deposit settings saved'));
        } catch (failure) {
            const message = failure.response?.status === 409 ? text('تغيّرت الإعدادات من مكان آخر. أعد التحميل ثم احفظ.', 'Settings changed elsewhere. Reload, then save.')
                : Object.values(failure.response?.data?.errors || {}).flat().join(' ') || failure.response?.data?.message || failure.message;
            setError(message);
        } finally { setSaving(false); }
    };
    return <section className="ws-payment-deposit" aria-labelledby="ws-payment-deposit-title">
        <h2 id="ws-payment-deposit-title">{text('العربون', 'Deposit')}</h2>
        <p>{text('اطلب دفع جزء من الطلب الآن بإحدى طرق الدفع الإلكترونية أو بالتحويل، ويُدفع الباقي عند الاستلام. لا تُتاح طريقة الدفع عند الاستلام للطلبات التي تحتاج عربونًا.', 'Ask customers to pay part of the order now with an online method or a transfer; the rest is paid on delivery. Cash on delivery is not offered for orders that need a deposit.')}</p>
        {error ? <p role="alert" className="ws-payments-error">{error}{!draft ? <button type="button" onClick={() => setAttempt((n) => n + 1)}>{text('إعادة المحاولة', 'Retry')}</button> : null}</p> : null}
        {!draft ? (!error ? <p role="status">{text('جارٍ تحميل إعدادات العربون…', 'Loading deposit settings…')}</p> : null) : <form onSubmit={save} className="ws-payment-deposit-form">
            <Toggle label={text('طلب عربون', 'Require a deposit')} checked={Boolean(draft.enabled)} disabled={saving} onChange={(enabled) => patch({ enabled })} />
            <div className="ws-payment-deposit-grid">
                <FormField label={text('نسبة العربون من الطلب (%)', 'Deposit percentage of the order (%)')} htmlFor="deposit-percentage">
                    <input id="deposit-percentage" className={INPUT_CLASS} type="number" min="0" max="100" step="0.01" dir="ltr" value={draft.percentage} disabled={saving} onChange={(event) => patch({ percentage: event.target.value })} aria-describedby="deposit-percentage-hint" />
                    <small id="deposit-percentage-hint" className="ws-payment-deposit-hint">{text('من المبلغ الذي يدفعه العميل بعد بطاقات الهدايا.', 'Of what the customer pays after gift cards.')}</small>
                </FormField>
                <FormField label={`${text('حد أدنى ثابت', 'Fixed minimum')} (${currency || ''})`} htmlFor="deposit-minimum">
                    <input id="deposit-minimum" className={INPUT_CLASS} type="number" min="0" step="0.01" dir="ltr" value={draft.minimum} disabled={saving} onChange={(event) => patch({ minimum: event.target.value })} aria-describedby="deposit-minimum-hint" />
                    <small id="deposit-minimum-hint" className="ws-payment-deposit-hint">{text('اختياري. لا يتجاوز العربون إجمالي الطلب.', 'Optional. The deposit never exceeds the order total.')}</small>
                </FormField>
            </div>
            <fieldset className="ws-payment-deposit-scope"><legend>{text('الطلبات التي تحتاج عربونًا', 'Orders that need a deposit')}</legend>
                <label><input type="radio" name="deposit-scope" value="all" checked={draft.scope === 'all'} disabled={saving} onChange={() => patch({ scope: 'all' })} />{text('كل الطلبات التي تُشحن', 'Every delivered order')}</label>
                <label><input type="radio" name="deposit-scope" value="flagged" checked={draft.scope === 'flagged'} disabled={saving} onChange={() => patch({ scope: 'flagged' })} />{text('الطلبات التي تحتوي منتجًا مُعلّمًا بـ«يتطلب عربونًا» (مثل المنتجات المخصصة)', 'Orders with a product marked “Requires a deposit” (e.g. custom products)')}</label>
            </fieldset>
            <Toggle label={text('لا يُؤكَّد الطلب حتى يُدفع العربون', 'Do not confirm the order until the deposit is paid')} checked={Boolean(draft.confirm_after_payment)} disabled={saving} onChange={(confirm_after_payment) => patch({ confirm_after_payment })} />
            <div className="ws-payment-deposit-actions"><button type="submit" disabled={saving}>{saving ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ إعدادات العربون', 'Save deposit settings')}</button></div>
        </form>}
    </section>;
}
