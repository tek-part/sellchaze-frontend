import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import SupportFilePicker from './SupportFilePicker';
import { CATEGORIES, PRIORITIES, STATUSES, PriorityLabel, StatusPill, errorText, formatBytes, openAttachment, toFormData, useSupportCopy, validateFiles } from './supportShared';

const control = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';

/** One ticket's conversation. Merchants reply and can close; support staff also triage it. */
export default function SupportTicketPage({ admin = false }) {
    const { id } = useParams();
    const { ar, text, label, dateTime } = useSupportCopy();
    const [ticket, setTicket] = useState(null);
    const [agents, setAgents] = useState([]);
    const [error, setError] = useState('');
    const [body, setBody] = useState('');
    const [files, setFiles] = useState([]);
    const [busy, setBusy] = useState(false);
    const working = useRef(false);
    const endpoint = `${admin ? '/admin/support/tickets' : '/support/tickets'}/${id}`;

    const load = useCallback(() => api.get(endpoint).then(({ data }) => {
        setTicket(data.data);
        if (data.agents) setAgents(data.agents);
        setError('');
    }), [endpoint]);

    useEffect(() => {
        let active = true;
        load().catch((e) => { if (active) setError(e?.response?.status === 404 ? 'not_found' : errorText(e)); });
        return () => { active = false; };
    }, [load]);

    async function run(action) {
        if (working.current) return false;
        working.current = true; setBusy(true); setError('');
        try {
            const { data } = await action();
            setTicket(data.data);
            return true;
        } catch (e) {
            setError(errorText(e));
            return false;
        } finally {
            working.current = false; setBusy(false);
        }
    }

    async function sendReply(e) {
        e.preventDefault();
        const fileError = validateFiles(files, text);
        if (fileError) { setError(fileError); return; }
        if (await run(() => api.post(`${endpoint}/messages`, toFormData({ body }, files)))) {
            setBody(''); setFiles([]);
        }
    }

    const update = (patch) => run(() => api.patch(endpoint, patch));

    if (error && !ticket) {
        return <div className="mx-auto max-w-3xl space-y-4"><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error === 'not_found' ? text('هذه التذكرة غير موجودة.', 'This ticket does not exist.') : error}</p>
            <Link to={admin ? '/admin/support' : '/support'} className="text-sm font-semibold text-brand">{text('العودة للتذاكر', 'Back to tickets')}</Link></div>;
    }
    if (!ticket) return <p className="p-6 text-sm text-slate-500">{text('جارٍ التحميل…', 'Loading…')}</p>;

    const closed = ticket.status === 'closed';

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="space-y-2">
                <Link to={admin ? '/admin/support' : '/support'} className="text-sm font-semibold text-slate-500 hover:text-slate-800">{ar ? '→' : '←'} {text('كل التذاكر', 'All tickets')}</Link>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900" dir="auto">{ticket.subject}</h1>
                        <p className="mt-1 text-sm text-slate-500"><span dir="ltr">{ticket.reference}</span> · {label('category', ticket.category)} · {dateTime(ticket.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3"><PriorityLabel priority={ticket.priority} /><StatusPill status={ticket.status} staff={admin} /></div>
                </div>
            </div>

            {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

            <div className={`grid gap-5 ${admin ? 'lg:grid-cols-[minmax(0,1fr)_18rem]' : ''}`}>
                <section className="space-y-4" aria-label={text('المحادثة', 'Conversation')}>
                    <ol className="space-y-3">
                        {ticket.messages.map((message) => {
                            const mine = admin ? message.is_staff : !message.is_staff;
                            return (
                                <li key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                    <article className={`max-w-[42rem] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.is_staff ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'bg-white ring-1 ring-slate-200'}`}>
                                        <header className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            <span className="font-semibold text-slate-800">{message.is_staff ? (admin ? message.author?.name : `${message.author?.name || ''} · ${text('فريق Sellchaze', 'Sellchaze team')}`) : (message.author?.name || text('التاجر', 'Merchant'))}</span>
                                            <time dateTime={message.created_at}>{dateTime(message.created_at)}</time>
                                        </header>
                                        <p className="whitespace-pre-wrap break-words leading-6 text-slate-800" dir="auto">{message.body}</p>
                                        {message.attachments.length ? (
                                            <ul className="mt-2.5 flex flex-wrap gap-2">
                                                {message.attachments.map((file) => (
                                                    <li key={file.url}>
                                                        <button type="button" onClick={() => openAttachment(file.url, file.name).catch((e) => setError(errorText(e)))}
                                                            className="rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-slate-200 hover:bg-white">
                                                            <span dir="auto">{file.name}</span> <span className="font-normal text-slate-500">({formatBytes(file.size)})</span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </article>
                                </li>
                            );
                        })}
                    </ol>

                    {closed ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            {text('هذه التذكرة مغلقة.', 'This ticket is closed.')} {!admin ? <Link to="/support/new" className="font-semibold text-brand">{text('افتح تذكرة جديدة', 'Open a new ticket')}</Link> : null}
                        </div>
                    ) : (
                        <form onSubmit={sendReply} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                            <label className="block space-y-1.5 text-sm">
                                <span className="font-semibold text-slate-800">{text('ردك', 'Your reply')}</span>
                                <textarea className={`${control} min-h-28`} required maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} disabled={busy} dir="auto" />
                            </label>
                            <SupportFilePicker files={files} onChange={setFiles} disabled={busy} />
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {!admin ? (
                                    <button type="button" disabled={busy} onClick={() => run(() => api.post(`${endpoint}/close`))} className="text-sm font-semibold text-slate-500 hover:text-red-600 disabled:opacity-50">
                                        {text('تم حل مشكلتي، أغلق التذكرة', 'My issue is solved, close the ticket')}
                                    </button>
                                ) : <span />}
                                <button disabled={busy || !body.trim()} className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{text('إرسال الرد', 'Send reply')}</button>
                            </div>
                        </form>
                    )}
                </section>

                {admin ? (
                    <aside className="space-y-4">
                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                            <h2 className="font-semibold text-slate-900">{text('التاجر', 'Merchant')}</h2>
                            <p className="text-slate-800">{ticket.owner?.name}</p>
                            <p className="break-all text-slate-500" dir="ltr">{ticket.owner?.email}</p>
                            {ticket.store ? <p className="text-slate-600">{text('المتجر', 'Store')}: {ticket.store.name} <span className="text-slate-400" dir="ltr">({ticket.store.slug})</span></p> : null}
                            {ticket.owner ? <Link to={`/merchants/${ticket.owner.id}`} className="inline-block font-semibold text-brand">{text('ملف التاجر', 'Merchant profile')}</Link> : null}
                        </div>
                        <fieldset disabled={busy} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                            <legend className="sr-only">{text('إدارة التذكرة', 'Manage ticket')}</legend>
                            <label className="block space-y-1"><span className="font-semibold text-slate-800">{text('الحالة', 'Status')}</span>
                                <select className={control} value={ticket.status} onChange={(e) => update({ status: e.target.value })}>{STATUSES.map((s) => <option key={s} value={s}>{label('status', s, true)}</option>)}</select></label>
                            <label className="block space-y-1"><span className="font-semibold text-slate-800">{text('الأولوية', 'Priority')}</span>
                                <select className={control} value={ticket.priority} onChange={(e) => update({ priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p} value={p}>{label('priority', p)}</option>)}</select></label>
                            <label className="block space-y-1"><span className="font-semibold text-slate-800">{text('القسم', 'Category')}</span>
                                <select className={control} value={ticket.category} onChange={(e) => update({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{label('category', c)}</option>)}</select></label>
                            <label className="block space-y-1"><span className="font-semibold text-slate-800">{text('المسؤول', 'Assignee')}</span>
                                <select className={control} value={ticket.assignee?.id ?? ''} onChange={(e) => update({ assigned_to_user_id: e.target.value ? Number(e.target.value) : null })}>
                                    <option value="">{text('غير مسندة', 'Unassigned')}</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
                        </fieldset>
                    </aside>
                ) : null}
            </div>
        </div>
    );
}
