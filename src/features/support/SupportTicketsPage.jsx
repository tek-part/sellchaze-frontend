import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';
import { marketingUrl } from '../../config/marketing';
import { CATEGORIES, PRIORITIES, PriorityLabel, StatusPill, errorText, useSupportCopy } from './supportShared';

const control = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';

/** Ticket list for merchants (/support) and the platform support inbox (/admin/support). */
export default function SupportTicketsPage({ admin = false }) {
    const { text, label, relative } = useSupportCopy();
    const [status, setStatus] = useState('active');
    const [filters, setFilters] = useState({ priority: '', category: '', assigned: '', q: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const base = admin ? '/admin/support' : '/support';

    useEffect(() => {
        let active = true;
        const params = { status: status === 'all' ? undefined : status, page, ...(admin ? Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) : {}) };
        api.get(admin ? '/admin/support/tickets' : '/support/tickets', { params })
            .then(({ data }) => { if (active) { setResult(data); setError(''); } })
            .catch((e) => { if (active) setError(errorText(e)); });
        return () => { active = false; };
    }, [admin, status, page, filters]);

    const tabs = [['active', text('النشطة', 'Active')], ['open', label('status', 'open', admin)], ['awaiting_merchant', label('status', 'awaiting_merchant', admin)], ['resolved', label('status', 'resolved')], ['closed', label('status', 'closed')], ['all', text('الكل', 'All')]];
    const rows = result?.data ?? [];

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <PageHeader
                title={admin ? text('صندوق الدعم', 'Support inbox') : text('الدعم الفني', 'Support')}
                subtitle={admin ? text('تذاكر التجار مرتبة حسب ما ينتظر ردك أولاً.', 'Merchant tickets, with the ones waiting on you first.') : text('راسل فريق Sellchaze وتابع ردودنا في مكان واحد.', 'Message the Sellchaze team and follow every reply in one place.')}
                action={admin ? null : <Link to="/support/new" className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">{text('تذكرة جديدة', 'New ticket')}</Link>}
            />

            {!admin ? (
                <aside className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <p>{text('قبل فتح تذكرة، قد تجد الإجابة في مركز المساعدة.', 'Before opening a ticket, the answer may already be in the help center.')}</p>
                    <a href={marketingUrl('/help')} target="_blank" rel="noreferrer" className="font-semibold underline">{text('مركز المساعدة', 'Help center')}</a>
                </aside>
            ) : null}

            <div role="tablist" aria-label={text('حالة التذكرة', 'Ticket status')} className="flex flex-wrap gap-2">
                {tabs.map(([key, name]) => (
                    <button key={key} role="tab" aria-selected={status === key} onClick={() => { setStatus(key); setPage(1); }}
                        className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${status === key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
                        {name}{admin && result?.counts?.[key] ? <span className="ms-1.5 opacity-70">{result.counts[key]}</span> : null}
                    </button>
                ))}
            </div>

            {admin ? (
                <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, q: search.trim() })); setPage(1); }}>
                    <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-sm"><span className="text-slate-600">{text('بحث', 'Search')}</span>
                        <input type="search" className={`${control} w-full`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={text('الموضوع، الرقم، اسم التاجر أو بريده', 'Subject, reference, merchant name or email')} /></label>
                    <label className="flex flex-col gap-1 text-sm"><span className="text-slate-600">{text('الأولوية', 'Priority')}</span>
                        <select className={control} value={filters.priority} onChange={(e) => { setFilters((f) => ({ ...f, priority: e.target.value })); setPage(1); }}>
                            <option value="">{text('الكل', 'All')}</option>{PRIORITIES.map((p) => <option key={p} value={p}>{label('priority', p)}</option>)}</select></label>
                    <label className="flex flex-col gap-1 text-sm"><span className="text-slate-600">{text('القسم', 'Category')}</span>
                        <select className={control} value={filters.category} onChange={(e) => { setFilters((f) => ({ ...f, category: e.target.value })); setPage(1); }}>
                            <option value="">{text('الكل', 'All')}</option>{CATEGORIES.map((c) => <option key={c} value={c}>{label('category', c)}</option>)}</select></label>
                    <label className="flex flex-col gap-1 text-sm"><span className="text-slate-600">{text('المسؤول', 'Assignee')}</span>
                        <select className={control} value={filters.assigned} onChange={(e) => { setFilters((f) => ({ ...f, assigned: e.target.value })); setPage(1); }}>
                            <option value="">{text('الكل', 'Anyone')}</option><option value="me">{text('تذاكري', 'Mine')}</option><option value="none">{text('غير مسندة', 'Unassigned')}</option></select></label>
                    <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">{text('تطبيق', 'Apply')}</button>
                </form>
            ) : null}

            {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {!result && !error ? <p className="p-6 text-sm text-slate-500">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
                {result && rows.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="font-semibold text-slate-800">{text('لا توجد تذاكر هنا', 'No tickets here')}</p>
                        {!admin ? <p className="mt-1 text-sm text-slate-500">{text('افتح تذكرة وسيرد فريقنا في أقرب وقت.', 'Open a ticket and our team will reply as soon as possible.')}</p> : null}
                    </div>
                ) : null}
                <ul className="divide-y divide-slate-100">
                    {rows.map((ticket) => (
                        <li key={ticket.id}>
                            <Link to={`${base}/${ticket.id}`} className="flex flex-col gap-2 px-4 py-3.5 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4">
                                <span className="flex min-w-0 flex-1 items-start gap-2.5">
                                    <span aria-hidden className={`mt-2 h-2 w-2 shrink-0 rounded-full ${ticket.unread ? 'bg-brand' : 'bg-transparent'}`} />
                                    <span className="min-w-0">
                                        <span dir="auto" className={`block truncate text-start text-sm ${ticket.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{ticket.subject}</span>
                                        <span className="mt-0.5 block truncate text-xs text-slate-500" dir="auto">
                                            <span dir="ltr">{ticket.reference}</span> · {label('category', ticket.category)}
                                            {admin && ticket.owner ? <> · {ticket.owner.name}{ticket.store ? ` (${ticket.store.name})` : ''}</> : null}
                                        </span>
                                    </span>
                                    {ticket.unread ? <span className="sr-only">{text('رد جديد', 'New reply')}</span> : null}
                                </span>
                                <span className="flex shrink-0 flex-wrap items-center gap-3 ps-4 sm:ps-0">
                                    {admin ? <PriorityLabel priority={ticket.priority} /> : null}
                                    <StatusPill status={ticket.status} staff={admin} />
                                    <span className="text-xs text-slate-500">{relative(ticket.last_reply_at)}</span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {result?.meta?.last_page > 1 ? (
                <nav className="flex items-center justify-center gap-3 text-sm" aria-label={text('الصفحات', 'Pages')}>
                    <button className={control} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{text('السابق', 'Previous')}</button>
                    <span>{page} / {result.meta.last_page}</span>
                    <button className={control} disabled={page >= result.meta.last_page} onClick={() => setPage((p) => p + 1)}>{text('التالي', 'Next')}</button>
                </nav>
            ) : null}
        </div>
    );
}
