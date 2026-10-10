import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';
import useStoreContext from '../../hooks/useStoreContext';

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900';
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700';
const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

export default function StoreBlockedPhonesPage({ otp = false }) {
    const context = useStoreContext();
    return <BlockedPhones key={`${context.apiBase}:${otp}`} otp={otp} context={{ ...context, apiBase: `${context.apiBase}/${otp ? 'blocked-phones' : 'blocked-phone-numbers'}` }} />;
}

function BlockedPhones({ context: { apiBase, uiBase, access }, otp }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [data, setData] = useState(null);
    const [phone, setPhone] = useState('');
    const [note, setNote] = useState('');
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('active');
    const [page, setPage] = useState(1);
    const [refresh, setRefresh] = useState(0);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState('');
    const [history, setHistory] = useState(null);
    const working = useRef(false);
    useEffect(() => {
        let active = true;
        if (!access?.canStoreOrders) return undefined;
        setLoading(true);
        api.get(apiBase, { params: { q: query || undefined, status, page } }).then(({ data: result }) => {
            if (!active) return;
            setData(result); setLoading(false);
            if (page > result.meta.last_page) setPage(result.meta.last_page);
        }).catch((e) => { if (active) { setError(errorText(e)); setLoading(false); } });
        return () => { active = false; };
    }, [apiBase, access?.canStoreOrders, page, query, status, refresh]);
    if (!access?.canStoreOrders) return <Navigate to={`${uiBase}/overview`} replace />;
    async function send(method, suffix, body) {
        if (working.current) return false;
        working.current = true; setBusy(true); setError(''); setSaved('');
        try {
            await api[method](`${apiBase}${suffix}`, body);
            setSaved(text('تم حفظ قائمة الحظر.', 'Block list saved.')); setRefresh((n) => n + 1);
            return true;
        } catch (e) { setError(errorText(e)); return false; }
        finally { working.current = false; setBusy(false); }
    }
    const country = data?.phone_country || 'EG';
    const countryName = new Intl.DisplayNames([ar ? 'ar' : 'en'], { type: 'region' }).of(country) || country;
    return <div className="mx-auto max-w-5xl space-y-5">
        <PageHeader title={otp ? text('أرقام محظورة من تأكيد OTP', 'Phones blocked from OTP verification') : text('أرقام محظورة من الشراء', 'Phones blocked from ordering')} subtitle={otp ? text('امنع إرسال رموز واتساب أو استخدامها لأرقام محددة.', 'Prevent WhatsApp code sending and verification for specific numbers.') : text('امنع إنشاء طلبات جديدة لأرقام محددة، وراجع سجل كل تغيير.', 'Prevent new orders for specific numbers and review every change.')} />
        <aside className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            <p>{otp ? text('هذه القائمة مستقلة عن حظر الشراء. تمنع إرسال رمز OTP والتحقق منه واستخدام تأكيد سابق. إذا كان OTP مطلوبًا، يتوقف إنشاء الطلب حتى إلغاء حظر الرقم.', 'This list is separate from checkout blocking. It prevents sending, verifying and consuming an existing OTP proof. When OTP is required, the number cannot place an order until unblocked.') : text('عند وجود أرقام محظورة نشطة، يصبح الهاتف الصحيح مطلوبًا في كل طلب، حتى المنتجات الرقمية. الأرقام المحلية والدولية المكافئة تُعامل كرقم واحد.', 'When this list has active blocks, every order requires a valid phone, including digital products. Equivalent local and international formats count as one number.')}</p>
            <p>{otp ? text('عند تعطيل OTP، لا تمنع هذه القائمة الشراء. الطلبات السابقة وإعادة دفعها متاحة، وإلغاء الحظر يحتفظ بالسجل.', 'When OTP is disabled, this list does not block purchases. Existing orders/payment retries remain available and unblocking preserves history.') : text('الحظر يخص هذا المتجر والطلبات الجديدة. الطلبات السابقة وإعادة محاولة دفعها تظل متاحة. إلغاء الحظر يحتفظ بالسجل ويمكن عكسه.', 'Blocking applies to new orders in this store. Existing orders and their payment retries remain available. Unblocking preserves history and can be reversed.')}</p>
            {access.canStoreSettings ? <Link className="underline" to={`${uiBase}/settings/order-limits`}>{text('دولة الأرقام المحلية', 'Local number country')}: {countryName} ({country})</Link> : <p>{text('دولة الأرقام المحلية', 'Local number country')}: {countryName} ({country})</p>}
        </aside>
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}<button className={`${button} mx-2`} onClick={() => { setError(''); setRefresh((n) => n + 1); }}>{text('إعادة تحميل القائمة', 'Reload list')}</button></p> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{saved}</p> : null}
        <form onSubmit={async (event) => { event.preventDefault(); if (await send('post', '', { phone, note: note.trim() || null })) { setPhone(''); setNote(''); } }} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="font-semibold">{text('إضافة رقم للحظر', 'Block a phone number')}</h2>
            <fieldset disabled={busy || loading || !data} className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm"><span>{text('رقم الهاتف', 'Phone number')}</span><input className={input} type="tel" dir="ltr" maxLength={50} required value={phone} onChange={(event) => setPhone(event.target.value)} aria-describedby="block-phone-help" /><span id="block-phone-help" className="block text-slate-500">{text('أدخل رقمًا محليًا للدولة المحددة، أو رقمًا دوليًا مع كود الدولة.', 'Enter a local number for the selected country, or an international number with its country code.')}</span></label>
                <label className="space-y-2 text-sm"><span>{text('ملاحظة داخلية اختيارية', 'Optional internal note')}</span><textarea className={input} rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            </fieldset>
            <button className={`${button} bg-emerald-600 text-white`} disabled={busy || loading || !data}>{text('حظر الرقم', 'Block number')}</button>
        </form>
        <form onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); setPage(1); setHistory(null); }} className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 space-y-2 text-sm"><span>{text('بحث برقم الهاتف أو آخر أرقامه', 'Search phone number or ending digits')}</span><input className={input} type="search" dir="ltr" maxLength={64} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <label className="space-y-2 text-sm"><span>{text('الحالة', 'Status')}</span><select className={input} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); setHistory(null); }}><option value="active">{text('محظور', 'Blocked')}</option><option value="inactive">{text('غير محظور', 'Unblocked')}</option><option value="all">{text('الكل', 'All')}</option></select></label>
            <button className={button}>{text('بحث', 'Search')}</button>
        </form>
        {loading ? <p role="status">{text('جارٍ تحميل القائمة…', 'Loading list…')}</p> : data ? <>
            <p className="text-sm text-slate-500">{text('عدد النتائج', 'Results')}: {data.meta.total}</p>
            {data.data.length ? <ul className="space-y-3">{data.data.map((block) => <BlockRow key={`${block.id}:${block.version}`} block={block} text={text} busy={busy} update={(active, nextNote) => send('put', `/${block.id}`, { active, note: nextNote, version: block.version })} openHistory={() => setHistory(block)} />)}</ul> : <p role="status" className="rounded-xl border border-dashed border-slate-200 p-6">{text('لا توجد أرقام بهذه الحالة أو البحث.', 'No numbers match this status or search.')}</p>}
            <div className="flex flex-wrap items-center justify-center gap-3"><button className={button} disabled={busy || page <= 1} onClick={() => setPage((n) => n - 1)}>{text('السابق', 'Previous')}</button><span>{page} / {data.meta.last_page}</span><button className={button} disabled={busy || page >= data.meta.last_page} onClick={() => setPage((n) => n + 1)}>{text('التالي', 'Next')}</button></div>
        </> : null}
        {history ? <History key={history.id} block={history} apiBase={apiBase} text={text} locale={ar ? 'ar' : 'en'} refresh={refresh} close={() => setHistory(null)} /> : null}
    </div>;
}

function BlockRow({ block, text, busy, update, openHistory }) {
    const [editing, setEditing] = useState(false);
    const [note, setNote] = useState(block.note || '');
    return <li className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="break-all font-semibold" dir="ltr">{block.phone_normalized}</span><span className={`rounded-full px-3 py-1 text-xs ${block.active ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>{block.active ? text('محظور', 'Blocked') : text('غير محظور', 'Unblocked')}</span></div>
        {block.note ? <p className="whitespace-pre-wrap break-words text-sm">{block.note}</p> : null}
        {editing ? <form className="space-y-2" onSubmit={async (event) => { event.preventDefault(); if (await update(block.active, note.trim() || null)) setEditing(false); }}><label className="block space-y-2 text-sm"><span>{text('تعديل الملاحظة', 'Edit note')}</span><textarea className={input} disabled={busy} maxLength={500} rows={2} value={note} onChange={(event) => setNote(event.target.value)} /></label><div className="flex gap-2"><button className={button} disabled={busy}>{text('حفظ الملاحظة', 'Save note')}</button><button className={button} type="button" disabled={busy} onClick={() => { setEditing(false); setNote(block.note || ''); }}>{text('إلغاء', 'Cancel')}</button></div></form> : <div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={() => update(!block.active, block.note)}>{block.active ? text('إلغاء الحظر', 'Unblock') : text('إعادة الحظر', 'Block again')}</button><button className={button} disabled={busy} onClick={() => setEditing(true)}>{text('تعديل الملاحظة', 'Edit note')}</button><button className={button} onClick={openHistory}>{text('سجل التغييرات', 'Change history')}</button></div>}
    </li>;
}

function History({ block, apiBase, text, locale, refresh, close }) {
    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [attempt, setAttempt] = useState(0);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true; setData(null); setError('');
        api.get(`${apiBase}/${block.id}/history`, { params: { page } }).then(({ data }) => { if (active) setData(data); }).catch((e) => { if (active) setError(errorText(e)); });
        return () => { active = false; };
    }, [apiBase, block.id, page, attempt, refresh]);
    const actions = { blocked: text('حظر', 'Blocked'), unblocked: text('إلغاء الحظر', 'Unblocked'), note_changed: text('تعديل الملاحظة', 'Note changed') };
    return <section aria-label={text('سجل تغييرات الحظر', 'Block change history')} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{text('سجل التغييرات', 'Change history')} <bdi>{block.phone_normalized}</bdi></h2><button className={button} onClick={close}>{text('إغلاق السجل', 'Close history')}</button></div>
        {error ? <p role="alert">{error}<button className={button} onClick={() => setAttempt((n) => n + 1)}>{text('إعادة المحاولة', 'Retry')}</button></p> : !data ? <p role="status">{text('جارٍ تحميل السجل…', 'Loading history…')}</p> : <>
            <ol className="space-y-3">{data.data.map((event) => <li key={event.id} className="border-b border-slate-100 pb-3"><p className="text-sm font-semibold">{actions[event.action] || event.action} · {event.actor || text('حساب محذوف', 'Deleted account')} · {new Date(event.created_at).toLocaleString(locale)}</p>{event.note ? <p className="whitespace-pre-wrap break-words text-sm">{event.note}</p> : null}</li>)}</ol>
            <div className="flex gap-3"><button className={button} disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>{text('السابق', 'Previous')}</button><span>{page} / {data.meta.last_page}</span><button className={button} disabled={page >= data.meta.last_page} onClick={() => setPage((n) => n + 1)}>{text('التالي', 'Next')}</button></div>
        </>}
    </section>;
}
