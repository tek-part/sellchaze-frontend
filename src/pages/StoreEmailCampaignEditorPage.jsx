import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import toast from 'react-hot-toast';
import useStoreScope from '../hooks/useStoreScope';
import api from '../api/client';
import '../components/data-table/data-table.css';
import { AudiencePicker, BlockList, CARD, FIELD, FieldError, LABEL } from '../components/store/EmailCampaignComposer';
import { HiOutlineComputerDesktop, HiOutlineDevicePhoneMobile, HiOutlinePaperAirplane } from '../components/workspace/WorkspaceIcons';
import {
    audiencePayload, campaignForm, campaignPayload, campaignStatusLabel, campaignStatusTone, emptyCampaignForm, sendBlockers,
} from '../features/store/emailCampaigns';

const BUTTON = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50';
const PRIMARY = `${BUTTON} bg-slate-900 text-white hover:bg-slate-800`;
const SECONDARY = `${BUTTON} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`;
const errorsOf = (error) => error?.response?.data?.errors ?? {};
const messageOf = (error) => error?.response?.data?.message || error?.message || '';

function useDebouncedValue(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]);
    return debounced;
}

/** Block-based composer for one campaign: settings, audience with a live count, content, live preview, test and schedule. */
export default function StoreEmailCampaignEditorPage() {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const { apiBase, uiBase } = useStoreScope();
    const { store } = useOutletContext() ?? {};
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar'); const text = (a, e) => (ar ? a : e);
    const storeLocale = store?.default_locale === 'ar' ? 'ar' : 'en';
    const [campaign, setCampaign] = useState(null);
    const [form, setForm] = useState(() => emptyCampaignForm(storeLocale));
    const [options, setOptions] = useState({ coupons: [], tags: [], defaults: {} });
    const [loadError, setLoadError] = useState('');
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [count, setCount] = useState(null);
    const [counting, setCounting] = useState(false);
    const [preview, setPreview] = useState({ html: '', error: '' });
    const [device, setDevice] = useState('desktop');
    const [testOpen, setTestOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const isNew = !campaignId;
    const editable = isNew || campaign?.status === 'draft';
    const base = isNew ? `${apiBase}/email-campaigns` : `${apiBase}/email-campaigns/${campaignId}`;

    useEffect(() => {
        api.get(`${apiBase}/email-campaigns/options`).then(({ data }) => setOptions(data.data ?? { coupons: [], tags: [], defaults: {} })).catch(() => {});
    }, [apiBase]);
    useEffect(() => {
        if (isNew) return;
        setLoadError('');
        api.get(`${apiBase}/email-campaigns/${campaignId}`)
            .then(({ data }) => { setCampaign(data.data); setForm(campaignForm(data.data, storeLocale)); setDirty(false); })
            .catch((error) => setLoadError(messageOf(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, campaignId]);

    const set = (patch) => { setForm((current) => ({ ...current, ...patch })); setDirty(true); };

    // Live recipient count for the audience being edited.
    const audienceKey = JSON.stringify(audiencePayload(form.audience));
    const debouncedAudience = useDebouncedValue(audienceKey, 400);
    useEffect(() => {
        let active = true; setCounting(true);
        api.post(`${base}/audience-count`, { audience: JSON.parse(debouncedAudience) })
            .then(({ data }) => { if (active) setCount(data.data?.count ?? 0); })
            .catch(() => { if (active) setCount(null); })
            .finally(() => { if (active) setCounting(false); });
        return () => { active = false; };
    }, [base, debouncedAudience]);

    // Live preview of the unsaved content, rendered by the server in the real e-mail layout.
    const previewKey = JSON.stringify((({ subject, preheader, locale, from_name, content }) => ({ subject, preheader, locale, from_name, content }))(campaignPayload(form)));
    const debouncedPreview = useDebouncedValue(previewKey, 600);
    useEffect(() => {
        let active = true;
        api.post(`${base}/preview`, JSON.parse(debouncedPreview))
            .then(({ data }) => { if (active) setPreview({ html: data.data?.html ?? '', error: '' }); })
            .catch((error) => { if (active) setPreview((current) => ({ ...current, error: Object.values(errorsOf(error)).flat()[0] || messageOf(error) })); });
        return () => { active = false; };
    }, [base, debouncedPreview]);

    const save = useCallback(async ({ quiet = false } = {}) => {
        setSaving(true); setErrors({}); setMessage('');
        try {
            const body = campaignPayload(form);
            const { data } = isNew ? await api.post(`${apiBase}/email-campaigns`, body) : await api.put(`${apiBase}/email-campaigns/${campaignId}`, body);
            setCampaign(data.data); setDirty(false);
            if (!quiet) toast.success(text('تم حفظ المسودة', 'Draft saved'));
            if (isNew) navigate(`${uiBase}/email-campaigns/${data.data.id}`, { replace: true });
            return data.data;
        } catch (error) {
            setErrors(errorsOf(error)); setMessage(messageOf(error));
            return null;
        } finally { setSaving(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, isNew, apiBase, campaignId, uiBase, ar]);

    const blockers = sendBlockers(form, ar);
    const err = (key) => errors[key]?.[0];
    const fieldProps = (key) => ({ id: `campaign-${key}`, className: FIELD, value: form[key] ?? '', onChange: (event) => set({ [key]: event.target.value }),
        'aria-invalid': err(key) ? true : undefined, 'aria-describedby': err(key) ? `campaign-${key}-error` : undefined, disabled: !editable });

    if (loadError) return <section className="ws-catalog-page"><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{loadError}</p></section>;
    if (!isNew && !campaign) return <section className="ws-catalog-page" aria-busy="true"><p className="text-sm text-slate-500">{text('جارٍ التحميل…', 'Loading…')}</p></section>;

    return (
        <section className="ws-catalog-page">
            <header className="ws-catalog-heading">
                <div className="min-w-0">
                    <p><Link to={`${uiBase}/email-campaigns`} className="text-sm text-slate-600 hover:underline">← {text('حملات البريد', 'Email campaigns')}</Link></p>
                    <h1 className="break-words">{isNew ? text('حملة جديدة', 'New campaign') : form.name || campaign?.name}</h1>
                    {campaign ? <p><span className={`ws-dt-badge ${campaignStatusTone(campaign.status)}`}>{campaignStatusLabel(campaign.status, ar)}</span></p> : null}
                </div>
                <div className="ws-catalog-actions flex-wrap">
                    {campaign && campaign.status !== 'draft' ? <Link to={`${uiBase}/email-campaigns/${campaign.id}/report`} className={SECONDARY}>{text('التقرير', 'Report')}</Link> : null}
                    {editable ? <>
                        <button type="button" className={SECONDARY} disabled={saving} onClick={() => void save()}>{saving ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ المسودة', 'Save draft')}</button>
                        <button type="button" className={SECONDARY} disabled={saving || isNew || blockers.length > 0} onClick={() => setTestOpen(true)}
                            title={isNew ? text('احفظ المسودة أولًا', 'Save the draft first') : undefined}>{text('إرسال تجريبي', 'Send test')}</button>
                        <button type="button" className={PRIMARY} disabled={saving || isNew || blockers.length > 0} title={isNew ? text('احفظ المسودة أولًا', 'Save the draft first') : undefined}
                            onClick={async () => { if (dirty) { const saved = await save({ quiet: true }); if (!saved) return; } setScheduleOpen(true); }}>
                            <HiOutlinePaperAirplane aria-hidden />{text('إرسال أو جدولة', 'Send or schedule')}</button>
                    </> : null}
                </div>
            </header>

            {message ? <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{message}</p> : null}
            {!editable ? <ReadOnlyNotice campaign={campaign} ar={ar} apiBase={apiBase} onChange={setCampaign} /> : null}
            {editable && blockers.length ? <ul className="mb-4 list-inside list-disc rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{blockers.map((line) => <li key={line}>{line}</li>)}</ul> : null}

            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
                <div className="min-w-0 space-y-4">
                    <section className={CARD} aria-labelledby="campaign-settings-heading">
                        <h2 id="campaign-settings-heading" className="text-base font-semibold text-slate-900">{text('تفاصيل الرسالة', 'Email details')}</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="min-w-0 sm:col-span-2">
                                <label className={LABEL} htmlFor="campaign-name">{text('اسم الحملة (داخلي)', 'Campaign name (internal)')}</label>
                                <input {...fieldProps('name')} maxLength={120} required />
                                <FieldError id="campaign-name-error" message={err('name')} />
                            </div>
                            <div className="min-w-0 sm:col-span-2">
                                <label className={LABEL} htmlFor="campaign-subject">{text('سطر الموضوع', 'Subject line')}</label>
                                <input {...fieldProps('subject')} maxLength={200} />
                                <FieldError id="campaign-subject-error" message={err('subject')} />
                            </div>
                            <div className="min-w-0 sm:col-span-2">
                                <label className={LABEL} htmlFor="campaign-preheader">{text('نص المعاينة (يظهر بعد الموضوع)', 'Preview text (shown after the subject)')}</label>
                                <input {...fieldProps('preheader')} maxLength={200} />
                                <FieldError id="campaign-preheader-error" message={err('preheader')} />
                            </div>
                            <div className="min-w-0">
                                <label className={LABEL} htmlFor="campaign-from_name">{text('اسم المرسل', 'Sender name')}</label>
                                <input {...fieldProps('from_name')} maxLength={100} placeholder={options.defaults?.from_name || store?.name || ''} />
                                <FieldError id="campaign-from_name-error" message={err('from_name')} />
                            </div>
                            <div className="min-w-0">
                                <label className={LABEL} htmlFor="campaign-reply_to">{text('عنوان الرد', 'Reply-to email')}</label>
                                <input {...fieldProps('reply_to')} type="email" dir="ltr" maxLength={255} placeholder={options.defaults?.reply_to || ''} />
                                <FieldError id="campaign-reply_to-error" message={err('reply_to')} />
                            </div>
                            <div className="min-w-0">
                                <label className={LABEL} htmlFor="campaign-locale">{text('لغة الرسالة', 'Email language')}</label>
                                <select id="campaign-locale" className={FIELD} value={form.locale} disabled={!editable} onChange={(event) => set({ locale: event.target.value })}>
                                    <option value="ar">العربية</option><option value="en">English</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className={CARD} aria-labelledby="campaign-audience-heading">
                        <h2 id="campaign-audience-heading" className="text-base font-semibold text-slate-900">{text('الجمهور', 'Audience')}</h2>
                        <fieldset disabled={!editable} className="min-w-0">
                            <AudiencePicker audience={form.audience} onChange={(audience) => set({ audience })} tags={options.tags ?? []} count={count} counting={counting} ar={ar} errors={errors} />
                        </fieldset>
                    </section>

                    <section className={CARD} aria-labelledby="campaign-content-heading">
                        <h2 id="campaign-content-heading" className="text-base font-semibold text-slate-900">{text('المحتوى', 'Content')}</h2>
                        <fieldset disabled={!editable} className="min-w-0">
                            <BlockList blocks={form.content} onChange={(content) => set({ content })} errors={errors} ar={ar} apiBase={apiBase} coupons={options.coupons ?? []} />
                        </fieldset>
                    </section>
                </div>

                <section className={`${CARD} lg:sticky lg:top-4`} aria-labelledby="campaign-preview-heading">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 id="campaign-preview-heading" className="text-base font-semibold text-slate-900">{text('معاينة', 'Preview')}</h2>
                        <div className="inline-flex rounded-xl border border-slate-200 p-0.5" role="group" aria-label={text('حجم المعاينة', 'Preview size')}>
                            {[['desktop', text('سطح المكتب', 'Desktop'), HiOutlineComputerDesktop], ['phone', text('الهاتف', 'Phone'), HiOutlineDevicePhoneMobile]].map(([key, label, Icon]) => <button key={key} type="button" aria-pressed={device === key} onClick={() => setDevice(key)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 aria-pressed:bg-slate-900 aria-pressed:text-white"><Icon aria-hidden />{label}</button>)}
                        </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="truncate font-semibold text-slate-900">{form.from_name || options.defaults?.from_name || store?.name}</p>
                        <p className="truncate text-slate-800">{form.subject || text('(بدون موضوع)', '(no subject)')}</p>
                        <p className="truncate text-xs text-slate-500">{form.preheader}</p>
                    </div>
                    {preview.error ? <p className="text-xs text-amber-700" role="status">{preview.error}</p> : null}
                    <div className="flex justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100" data-preview-device={device}>
                        <iframe title={text('معاينة الرسالة', 'Email preview')} sandbox="" srcDoc={preview.html} className="block h-[640px] border-0 bg-white"
                            style={{ width: device === 'phone' ? 375 : '100%', maxWidth: '100%' }} />
                    </div>
                </section>
            </div>

            <TestDialog open={testOpen} onClose={() => setTestOpen(false)} ar={ar} apiBase={apiBase} campaignId={campaign?.id} beforeSend={dirty ? () => save({ quiet: true }) : null} />
            <ScheduleDialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} ar={ar} apiBase={apiBase} campaignId={campaign?.id}
                onScheduled={(updated) => navigate(`${uiBase}/email-campaigns/${updated.id}/report`)} />
        </section>
    );
}

function ReadOnlyNotice({ campaign, ar, apiBase, onChange }) {
    const text = (a, e) => (ar ? a : e);
    const [busy, setBusy] = useState(false);
    const cancellable = ['scheduled', 'sending'].includes(campaign.status);
    const cancel = async () => {
        setBusy(true);
        try { const { data } = await api.post(`${apiBase}/email-campaigns/${campaign.id}/cancel`); onChange(data.data); toast.success(text('تم إلغاء الحملة', 'Campaign cancelled')); } catch (error) { toast.error(messageOf(error)); } finally { setBusy(false); }
    };
    return <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" role="status">
        <p>{campaign.status === 'scheduled' ? text(`مجدولة للإرسال في ${new Date(campaign.scheduled_at).toLocaleString('ar-EG')}. ألغِ الجدولة لتعديلها.`, `Scheduled for ${new Date(campaign.scheduled_at).toLocaleString('en')}. Cancel it to make changes.`)
            : text('لا يمكن تعديل حملة بعد جدولتها أو إرسالها.', 'A campaign cannot be edited once it is scheduled or sent.')}</p>
        {cancellable ? <button type="button" className={SECONDARY} disabled={busy} onClick={() => void cancel()}>{text('إلغاء الحملة', 'Cancel campaign')}</button> : null}
    </div>;
}

function TestDialog({ open, onClose, ar, apiBase, campaignId, beforeSend }) {
    const text = (a, e) => (ar ? a : e);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const [sentTo, setSentTo] = useState('');
    useEffect(() => { if (!open) { setError(''); setSentTo(''); } }, [open]);
    const submit = async (event) => {
        event.preventDefault();
        setSending(true); setError('');
        try {
            if (beforeSend && !(await beforeSend())) { setError(text('تعذر حفظ التغييرات قبل الإرسال.', 'Could not save your changes before sending.')); return; }
            const { data } = await api.post(`${apiBase}/email-campaigns/${campaignId}/test`, { email: email.trim() });
            setSentTo(data.data?.email ?? email.trim());
        } catch (e) {
            setError(errorsOf(e).email?.[0] || messageOf(e));
        } finally { setSending(false); }
    };
    return <Dialog open={open} onClose={sending ? () => {} : onClose} className="relative z-100">
        <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
        <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
                    <DialogTitle className="text-lg font-bold text-slate-900">{text('إرسال رسالة تجريبية', 'Send a test email')}</DialogTitle>
                    <p className="text-sm text-slate-600">{text('تُرسل نسخة واحدة إلى العنوان الذي تكتبه فقط، بموضوع يبدأ بـ [TEST].', 'One copy goes only to the address you type, with a subject starting with [TEST].')}</p>
                    <div>
                        <label className={LABEL} htmlFor="test-email">{text('البريد الإلكتروني', 'Email address')}</label>
                        <input id="test-email" type="email" dir="ltr" required className={FIELD} value={email} onChange={(event) => setEmail(event.target.value)}
                            aria-invalid={error ? true : undefined} aria-describedby={error ? 'test-email-error' : undefined} />
                        <FieldError id="test-email-error" message={error} />
                    </div>
                    {sentTo ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">{text(`تمت جدولة الرسالة التجريبية إلى ${sentTo}.`, `Test email queued to ${sentTo}.`)}</p> : null}
                    <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" className={SECONDARY} onClick={onClose} disabled={sending}>{text('إغلاق', 'Close')}</button>
                        <button type="submit" className={PRIMARY} disabled={sending || !email.trim()}>{sending ? text('جارٍ الإرسال…', 'Sending…') : text('إرسال التجربة', 'Send test')}</button>
                    </div>
                </form>
            </DialogPanel>
        </div></div>
    </Dialog>;
}

function ScheduleDialog({ open, onClose, ar, apiBase, campaignId, onScheduled }) {
    const text = (a, e) => (ar ? a : e);
    const [mode, setMode] = useState('now');
    const [at, setAt] = useState('');
    const [count, setCount] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const requested = useRef(0);
    useEffect(() => {
        if (!open || !campaignId) return;
        setError(''); setCount(null);
        const ticket = ++requested.current;
        api.post(`${apiBase}/email-campaigns/${campaignId}/audience-count`).then(({ data }) => { if (ticket === requested.current) setCount(data.data?.count ?? 0); })
            .catch((e) => setError(messageOf(e)));
    }, [open, campaignId, apiBase]);
    const formatted = useMemo(() => (count === null ? '…' : new Intl.NumberFormat(ar ? 'ar-EG' : 'en').format(count)), [count, ar]);
    const confirm = async () => {
        setBusy(true); setError('');
        try {
            const scheduledAt = mode === 'now' ? null : new Date(at).toISOString();
            const { data } = await api.post(`${apiBase}/email-campaigns/${campaignId}/schedule`, { scheduled_at: scheduledAt });
            toast.success(mode === 'now' ? text('بدأ إرسال الحملة', 'Campaign is sending') : text('تمت جدولة الحملة', 'Campaign scheduled'));
            onScheduled(data.data);
        } catch (e) {
            setError(Object.values(errorsOf(e)).flat().join(' ') || messageOf(e));
        } finally { setBusy(false); }
    };
    const laterInvalid = mode === 'later' && (!at || Number.isNaN(new Date(at).getTime()) || new Date(at).getTime() < Date.now());
    return <Dialog open={open} onClose={busy ? () => {} : onClose} className="relative z-100">
        <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
        <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                <DialogTitle className="text-lg font-bold text-slate-900">{text('إرسال الحملة', 'Send campaign')}</DialogTitle>
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800" data-confirm-count={count ?? ''}>
                    {text(`سيتم الإرسال إلى ${formatted} مشترك في النشرة البريدية.`, `This campaign will be sent to ${formatted} newsletter ${count === 1 ? 'subscriber' : 'subscribers'}.`)}
                </p>
                <fieldset className="space-y-2">
                    <legend className="sr-only">{text('وقت الإرسال', 'When to send')}</legend>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="send-mode" checked={mode === 'now'} onChange={() => setMode('now')} />{text('أرسل الآن', 'Send now')}</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="send-mode" checked={mode === 'later'} onChange={() => setMode('later')} />{text('جدولة لوقت لاحق', 'Schedule for later')}</label>
                    {mode === 'later' ? <div>
                        <label className={LABEL} htmlFor="schedule-at">{text('تاريخ ووقت الإرسال', 'Send date and time')}</label>
                        <input id="schedule-at" type="datetime-local" dir="ltr" className={FIELD} value={at} onChange={(event) => setAt(event.target.value)} />
                    </div> : null}
                </fieldset>
                {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
                <p className="text-xs text-slate-500">{text('تُرسل الرسائل على دفعات بمعدل محدود في الدقيقة، ولا يمكن التراجع عن الرسائل التي أُرسلت.', 'Emails go out in rate-limited batches. Messages already sent cannot be recalled.')}</p>
                <div className="flex flex-wrap justify-end gap-2">
                    <button type="button" className={SECONDARY} onClick={onClose} disabled={busy}>{text('رجوع', 'Back')}</button>
                    <button type="button" className={PRIMARY} disabled={busy || !count || laterInvalid} onClick={() => void confirm()}>
                        {mode === 'now' ? text(`أرسل الآن إلى ${formatted}`, `Send now to ${formatted}`) : text(`جدولة لـ ${formatted}`, `Schedule for ${formatted}`)}
                    </button>
                </div>
            </DialogPanel>
        </div></div>
    </Dialog>;
}
