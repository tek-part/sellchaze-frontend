import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import useStoreContext from '../../../hooks/useStoreContext';
import { useDirty } from '../../../hooks/useStoreSettings';
import {
    DEFAULT_VARIABLES, LIMITS, eventChanged, eventTemplate, groupCatalog, insertVariable, isEmail, isInternationalPhone,
    issuesFor, normalizePhone, normalizeRecipients, pickLocalized, validateSettings,
} from '../../../features/store/notifications';

const button = 'rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40';
const primary = `${button} border-emerald-600 bg-emerald-600 text-white`;
const input = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm aria-[invalid=true]:border-red-400';
const card = 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5';
const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const groupLabels = { orders: ['الطلبات', 'Orders'], shipping: ['الشحن', 'Shipping'], staff: ['إشعارات الموظفين', 'Staff'] };
const fieldLabels = { email_subject: ['موضوع البريد', 'Email subject'], email_body: ['نص البريد', 'Email body'], whatsapp_body: ['رسالة واتساب', 'WhatsApp message'], sender_name: ['اسم الراسل', 'Sender name'], reply_to: ['عنوان الرد', 'Reply-to email'], staff_recipients: ['مستلمو إشعارات الموظفين', 'Staff recipients'] };
const fieldLimits = { email_subject: LIMITS.subject, email_body: LIMITS.emailBody, whatsapp_body: LIMITS.whatsappBody };
const emptyEvent = { email_enabled: false, email_subject: '', email_body: '' };

/** Laravel 422 bag with the `settings.` envelope stripped so keys line up with client field names. */
const serverErrors = (error) => error.response?.status === 422
    ? Object.fromEntries(Object.entries(error.response.data?.errors ?? {}).map(([key, messages]) => [key.replace(/^settings\./, ''), [].concat(messages)]))
    : {};
const serverFor = (errors, prefix) => Object.entries(errors).filter(([key]) => key === prefix || key.startsWith(`${prefix}.`)).flatMap(([, messages]) => messages);

function requestError(error, text) {
    if (error.response?.status === 429) {
        const wait = Number(error.response.headers?.['retry-after']);
        return wait > 0
            ? text(`أرسلت رسائل تجريبية كثيرة. حاول مرة أخرى بعد ${wait} ثانية.`, `Too many test messages. Try again in ${wait} seconds.`)
            : text('أرسلت رسائل تجريبية كثيرة. انتظر دقيقة ثم حاول مرة أخرى.', 'Too many test messages. Wait a minute and try again.');
    }
    return errorText(error);
}

function issueMessage(issue, text) {
    switch (issue.code) {
        case 'required': return text('مطلوب ما دامت القناة مفعلة.', 'Required while this channel is on.');
        case 'too_long': return text(`الحد الأقصى ${issue.max} حرف.`, `Maximum ${issue.max} characters.`);
        case 'unknown_variable': return text(`متغير غير معروف: ${issue.tokens.map((token) => `{${token}}`).join('، ')}`, `Unknown variable: ${issue.tokens.map((token) => `{${token}}`).join(', ')}`);
        case 'invalid_email': return text(`بريد إلكتروني غير صالح: ${issue.value || '—'}`, `Invalid email: ${issue.value || '—'}`);
        case 'too_many': return text(`يمكن إضافة ${issue.max} مستلمين كحد أقصى.`, `Up to ${issue.max} extra recipients.`);
        case 'duplicate': return text(`مكرر: ${issue.value}`, `Already listed: ${issue.value}`);
        default: return issue.code;
    }
}

function FieldMessages({ id, issues, server, text }) {
    const messages = [...issues.map((issue) => issueMessage(issue, text)), ...server];
    return messages.length ? <ul id={id} className="mt-1 space-y-0.5 text-xs text-red-700">{messages.map((message, index) => <li key={index}>{message}</li>)}</ul> : null;
}

function Counter({ value, max }) {
    const length = String(value ?? '').length;
    return <span className={`text-xs tabular-nums ${length > max ? 'text-red-700' : 'text-slate-400'}`}>{length}/{max}</span>;
}

export default function StoreNotificationsPage() {
    const context = useStoreContext();
    return <NotificationsEditor key={context.apiBase} context={context} />;
}

function NotificationsEditor({ context }) {
    const { apiBase, uiBase, access } = context;
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [meta, setMeta] = useState(null);
    const [settings, setSettings] = useState(null);
    const [initial, setInitial] = useState(null);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [editing, setEditing] = useState(null);
    const [recipient, setRecipient] = useState('');
    const [recipientError, setRecipientError] = useState('');
    const working = useRef(false);
    const dirty = useDirty(initial, settings);
    const apply = (data) => {
        setSettings(data.data); setInitial(data.data);
        setMeta({ catalog: data.catalog ?? [], variables: data.variables?.length ? data.variables : DEFAULT_VARIABLES, connection: data.connection ?? {}, ownerEmail: data.owner_email ?? '' });
    };
    useEffect(() => {
        let active = true;
        if (!access?.canStoreSettings) return undefined;
        api.get(`${apiBase}/notifications`).then(({ data }) => { if (active) apply(data); }).catch((e) => { if (active) setError(errorText(e)); });
        return () => { active = false; };
    }, [apiBase, access?.canStoreSettings, attempt]);
    useEffect(() => {
        if (!dirty) return undefined;
        const guard = (event) => { event.preventDefault(); event.returnValue = ''; };
        window.addEventListener('beforeunload', guard);
        return () => window.removeEventListener('beforeunload', guard);
    }, [dirty]);
    const issues = useMemo(() => settings && meta ? validateSettings(settings, meta.catalog, meta.variables, meta.ownerEmail) : [], [settings, meta]);
    const groups = useMemo(() => groupCatalog(meta?.catalog ?? []), [meta]);
    if (!access?.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;

    const whatsappReady = Boolean(meta?.connection?.whatsapp_verified);
    const labelOf = (key) => pickLocalized(meta?.catalog.find((entry) => entry.key === key)?.label, ar, key);
    const describeField = (field) => {
        const [scope, key, name] = field.split('.');
        if (scope === 'events') return `${labelOf(key)} — ${(fieldLabels[name] ?? [name, name])[ar ? 0 : 1]}`;
        return (fieldLabels[scope] ?? [scope, scope])[ar ? 0 : 1];
    };
    const touch = () => { setSaved(false); setError(''); setSummary([]); setFieldErrors({}); };
    const update = (changes) => { setSettings((current) => ({ ...current, ...changes })); touch(); };
    const updateEvent = (key, changes) => { setSettings((current) => ({ ...current, events: { ...current.events, [key]: { ...(current.events?.[key] ?? emptyEvent), ...changes } } })); touch(); };

    async function save() {
        if (working.current) return;
        if (issues.length) {
            setSaved(false); setError(text('راجع الحقول التالية قبل الحفظ:', 'Fix these fields before saving:'));
            setSummary(issues.map((issue) => `${describeField(issue.field)}: ${issueMessage(issue, text)}`));
            return;
        }
        working.current = true; setBusy(true); touch();
        try {
            const { data } = await api.put(`${apiBase}/notifications`, { settings: { ...settings, staff_recipients: normalizeRecipients(settings.staff_recipients ?? []) } });
            apply(data); setSaved(true);
        } catch (e) {
            const bag = serverErrors(e);
            setFieldErrors(bag);
            setError(Object.keys(bag).length ? (e.response?.data?.message || text('تعذر حفظ الإعدادات.', 'Settings could not be saved.')) : errorText(e));
            setSummary(Object.entries(bag).flatMap(([field, messages]) => messages.map((message) => `${describeField(field)}: ${message}`)));
        } finally { working.current = false; setBusy(false); }
    }
    function addRecipient(event) {
        event.preventDefault();
        const email = recipient.trim().toLowerCase();
        const current = settings.staff_recipients ?? [];
        if (!isEmail(email)) return setRecipientError(issueMessage({ code: 'invalid_email', value: recipient }, text));
        if (current.length >= LIMITS.staffRecipients) return setRecipientError(issueMessage({ code: 'too_many', max: LIMITS.staffRecipients }, text));
        if (email === meta.ownerEmail.toLowerCase() || current.some((entry) => entry.toLowerCase() === email)) return setRecipientError(issueMessage({ code: 'duplicate', value: email }, text));
        update({ staff_recipients: [...current, email] }); setRecipient(''); setRecipientError('');
    }

    const entry = editing ? meta?.catalog.find((row) => row.key === editing) : null;
    return <div className="mx-auto max-w-6xl space-y-5 pb-24">
        <PageHeader title={text('الإشعارات', 'Notifications')} subtitle={text('تحكم في رسائل البريد وواتساب التي يتلقاها عملاؤك وفريقك عند كل مرحلة من الطلب.', 'Control the email and WhatsApp messages your customers and staff receive at each order stage.')} />
        {error ? <div role="alert" className="space-y-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"><p>{error}</p>
            {summary.length ? <ul className="list-disc space-y-1 ps-5">{summary.map((line, index) => <li key={index}>{line}</li>)}</ul> : null}
            {!settings ? <button type="button" className={button} onClick={() => { setError(''); setAttempt((n) => n + 1); }}>{text('إعادة المحاولة', 'Retry')}</button> : null}
        </div> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{text('تم حفظ إعدادات الإشعارات.', 'Notification settings saved.')}</p> : null}
        {!settings && !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {settings && meta && entry ? <TemplateEditor key={entry.key} entry={entry} value={settings.events?.[entry.key] ?? emptyEvent} saved={initial.events?.[entry.key]}
            meta={meta} apiBase={apiBase} text={text} ar={ar} issues={issues} fieldErrors={fieldErrors} busy={busy} whatsappReady={whatsappReady}
            onChange={(changes) => updateEvent(entry.key, changes)} onClose={() => setEditing(null)} /> : null}
        {settings && meta && !entry ? <>
            <section className={card} aria-labelledby="notifications-sender">
                <h2 id="notifications-sender" className="font-semibold">{text('المرسل', 'Sender')}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-sm"><span className="flex items-center justify-between gap-2">{text('اسم الراسل', 'Sender name')}<Counter value={settings.sender_name} max={LIMITS.senderName} /></span>
                        <input className={input} maxLength={LIMITS.senderName} value={settings.sender_name ?? ''} disabled={busy} aria-invalid={issuesFor(issues, 'sender_name').length > 0} aria-describedby="sender-name-errors" onChange={(event) => update({ sender_name: event.target.value })} />
                        <FieldMessages id="sender-name-errors" issues={issuesFor(issues, 'sender_name')} server={serverFor(fieldErrors, 'sender_name')} text={text} />
                    </label>
                    <label className="block text-sm">{text('عنوان الرد (اختياري)', 'Reply-to email (optional)')}
                        <input className={input} type="email" dir="ltr" autoComplete="email" value={settings.reply_to ?? ''} disabled={busy} placeholder={meta.ownerEmail} aria-invalid={issuesFor(issues, 'reply_to').length > 0} aria-describedby="reply-to-errors" onChange={(event) => update({ reply_to: event.target.value.trim() ? event.target.value : null })} />
                        <FieldMessages id="reply-to-errors" issues={issuesFor(issues, 'reply_to')} server={serverFor(fieldErrors, 'reply_to')} text={text} />
                    </label>
                </div>
                <p className="text-sm leading-6 text-slate-600">{text('تُرسل الرسائل من عنوان البريد المعتمد للمنصة باسم الراسل الذي تحدده، وتصل ردود العملاء إلى عنوان الرد أو إلى بريد مالك المتجر إن تركته فارغًا.', 'Emails are sent from the platform’s verified address using your sender name. Customer replies go to the reply-to address, or to the store owner’s email when it is empty.')}</p>
            </section>
            <WhatsAppCard connection={meta.connection} uiBase={uiBase} text={text} />
            {groups.map(({ group, entries }) => <section key={group} className={card} aria-labelledby={`notifications-group-${group}`}>
                <h2 id={`notifications-group-${group}`} className="font-semibold">{(groupLabels[group] ?? [group, group])[ar ? 0 : 1]}</h2>
                <ul className="divide-y divide-slate-100">{entries.map((row) => <EventRow key={row.key} entry={row} value={settings.events?.[row.key] ?? emptyEvent} ar={ar} text={text} busy={busy}
                    whatsappReady={whatsappReady} attention={issuesFor(issues, `events.${row.key}`).length > 0 || serverFor(fieldErrors, `events.${row.key}`).length > 0}
                    onToggle={(changes) => updateEvent(row.key, changes)} onEdit={() => setEditing(row.key)} />)}</ul>
                {group === 'staff' ? <div className="space-y-3 border-t border-slate-100 pt-4">
                    <h3 className="text-sm font-semibold">{text('مستلمو إشعارات الموظفين', 'Staff recipients')}</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex flex-wrap items-center gap-2"><bdi dir="ltr" className="break-all">{meta.ownerEmail || '—'}</bdi><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{text('مالك المتجر • يُضاف دائمًا', 'Store owner • always included')}</span></li>
                        {(settings.staff_recipients ?? []).map((email, index) => <li key={`${email}-${index}`} className="flex flex-wrap items-center gap-2">
                            <bdi dir="ltr" className="break-all">{email}</bdi>
                            <button type="button" className="text-xs font-semibold text-red-700 disabled:opacity-40" disabled={busy} aria-label={text(`إزالة ${email}`, `Remove ${email}`)} onClick={() => update({ staff_recipients: settings.staff_recipients.filter((_, position) => position !== index) })}>{text('إزالة', 'Remove')}</button>
                            <FieldMessages id={`staff-recipient-${index}-errors`} issues={issuesFor(issues, `staff_recipients.${index}`)} server={serverFor(fieldErrors, `staff_recipients.${index}`)} text={text} />
                        </li>)}
                    </ul>
                    <FieldMessages id="staff-recipients-errors" issues={issues.filter((issue) => issue.field === 'staff_recipients')} server={fieldErrors.staff_recipients ?? []} text={text} />
                    <form className="flex flex-wrap items-end gap-2" onSubmit={addRecipient} noValidate>
                        <label className="min-w-0 flex-1 text-sm">{text('إضافة بريد مستلم', 'Add recipient email')}
                            <input className={input} type="email" dir="ltr" value={recipient} disabled={busy || (settings.staff_recipients ?? []).length >= LIMITS.staffRecipients} aria-invalid={Boolean(recipientError)} aria-describedby="staff-recipient-add-error" onChange={(event) => { setRecipient(event.target.value); setRecipientError(''); }} />
                        </label>
                        <button className={button} disabled={busy || !recipient.trim() || (settings.staff_recipients ?? []).length >= LIMITS.staffRecipients}>{text('إضافة', 'Add')}</button>
                        <p className="w-full text-xs text-slate-500">{text(`حتى ${LIMITS.staffRecipients} عناوين إضافية بجانب بريد المالك.`, `Up to ${LIMITS.staffRecipients} addresses in addition to the owner.`)}</p>
                        {recipientError ? <p id="staff-recipient-add-error" className="w-full text-xs text-red-700">{recipientError}</p> : null}
                    </form>
                </div> : null}
            </section>)}
        </> : null}
        {settings ? <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
            <p className="text-sm text-slate-600" aria-live="polite">{dirty ? text('لديك تغييرات غير محفوظة.', 'You have unsaved changes.') : text('كل التغييرات محفوظة.', 'All changes saved.')}</p>
            <div className="flex flex-wrap gap-2">
                <button type="button" className={button} disabled={busy || !dirty} onClick={() => { setSettings(initial); touch(); }}>{text('تجاهل التغييرات', 'Discard')}</button>
                <button type="button" className={primary} disabled={busy || !dirty} onClick={save}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button>
            </div>
        </div> : null}
    </div>;
}

function WhatsAppCard({ connection, uiBase, text }) {
    const link = <Link className="font-semibold text-emerald-700 underline" to={`${uiBase}/settings/digital-delivery`}>{text('إعدادات اتصال واتساب', 'WhatsApp connection settings')}</Link>;
    const [tone, message] = connection?.whatsapp_verified
        ? ['border-emerald-200 bg-emerald-50', text('واتساب متصل ومتحقق منه. يمكنك تفعيل رسائل واتساب لكل إشعار.', 'WhatsApp is connected and verified. You can turn on WhatsApp for each notification.')]
        : connection?.whatsapp_connected
            ? ['border-amber-200 bg-amber-50', text('واتساب متصل لكن لم يتم التحقق منه بعد، لذلك رسائل واتساب متوقفة. تحقق من الاتصال من', 'WhatsApp is connected but not verified yet, so WhatsApp messages are off. Verify the connection in')]
            : ['border-slate-200 bg-slate-50', text('لم يتم ربط واتساب، لذلك رسائل واتساب متوقفة. اربط حساب Wawp من', 'WhatsApp is not connected, so WhatsApp messages are off. Connect your Wawp account in')];
    return <section className={`space-y-2 rounded-2xl border p-5 ${tone}`} aria-labelledby="notifications-whatsapp">
        <h2 id="notifications-whatsapp" className="font-semibold">{text('واتساب', 'WhatsApp')}</h2>
        <p role="status" className="text-sm leading-6">{message}{connection?.whatsapp_verified ? null : <> {link}.</>}</p>
        <p className="text-xs leading-5 text-slate-600">{text('تصل رسائل واتساب فقط للعملاء الذين أدخلوا رقمًا دوليًا صالحًا.', 'WhatsApp messages only reach customers who entered a valid international number.')}</p>
    </section>;
}

function EventRow({ entry, value, ar, text, busy, whatsappReady, attention, onToggle, onEdit }) {
    const label = pickLocalized(entry.label, ar, entry.key);
    const whatsapp = entry.channels.includes('whatsapp');
    return <li className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
        <div className="min-w-0 flex-1 basis-60">
            <h3 className="font-medium">{label}</h3>
            {entry.description ? <p className="text-sm text-slate-500">{pickLocalized(entry.description, ar)}</p> : null}
            {attention ? <p className="text-xs font-semibold text-red-700">{text('القالب يحتاج إلى مراجعة', 'Template needs attention')}</p> : null}
        </div>
        {entry.channels.includes('email') ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={Boolean(value.email_enabled)} aria-label={`${label} — ${text('البريد', 'Email')}`} onChange={(event) => onToggle({ email_enabled: event.target.checked })} />{text('البريد', 'Email')}</label> : null}
        {whatsapp ? <label className="flex items-center gap-2 text-sm" title={whatsappReady ? undefined : text('تحقق من اتصال واتساب أولًا', 'Verify the WhatsApp connection first')}>
            <input type="checkbox" disabled={busy || (!whatsappReady && !value.whatsapp_enabled)} checked={Boolean(value.whatsapp_enabled)} aria-label={`${label} — ${text('واتساب', 'WhatsApp')}`} onChange={(event) => onToggle({ whatsapp_enabled: event.target.checked })} />{text('واتساب', 'WhatsApp')}
        </label> : null}
        <button type="button" className={button} disabled={busy} aria-label={text(`تعديل ${label}`, `Edit ${label}`)} onClick={onEdit}>{text('تعديل', 'Edit')}</button>
    </li>;
}

function TemplateEditor({ entry, value, saved, meta, apiBase, text, ar, issues, fieldErrors, busy, whatsappReady, onChange, onClose }) {
    const label = pickLocalized(entry.label, ar, entry.key);
    const hasEmail = entry.channels.includes('email');
    const hasWhatsapp = entry.channels.includes('whatsapp') && value.whatsapp_body !== undefined;
    const refs = { email_subject: useRef(null), email_body: useRef(null), whatsapp_body: useRef(null) };
    const heading = useRef(null);
    const [target, setTarget] = useState(hasEmail ? 'email_body' : 'whatsapp_body');
    const [insertError, setInsertError] = useState('');
    const [emailPreview, setEmailPreview] = useState({ loading: false, data: null, error: '' });
    const [whatsappPreview, setWhatsappPreview] = useState({ loading: false, data: null, error: '' });
    const [channel, setChannel] = useState(hasEmail ? 'email' : 'whatsapp');
    const [testEmail, setTestEmail] = useState(meta.ownerEmail);
    const [testPhone, setTestPhone] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState({ ok: '', error: '' });
    const unsaved = eventChanged(saved, value);
    const prefix = `events.${entry.key}`;
    useEffect(() => { heading.current?.focus(); }, []);

    const subject = value.email_subject; const body = value.email_body; const whatsappBody = value.whatsapp_body;
    useEffect(() => {
        if (!hasEmail) return undefined;
        let active = true;
        setEmailPreview((current) => ({ ...current, loading: true }));
        const timer = setTimeout(() => {
            api.post(`${apiBase}/notifications/preview`, { event: entry.key, channel: 'email', template: { subject, body } })
                .then(({ data }) => { if (active) setEmailPreview({ loading: false, data, error: '' }); })
                .catch((e) => { if (active) setEmailPreview({ loading: false, data: null, error: errorText(e) }); });
        }, 400);
        return () => { active = false; clearTimeout(timer); };
    }, [apiBase, entry.key, hasEmail, subject, body]);
    useEffect(() => {
        if (!hasWhatsapp) return undefined;
        let active = true;
        setWhatsappPreview((current) => ({ ...current, loading: true }));
        const timer = setTimeout(() => {
            api.post(`${apiBase}/notifications/preview`, { event: entry.key, channel: 'whatsapp', template: { body: whatsappBody } })
                .then(({ data }) => { if (active) setWhatsappPreview({ loading: false, data, error: '' }); })
                .catch((e) => { if (active) setWhatsappPreview({ loading: false, data: null, error: errorText(e) }); });
        }, 400);
        return () => { active = false; clearTimeout(timer); };
    }, [apiBase, entry.key, hasWhatsapp, whatsappBody]);

    function insert(variable) {
        const element = refs[target].current;
        const result = insertVariable(value[target] ?? '', variable, element?.selectionStart, element?.selectionEnd, fieldLimits[target]);
        if (!result) return setInsertError(issueMessage({ code: 'too_long', max: fieldLimits[target] }, text));
        setInsertError('');
        onChange({ [target]: result.value });
        requestAnimationFrame(() => { element?.focus(); element?.setSelectionRange?.(result.caret, result.caret); });
    }
    async function sendTest() {
        if (testing) return;
        setTesting(true); setTestResult({ ok: '', error: '' });
        const recipient = channel === 'email' ? testEmail.trim() : normalizePhone(testPhone);
        try {
            await api.post(`${apiBase}/notifications/test`, { event: entry.key, channel, recipient });
            setTestResult({ ok: text(`أُرسلت رسالة تجريبية إلى ${recipient}.`, `Test message sent to ${recipient}.`), error: '' });
        } catch (e) { setTestResult({ ok: '', error: requestError(e, text) }); }
        finally { setTesting(false); }
    }

    const field = (name, rows) => {
        const fieldIssues = issuesFor(issues, `${prefix}.${name}`);
        const server = serverFor(fieldErrors, `${prefix}.${name}`);
        const props = {
            ref: refs[name], className: input, value: value[name] ?? '', disabled: busy, maxLength: fieldLimits[name], dir: 'auto',
            'aria-invalid': fieldIssues.length + server.length > 0, 'aria-describedby': `${entry.key}-${name}-errors`,
            onFocus: () => setTarget(name), onChange: (event) => onChange({ [name]: event.target.value }),
        };
        return <label className="block text-sm"><span className="flex items-center justify-between gap-2">{fieldLabels[name][ar ? 0 : 1]}<Counter value={value[name]} max={fieldLimits[name]} /></span>
            {rows ? <textarea {...props} rows={rows} /> : <input {...props} />}
            <FieldMessages id={`${entry.key}-${name}-errors`} issues={fieldIssues} server={server} text={text} />
        </label>;
    };
    const testValid = channel === 'email' ? isEmail(testEmail.trim()) : isInternationalPhone(testPhone);
    const testBlocked = unsaved || (channel === 'whatsapp' && !whatsappReady);

    return <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><button type="button" className="text-sm font-semibold text-emerald-700" onClick={onClose}>{ar ? '→' : '←'} {text('كل الإشعارات', 'All notifications')}</button>
                <h2 ref={heading} tabIndex={-1} className="mt-1 text-xl font-semibold outline-none">{label}</h2>
                {entry.description ? <p className="text-sm text-slate-500">{pickLocalized(entry.description, ar)}</p> : null}
            </div>
            <button type="button" className={button} disabled={busy || !unsaved} onClick={() => onChange(eventTemplate(saved))}>{text('استعادة آخر نسخة محفوظة', 'Restore last saved')}</button>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
            <section className={card} aria-label={text('القالب', 'Template')}>
                {hasEmail ? <>{field('email_subject')}{field('email_body', 10)}</> : null}
                {hasWhatsapp ? field('whatsapp_body', 6) : null}
                <div className="space-y-2">
                    <p className="text-sm font-semibold">{text('المتغيرات', 'Variables')} <span className="font-normal text-slate-500">— {text('تُدرج في', 'inserts into')} {fieldLabels[target][ar ? 0 : 1]}</span></p>
                    <div className="flex flex-wrap gap-2" dir="ltr">{meta.variables.map((variable) => <button key={variable} type="button" disabled={busy} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs disabled:opacity-40" onMouseDown={(event) => event.preventDefault()} onClick={() => insert(variable)}>{`{${variable}}`}</button>)}</div>
                    {insertError ? <p className="text-xs text-red-700">{insertError}</p> : null}
                    <p className="text-xs leading-5 text-slate-500">{text('القوالب نصية. تُستبدل المتغيرات ببيانات الطلب عند الإرسال، ولا يُسمح إلا بالمتغيرات المعروضة.', 'Templates are plain text. Variables are replaced with order data when sent; only the variables listed here are allowed.')}</p>
                </div>
            </section>
            <aside className="space-y-4" aria-label={text('المعاينة', 'Preview')}>
                {hasEmail ? <section className={card}>
                    <h3 className="flex items-center justify-between font-semibold">{text('معاينة البريد', 'Email preview')}{emailPreview.loading ? <span className="text-xs font-normal text-slate-500">{text('جارٍ التحديث…', 'Updating…')}</span> : null}</h3>
                    {emailPreview.error ? <p role="alert" className="text-sm text-red-700">{emailPreview.error}</p> : null}
                    {emailPreview.data ? <>
                        <p className="break-words text-sm"><span className="text-slate-500">{text('الموضوع:', 'Subject:')}</span> <bdi className="font-semibold">{emailPreview.data.subject}</bdi></p>
                        <iframe title={text('معاينة البريد', 'Email preview')} sandbox="" srcDoc={emailPreview.data.html} className="h-[28rem] w-full rounded-lg border border-slate-200 bg-white" />
                    </> : null}
                </section> : null}
                {hasWhatsapp ? <section className={card}>
                    <h3 className="flex items-center justify-between font-semibold">{text('معاينة واتساب', 'WhatsApp preview')}{whatsappPreview.loading ? <span className="text-xs font-normal text-slate-500">{text('جارٍ التحديث…', 'Updating…')}</span> : null}</h3>
                    {whatsappPreview.error ? <p role="alert" className="text-sm text-red-700">{whatsappPreview.error}</p> : null}
                    {whatsappPreview.data ? <div className="rounded-xl bg-[#efeae2] p-4"><div data-testid="whatsapp-bubble" className="ms-auto max-w-[85%] rounded-lg rounded-se-none bg-[#d9fdd3] px-3 py-2 text-sm text-slate-900 shadow-sm"><p dir="auto" className="whitespace-pre-wrap break-words">{whatsappPreview.data.text}</p></div></div> : null}
                </section> : null}
                <section className={card} aria-labelledby={`${entry.key}-test`}>
                    <h3 id={`${entry.key}-test`} className="font-semibold">{text('إرسال رسالة تجريبية', 'Send test')}</h3>
                    {hasEmail && hasWhatsapp ? <div className="flex gap-4 text-sm" role="radiogroup" aria-label={text('القناة', 'Channel')}>
                        <label className="flex items-center gap-2"><input type="radio" name={`${entry.key}-test-channel`} checked={channel === 'email'} onChange={() => { setChannel('email'); setTestResult({ ok: '', error: '' }); }} />{text('البريد', 'Email')}</label>
                        <label className="flex items-center gap-2"><input type="radio" name={`${entry.key}-test-channel`} checked={channel === 'whatsapp'} onChange={() => { setChannel('whatsapp'); setTestResult({ ok: '', error: '' }); }} />{text('واتساب', 'WhatsApp')}</label>
                    </div> : null}
                    {channel === 'email'
                        ? <label className="block text-sm">{text('البريد المستلم', 'Recipient email')}<input className={input} type="email" dir="ltr" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} /></label>
                        : <label className="block text-sm">{text('رقم واتساب الدولي', 'International WhatsApp number')}<input className={input} type="tel" dir="ltr" placeholder="+9665XXXXXXXX" value={testPhone} onChange={(event) => setTestPhone(event.target.value)} /></label>}
                    {unsaved ? <p className="text-xs text-amber-800">{text('الرسالة التجريبية تستخدم القالب المحفوظ. احفظ تغييراتك أولًا.', 'Test messages use the saved template. Save your changes first.')}</p> : null}
                    {channel === 'whatsapp' && !whatsappReady ? <p className="text-xs text-amber-800">{text('تحقق من اتصال واتساب لإرسال رسالة تجريبية.', 'Verify the WhatsApp connection to send a test.')}</p> : null}
                    {testResult.ok ? <p role="status" className="text-sm text-emerald-800">{testResult.ok}</p> : null}
                    {testResult.error ? <p role="alert" className="text-sm text-red-700">{testResult.error}</p> : null}
                    <button type="button" className={button} disabled={testing || busy || !testValid || testBlocked} onClick={sendTest}>{testing ? text('جارٍ الإرسال…', 'Sending…') : text('إرسال تجربة', 'Send test')}</button>
                </section>
            </aside>
        </div>
    </div>;
}
