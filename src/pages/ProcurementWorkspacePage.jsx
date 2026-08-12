import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineBuildingOffice2, HiOutlineChatBubbleLeftRight, HiOutlineClipboardDocumentList, HiOutlinePaperAirplane } from 'react-icons/hi2';
import api, { v2Request } from '../api/client';

const words = {
    en: {
        title: 'Procurement network', subtitle: 'Publish an RFQ, compare suppliers, and award the best quote.',
        company: 'Acting as', market: 'Open requests', create: 'Publish a request', item: 'What do you need?',
        description: 'Requirements', quantity: 'Quantity', unit: 'Unit', budget: 'Target budget', deadline: 'Response deadline',
        publish: 'Publish RFQ', quote: 'Submit quote', amount: 'Your price', lead: 'Lead time (days)', noRequests: 'No open requests yet.',
        quotes: 'quotes', own: 'Your request', awarded: 'Awarded', loading: 'Loading procurement network…',
        review: 'Review offers', hide: 'Hide offers', accept: 'Accept offer', accepted: 'Accepted', supplier: 'Supplier', noQuotes: 'No offers submitted yet.', purchaseOrder: 'Purchase order', discuss: 'Discuss',
        discover: 'Discover suppliers', search: 'Search companies', targeted: 'Private RFQ to', openMarket: 'Open market RFQ', invite: 'Request a quote',
    },
    ar: {
        title: 'شبكة المشتريات', subtitle: 'انشر طلب عرض سعر، قارن الموردين، واختر العرض الأنسب.',
        company: 'تعمل باسم', market: 'الطلبات المفتوحة', create: 'نشر طلب جديد', item: 'ما الذي تحتاجه؟',
        description: 'المواصفات', quantity: 'الكمية', unit: 'الوحدة', budget: 'الميزانية المستهدفة', deadline: 'آخر موعد للرد',
        publish: 'نشر طلب السعر', quote: 'تقديم عرض', amount: 'سعرك', lead: 'مدة التوريد بالأيام', noRequests: 'لا توجد طلبات مفتوحة حاليًا.',
        quotes: 'عروض', own: 'طلب شركتك', awarded: 'تم الترسية', loading: 'جارٍ تحميل شبكة المشتريات…',
        review: 'مراجعة العروض', hide: 'إخفاء العروض', accept: 'قبول العرض', accepted: 'العرض الفائز', supplier: 'المورد', noQuotes: 'لم تصل عروض بعد.', purchaseOrder: 'أمر الشراء', discuss: 'مناقشة الطلب',
    },
};

const unwrap = (response) => response.data?.data ?? response.data;
const message = (error) => error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || error.message;

export default function ProcurementWorkspacePage() {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const t = words[i18n.language === 'ar' ? 'ar' : 'en'];
    const [companies, setCompanies] = useState([]);
    const [companyId, setCompanyId] = useState('');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', description: '', quantity: 1, unit: 'piece', budget: '', response_deadline: '' });
    const [quotes, setQuotes] = useState({});
    const [details, setDetails] = useState({});
    const [reviewing, setReviewing] = useState({});
    const [accepting, setAccepting] = useState('');
    const [directory, setDirectory] = useState([]);
    const [directoryQuery, setDirectoryQuery] = useState('');
    const [targetSupplierId, setTargetSupplierId] = useState(searchParams.get('supplier') || '');
    const [audience, setAudience] = useState(searchParams.get('supplier') ? 'one' : 'open');
    const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [targetSectorId, setTargetSectorId] = useState('');
    const [itemsText, setItemsText] = useState('');
    const [attachmentsText, setAttachmentsText] = useState('');
    const activeCompany = useMemo(() => companies.find((company) => String(company.id) === String(companyId)), [companies, companyId]);

    const load = useCallback(async () => {
        const [companyResponse, requestResponse, directoryResponse, sectorResponse] = await Promise.all([
            v2Request({ method: 'get', url: '/organizations' }),
            v2Request({ method: 'get', url: '/procurement/requests' }),
            v2Request({ method: 'get', url: '/directory/organizations', params: directoryQuery ? { q: directoryQuery } : {} }),
            api.get('/public/sectors'),
        ]);
        const companyRows = unwrap(companyResponse) || [];
        setCompanies(companyRows);
        setCompanyId((current) => current || String(companyRows[0]?.id || ''));
        setRequests(unwrap(requestResponse) || []);
        setDirectory(unwrap(directoryResponse) || []);
        setSectors(sectorResponse.data?.data ?? sectorResponse.data ?? []);
    }, [directoryQuery]);

    useEffect(() => { load().catch((error) => toast.error(message(error))).finally(() => setLoading(false)); }, [load]);

    const publish = async (event) => {
        event.preventDefault();
        try {
            await v2Request({ method: 'post', url: '/procurement/requests', data: {
                ...form,
                organization_id: Number(companyId),
                quantity: Number(form.quantity),
                budget: form.budget ? Number(form.budget) : null,
                response_deadline: form.response_deadline || null,
                status: 'published',
                target_supplier_organization_id: audience === 'one' && targetSupplierId ? Number(targetSupplierId) : null,
                target_supplier_organization_ids: audience === 'selected' ? selectedSupplierIds.map(Number) : null,
                target_sector_id: audience === 'sector' && targetSectorId ? Number(targetSectorId) : null,
                items: itemsText.trim() ? itemsText.split('\n').filter(Boolean).map((line) => {
                    const [name, quantity = '1', unit = 'piece', specifications = ''] = line.split('|').map((value) => value.trim());
                    return { name, quantity: Number(quantity), unit, specifications: specifications ? { details: specifications } : null };
                }) : null,
                attachments: attachmentsText.trim() ? attachmentsText.split('\n').filter(Boolean).map((url) => ({ url: url.trim(), type: 'document' })) : null,
            } });
            setForm({ title: '', description: '', quantity: 1, unit: 'piece', budget: '', response_deadline: '' });
            setTargetSupplierId('');
            setSelectedSupplierIds([]); setTargetSectorId(''); setAudience('open'); setItemsText(''); setAttachmentsText('');
            await load();
            toast.success(t.publish);
        } catch (error) { toast.error(message(error)); }
    };

    const submitQuote = async (requestId) => {
        const quote = quotes[requestId] || {};
        try {
            const requestResponse = await v2Request({ method: 'get', url: `/procurement/requests/${requestId}` });
            const existing = (unwrap(requestResponse)?.quotes || []).find((offer) => String(offer.supplier_organization_id) === String(companyId));
            await v2Request({ method: existing ? 'patch' : 'post', url: existing
                ? `/procurement/requests/${requestId}/quotes/${existing.id}`
                : `/procurement/requests/${requestId}/quotes`, data: {
                supplier_organization_id: Number(companyId),
                amount: Number(quote.amount),
                lead_time_days: quote.lead_time_days ? Number(quote.lead_time_days) : null,
                valid_until: quote.valid_until || null,
                delivery_terms: quote.delivery_terms || null,
                attachments: quote.attachment_url ? [{ url: quote.attachment_url, name: 'Quote attachment' }] : null,
            } });
            setQuotes((current) => ({ ...current, [requestId]: {} }));
            await load();
            toast.success(t.quote);
        } catch (error) { toast.error(message(error)); }
    };

    const toggleOffers = async (requestId) => {
        if (details[requestId]) {
            setDetails((current) => ({ ...current, [requestId]: null }));
            return;
        }
        setReviewing((current) => ({ ...current, [requestId]: true }));
        try {
            const [response, comparison, audit] = await Promise.all([
                v2Request({ method: 'get', url: `/procurement/requests/${requestId}` }),
                v2Request({ method: 'get', url: `/procurement/requests/${requestId}/quotes/compare` }),
                v2Request({ method: 'get', url: `/procurement/requests/${requestId}/audit` }),
            ]);
            setDetails((current) => ({ ...current, [requestId]: { ...unwrap(response), comparison: unwrap(comparison), audit: unwrap(audit) } }));
        } catch (error) { toast.error(message(error)); }
        finally { setReviewing((current) => ({ ...current, [requestId]: false })); }
    };

    const acceptQuote = async (requestId, quoteId) => {
        setAccepting(quoteId);
        try {
            await v2Request({ method: 'post', url: `/procurement/requests/${requestId}/quotes/${quoteId}/accept` });
            const response = await v2Request({ method: 'get', url: `/procurement/requests/${requestId}` });
            setDetails((current) => ({ ...current, [requestId]: unwrap(response) }));
            await load();
            toast.success(t.accepted);
        } catch (error) { toast.error(message(error)); }
        finally { setAccepting(''); }
    };

    const startConversation = async (requestId, supplierOrganizationId) => {
        try {
            const response = await v2Request({ method: 'post', url: `/procurement/requests/${requestId}/conversation`, data: {
                supplier_organization_id: Number(supplierOrganizationId),
            } });
            navigate(`/chat?c=${unwrap(response).id}`);
        } catch (error) { toast.error(message(error)); }
    };

    if (loading) return <div className="py-16 text-center text-sm text-slate-500">{t.loading}</div>;

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-12">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
                <div><h1 className="text-2xl font-bold text-[#0a2540]">{t.title}</h1><p className="mt-1 text-sm text-slate-500">{t.subtitle}</p></div>
                <label className="text-xs font-semibold text-slate-500">{t.company}<select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="ms-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
            </header>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <form onSubmit={publish} className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-bold text-[#0a2540]"><HiOutlineClipboardDocumentList className="text-xl text-[#0b63ce]" />{t.create}</h2>
                    <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t.item} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t.description} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                    <div className="grid grid-cols-2 gap-3"><input required min="0.001" step="any" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder={t.quantity} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder={t.unit} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></div>
                    <input min="0" step="any" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder={t.budget} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                    <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="open">{t.openMarket || 'Open market RFQ'}</option><option value="one">One supplier</option><option value="selected">Selected suppliers</option><option value="sector">Sector network</option></select>
                    {audience === 'one' && <select required value={targetSupplierId} onChange={(e) => setTargetSupplierId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Select supplier</option>{directory.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>}
                    {audience === 'selected' && <div className="max-h-36 space-y-1 overflow-auto rounded-xl border border-slate-200 p-2">{directory.map((company) => <label key={company.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selectedSupplierIds.includes(String(company.id))} onChange={(e) => setSelectedSupplierIds((rows) => e.target.checked ? [...rows, String(company.id)] : rows.filter((id) => id !== String(company.id)))} />{company.name}</label>)}</div>}
                    {audience === 'sector' && <select required value={targetSectorId} onChange={(e) => setTargetSectorId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Select sector</option>{sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name || sector.name_en || sector.slug}</option>)}</select>}
                    <textarea rows={3} value={itemsText} onChange={(e) => setItemsText(e.target.value)} placeholder="Items: name | quantity | unit | specifications (one per line)" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" />
                    <textarea rows={2} value={attachmentsText} onChange={(e) => setAttachmentsText(e.target.value)} placeholder="Attachment URLs (one per line)" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" />
                    <label className="block text-xs font-semibold text-slate-500">{t.deadline}<input type="datetime-local" value={form.response_deadline} onChange={(e) => setForm({ ...form, response_deadline: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                    <button disabled={!activeCompany} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b63ce] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#076c77] disabled:opacity-50"><HiOutlinePaperAirplane />{t.publish}</button>
                </form>

                <section className="space-y-3 lg:col-start-1">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t.discover || 'Discover suppliers'}</h2>
                    <input value={directoryQuery} onChange={(e) => setDirectoryQuery(e.target.value)} placeholder={t.search || 'Search companies'} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <div className="grid gap-2">{directory.slice(0, 8).map((company) => <article key={company.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold text-[#0a2540]">{company.name}</p><p className="text-xs text-slate-500">{company.type} · {company.stores_count} stores · {company.team_size} people</p></div><button type="button" onClick={() => { setAudience('one'); setTargetSupplierId(String(company.id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg border border-[#0b63ce] px-2.5 py-1.5 text-xs font-bold text-[#0b63ce]">{t.invite || 'Request a quote'}</button></div>{company.stores?.length > 0 && <p className="mt-2 text-xs text-slate-400">{company.stores.map((row) => row.name).join(' · ')}</p>}</article>)}</div>
                </section>

                <section className="space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1"><h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t.market}</h2>
                    {!requests.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{t.noRequests}</div>}
                    {requests.map((item) => { const own = String(item.buyer_organization_id) === String(companyId); const quote = quotes[item.id] || {}; return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-1 text-xs font-semibold text-[#0b63ce]"><HiOutlineBuildingOffice2 />{item.buyer_organization?.name}</p><h3 className="mt-1 text-lg font-bold text-[#0a2540]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p></div><span className="rounded-full bg-[#eaf3ff] px-3 py-1 text-xs font-bold text-[#0b63ce]">{item.status === 'awarded' ? t.awarded : `${item.quotes_count || 0} ${t.quotes}`}</span></div>
                        <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500"><span>{item.quantity} {item.unit}</span>{item.budget && <span>{item.budget} {item.currency}</span>}{own && <span className="text-[#0b63ce]">{t.own}</span>}</div>
                        {own && <div className="mt-4 border-t border-slate-100 pt-4">
                            <button type="button" disabled={reviewing[item.id]} onClick={() => toggleOffers(item.id)} className="rounded-xl border border-[#0b63ce] px-4 py-2 text-sm font-bold text-[#0b63ce] disabled:opacity-50">{details[item.id] ? t.hide : t.review}</button>
                            {details[item.id] && <div className="mt-3 space-y-2">
                                {details[item.id].order && <p className="rounded-xl bg-[#eaf3ff] p-3 text-sm font-bold text-[#0b63ce]">{t.purchaseOrder}: {details[item.id].order.order_number}</p>}
                                {!details[item.id].quotes?.length && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">{t.noQuotes}</p>}
                                {(details[item.id].comparison || details[item.id].quotes)?.map((offer) => <div key={offer.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 ${offer.amount_above_lowest === 0 ? 'border border-emerald-200 bg-emerald-50' : 'bg-slate-50'}`}>
                                    <div><p className="text-sm font-bold text-[#0a2540]">{offer.supplier_organization?.name || t.supplier}{offer.amount_above_lowest === 0 && <span className="ms-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">Lowest price</span>}</p><p className="mt-1 text-xs text-slate-500">{offer.amount} {offer.currency}{offer.lead_time_days != null && ` · ${offer.lead_time_days} ${t.lead}`} · v{offer.version || 1}{offer.amount_above_lowest > 0 && ` · +${offer.amount_above_lowest}`}</p></div>
                                    <div className="flex gap-2"><button type="button" onClick={() => startConversation(item.id, offer.supplier_organization_id || offer.supplier_organization?.id)} className="flex items-center gap-1 rounded-xl border border-[#0b63ce] px-3 py-2 text-xs font-bold text-[#0b63ce]"><HiOutlineChatBubbleLeftRight />{t.discuss}</button>{offer.status === 'accepted' ? <span className="rounded-full bg-[#eaf3ff] px-3 py-2 text-xs font-bold text-[#0b63ce]">{t.accepted}</span> : item.status === 'published' && offer.status === 'submitted' && <button type="button" disabled={accepting === offer.id} onClick={() => acceptQuote(item.id, offer.id)} className="rounded-xl bg-[#0b63ce] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{t.accept}</button>}</div>
                                </div>)}
                                {!!details[item.id].audit?.length && <p className="text-xs text-slate-400">Audit trail: {details[item.id].audit.length} events</p>}
                            </div>}
                        </div>}
                        {!own && item.status === 'published' && <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2"><input required type="number" min="0" step="any" value={quote.amount || ''} onChange={(e) => setQuotes({ ...quotes, [item.id]: { ...quote, amount: e.target.value } })} placeholder={t.amount} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input type="number" min="0" value={quote.lead_time_days || ''} onChange={(e) => setQuotes({ ...quotes, [item.id]: { ...quote, lead_time_days: e.target.value } })} placeholder={t.lead} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input type="date" value={quote.valid_until || ''} onChange={(e) => setQuotes({ ...quotes, [item.id]: { ...quote, valid_until: e.target.value } })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input value={quote.delivery_terms || ''} onChange={(e) => setQuotes({ ...quotes, [item.id]: { ...quote, delivery_terms: e.target.value } })} placeholder="Delivery terms" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input type="url" value={quote.attachment_url || ''} onChange={(e) => setQuotes({ ...quotes, [item.id]: { ...quote, attachment_url: e.target.value } })} placeholder="Attachment URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button type="button" disabled={!quote.amount} onClick={() => submitQuote(item.id)} className="rounded-xl bg-[#0a2540] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{t.quote}</button></div>}
                        {!own && item.status === 'published' && <button type="button" onClick={() => startConversation(item.id, companyId)} className="mt-2 flex items-center gap-1 rounded-xl border border-[#0b63ce] px-4 py-2 text-xs font-bold text-[#0b63ce]"><HiOutlineChatBubbleLeftRight />{t.discuss}</button>}
                    </article>; })}
                </section>
            </div>
        </div>
    );
}
