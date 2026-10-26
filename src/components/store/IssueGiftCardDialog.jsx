import { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import api from '../../api/client';
import { HiOutlineClipboardDocument, HiOutlineExclamationTriangle } from '../workspace/WorkspaceIcons';
import { emptyGiftCardForm, giftCardIssuePayload } from '../../features/store/giftCards';

const FIELD = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-red-400';
const LABEL = 'mb-1 block text-sm font-medium text-slate-700';

/**
 * Issue a gift card. The response is the only place the full code ever appears, so it is shown
 * once with a copy button and a clear warning, and dropped from memory when the dialog closes.
 */
export default function IssueGiftCardDialog({ open, onClose, onIssued, apiBase, currency, ar }) {
    const text = (a, e) => (ar ? a : e);
    const [form, setForm] = useState(emptyGiftCardForm);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [issued, setIssued] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!open) { setForm(emptyGiftCardForm()); setErrors({}); setMessage(''); setIssued(null); setCopied(false); }
    }, [open]);

    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const field = (key, id) => ({ id, name: key, className: FIELD, 'aria-invalid': errors[key] ? true : undefined, 'aria-describedby': errors[key] ? `${id}-error` : undefined });
    const error = (key, id) => (errors[key] ? <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600">{errors[key][0]}</p> : null);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true); setErrors({}); setMessage('');
        try {
            const { data } = await api.post(`${apiBase}/gift-cards`, giftCardIssuePayload(form));
            setIssued({ code: data.code, card: data.data });
            onIssued?.(data.data);
        } catch (e) {
            setErrors(e.response?.data?.errors ?? {});
            setMessage(e.response?.data?.message || e.message);
        } finally {
            setSaving(false);
        }
    };

    const copy = async () => {
        try { await navigator.clipboard.writeText(issued.code); setCopied(true); } catch { setCopied(false); }
    };

    return (
        <Dialog open={open} onClose={saving ? () => {} : onClose} className="relative z-100">
            <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        {issued ? <div className="space-y-4" data-gift-card-issued>
                            <DialogTitle className="text-lg font-bold text-slate-900">{text('تم إصدار بطاقة الهدية', 'Gift card issued')}</DialogTitle>
                            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                                <HiOutlineExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                                <p><strong>{text('احفظ الكود الآن.', 'Save this code now.')}</strong> {text('لن يظهر مرة أخرى، ولا يمكن استرجاعه لاحقًا. يظهر بعد ذلك آخر 4 أحرف فقط.', 'It will not be shown again and cannot be recovered later. Only its last 4 characters are shown after this.')}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <output className="min-w-0 flex-1 break-all rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center font-mono text-lg font-semibold tracking-wider text-slate-900" dir="ltr" aria-label={text('كود بطاقة الهدية', 'Gift card code')} data-gift-card-code>{issued.code}</output>
                                <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    <HiOutlineClipboardDocument className="h-4 w-4" aria-hidden />{copied ? text('تم النسخ', 'Copied') : text('نسخ الكود', 'Copy code')}
                                </button>
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={onClose} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">{text('تم، حفظت الكود', 'Done, I saved it')}</button>
                            </div>
                        </div> : <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
                            <DialogTitle className="text-lg font-bold text-slate-900">{text('إصدار بطاقة هدية', 'Issue gift card')}</DialogTitle>
                            {message ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{message}</p> : null}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="min-w-0">
                                    <label className={LABEL} htmlFor="gift-card-value">{text('القيمة', 'Value')} ({currency})</label>
                                    <input {...field('initial_value', 'gift-card-value')} required type="number" inputMode="decimal" step="0.01" min="0.01" value={form.initial_value} onChange={(e) => set('initial_value', e.target.value)} />
                                    {error('initial_value', 'gift-card-value')}
                                </div>
                                <div className="min-w-0">
                                    <label className={LABEL} htmlFor="gift-card-expires">{text('تاريخ الانتهاء (اختياري)', 'Expiry date (optional)')}</label>
                                    <input {...field('expires_at', 'gift-card-expires')} type="date" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} />
                                    {error('expires_at', 'gift-card-expires')}
                                </div>
                                <div className="min-w-0">
                                    <label className={LABEL} htmlFor="gift-card-customer">{text('اسم العميل (اختياري)', 'Customer name (optional)')}</label>
                                    <input {...field('customer_name', 'gift-card-customer')} value={form.customer_name} maxLength={120} onChange={(e) => set('customer_name', e.target.value)} />
                                    {error('customer_name', 'gift-card-customer')}
                                </div>
                                <div className="min-w-0">
                                    <label className={LABEL} htmlFor="gift-card-email">{text('البريد الإلكتروني (اختياري)', 'Email (optional)')}</label>
                                    <input {...field('customer_email', 'gift-card-email')} type="email" dir="ltr" value={form.customer_email} maxLength={190} onChange={(e) => set('customer_email', e.target.value)} />
                                    {error('customer_email', 'gift-card-email')}
                                </div>
                                <div className="min-w-0">
                                    <label className={LABEL} htmlFor="gift-card-phone">{text('الهاتف (اختياري)', 'Phone (optional)')}</label>
                                    <input {...field('customer_phone', 'gift-card-phone')} type="tel" dir="ltr" value={form.customer_phone} maxLength={40} onChange={(e) => set('customer_phone', e.target.value)} />
                                    {error('customer_phone', 'gift-card-phone')}
                                </div>
                                <div className="min-w-0 sm:col-span-2">
                                    <label className={LABEL} htmlFor="gift-card-note">{text('ملاحظة داخلية (اختياري)', 'Internal note (optional)')}</label>
                                    <textarea {...field('note', 'gift-card-note')} rows={2} value={form.note} maxLength={1000} onChange={(e) => set('note', e.target.value)} />
                                    {error('note', 'gift-card-note')}
                                </div>
                            </div>
                            <p className="text-xs text-slate-600">{text('لا تُرسل أي رسالة للعميل. سيظهر الكود مرة واحدة بعد الإصدار لتسلّمه بنفسك.', 'No message is sent to the customer. The code is shown once after issuing so you can hand it over yourself.')}</p>
                            <div className="flex flex-wrap justify-end gap-2">
                                <button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">{text('إلغاء', 'Cancel')}</button>
                                <button type="submit" disabled={saving || !form.initial_value.trim()} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? '…' : text('إصدار البطاقة', 'Issue card')}</button>
                            </div>
                        </form>}
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
