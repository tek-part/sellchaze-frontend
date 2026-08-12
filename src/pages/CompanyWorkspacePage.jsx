import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    HiOutlineBuildingOffice2,
    HiOutlineCheckCircle,
    HiOutlineLink,
    HiOutlineMagnifyingGlass,
    HiOutlinePlus,
    HiOutlineShoppingBag,
    HiOutlineUserGroup,
    HiOutlineXMark,
} from 'react-icons/hi2';
import { v2Request } from '../api/client';

const copy = {
    en: {
        title: 'Company workspace', subtitle: 'Manage your company, team, stores and subscription from one place.',
        create: 'Create company', companyName: 'Company name', createButton: 'Create', cancel: 'Cancel',
        overview: 'Overview', team: 'Team', stores: 'Stores', plan: 'Current plan', seats: 'Active seats',
        addMember: 'Add team member', email: 'User email', role: 'Role', add: 'Add',
        createStore: 'Create store', storeName: 'Store name', slug: 'Store slug', noCompany: 'Create your first company to continue.',
        loading: 'Loading company workspace…', quota: 'Usage and limits', unlimited: 'Unlimited', choose: 'Choose company',
        ready: 'Ready', notReady: 'Setup incomplete', publish: 'Publish', unpublish: 'Unpublish',
        connections: 'Business connections', findCompanies: 'Find companies', searchCompanies: 'Search companies…',
        connect: 'Connect', incoming: 'Incoming', outgoing: 'Outgoing', accept: 'Accept', reject: 'Reject',
        noConnections: 'No business connections yet.', requestMessage: 'Optional introduction message',
    },
    ar: {
        title: 'مساحة عمل الشركة', subtitle: 'أدر شركتك وفريقك ومتاجرك واشتراكك من مكان واحد.',
        create: 'إنشاء شركة', companyName: 'اسم الشركة', createButton: 'إنشاء', cancel: 'إلغاء',
        overview: 'نظرة عامة', team: 'الفريق', stores: 'المتاجر', plan: 'الباقة الحالية', seats: 'المقاعد النشطة',
        addMember: 'إضافة عضو فريق', email: 'بريد المستخدم', role: 'الدور', add: 'إضافة',
        createStore: 'إنشاء متجر', storeName: 'اسم المتجر', slug: 'رابط المتجر', noCompany: 'أنشئ شركتك الأولى للمتابعة.',
        loading: 'جارٍ تحميل مساحة عمل الشركة…', quota: 'الاستخدام والحدود', unlimited: 'غير محدود', choose: 'اختر الشركة',
        ready: 'جاهز للنشر', notReady: 'الإعداد غير مكتمل', publish: 'نشر', unpublish: 'إلغاء النشر',
        connections: 'العلاقات التجارية', findCompanies: 'البحث عن شركات', searchCompanies: 'ابحث عن شركة…',
        connect: 'طلب علاقة', incoming: 'وارد', outgoing: 'صادر', accept: 'قبول', reject: 'رفض',
        noConnections: 'لا توجد علاقات تجارية بعد.', requestMessage: 'رسالة تعريفية اختيارية',
    },
};

const unwrap = (response) => response.data?.data ?? response.data;
const errorMessage = (error) => error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || error.message;

export default function CompanyWorkspacePage() {
    const { i18n } = useTranslation();
    const c = copy[i18n.language === 'ar' ? 'ar' : 'en'];
    const [companies, setCompanies] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [members, setMembers] = useState([]);
    const [stores, setStores] = useState([]);
    const [connections, setConnections] = useState([]);
    const [connectionQuery, setConnectionQuery] = useState('');
    const [connectionMessage, setConnectionMessage] = useState('');
    const [discoveredCompanies, setDiscoveredCompanies] = useState([]);
    const [connectionBusy, setConnectionBusy] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [readiness, setReadiness] = useState({});
    const [loading, setLoading] = useState(true);
    const [companyName, setCompanyName] = useState('');
    const [member, setMember] = useState({ email: '', role: 'member' });
    const [store, setStore] = useState({ name: '', slug: '' });
    const [profile, setProfile] = useState({
        headline: '', about: '', website: '', capabilities: '', locations: '',
        certificates: '', featuredProducts: '',
    });

    const active = useMemo(() => companies.find((item) => item.id === activeId) ?? companies[0] ?? null, [activeId, companies]);
    const canManage = ['owner', 'admin'].includes(active?.membership?.role);
    const canManageConnections = canManage || (active?.membership?.permissions ?? []).includes('manage_connections');

    const loadCompanies = useCallback(async () => {
        const response = await v2Request({ method: 'get', url: '/organizations' });
        const rows = unwrap(response) ?? [];
        setCompanies(rows);
        setActiveId((current) => current ?? rows[0]?.id ?? null);
        return rows;
    }, []);

    const loadWorkspace = useCallback(async (organizationId) => {
        if (!organizationId) return;
        const [teamResponse, storesResponse, subscriptionResponse, connectionsResponse] = await Promise.all([
            v2Request({ method: 'get', url: `/organizations/${organizationId}/memberships` }),
            v2Request({ method: 'get', url: `/organizations/${organizationId}/stores` }),
            v2Request({ method: 'get', url: `/organizations/${organizationId}/subscription` }),
            v2Request({ method: 'get', url: `/organizations/${organizationId}/connections` }),
        ]);
        setMembers(unwrap(teamResponse) ?? []);
        const storeRows = unwrap(storesResponse) ?? [];
        setStores(storeRows);
        setSubscription(unwrap(subscriptionResponse));
        setConnections(unwrap(connectionsResponse) ?? []);
        const checks = await Promise.all(storeRows.map(async (row) => {
            const response = await v2Request({ method: 'get', url: `/organizations/${organizationId}/stores/${row.id}/readiness` });
            return [row.id, unwrap(response)];
        }));
        setReadiness(Object.fromEntries(checks));
    }, []);

    useEffect(() => {
        loadCompanies().catch((error) => toast.error(errorMessage(error))).finally(() => setLoading(false));
    }, [loadCompanies]);

    useEffect(() => {
        if (!active?.id) return;
        setProfile({
            headline: active.profile?.headline ?? active.headline ?? '', about: active.profile?.about ?? active.about ?? '',
            website: active.profile?.website ?? active.website ?? '',
            capabilities: (active.profile?.capabilities ?? active.capabilities ?? []).join(', '),
            locations: (active.profile?.locations ?? active.locations ?? []).map((row) => `${row.label || ''}|${row.country_code || ''}`).join('\n'),
            certificates: (active.profile?.certificates ?? []).map((row) => `${row.name || ''}|${row.url || ''}`).join('\n'),
            featuredProducts: (active.profile?.featured_products ?? []).map((row) => typeof row === 'string' ? row : `${row.name || ''}|${row.url || ''}`).join('\n'),
        });
        setLoading(true);
        loadWorkspace(active.id).catch((error) => toast.error(errorMessage(error))).finally(() => setLoading(false));
    }, [active, loadWorkspace]);

    const saveProfile = async (event) => {
        event.preventDefault();
        try {
            const response = await v2Request({ method: 'patch', url: `/organizations/${active.id}`, data: {
                headline: profile.headline, about: profile.about, website: profile.website || null,
                capabilities: profile.capabilities.split(',').map((value) => value.trim()).filter(Boolean),
                locations: profile.locations.split('\n').filter(Boolean).map((line) => { const [label, country_code] = line.split('|').map((value) => value.trim()); return { label, country_code }; }),
                certificates: profile.certificates.split('\n').filter(Boolean).map((line) => { const [name, url] = line.split('|').map((value) => value.trim()); return { name, url }; }),
                featured_products: profile.featuredProducts.split('\n').filter(Boolean).map((line) => { const [name, url] = line.split('|').map((value) => value.trim()); return { name, url }; }),
            } });
            const updated = unwrap(response);
            setCompanies((rows) => rows.map((row) => row.id === updated.id ? updated : row));
            toast.success('Company profile saved');
        } catch (error) { toast.error(errorMessage(error)); }
    };

    const createCompany = async (event) => {
        event.preventDefault();
        try {
            const response = await v2Request({ method: 'post', url: '/organizations', data: { name: companyName } });
            const created = unwrap(response);
            setCompanies((rows) => [...rows, created]);
            setActiveId(created.id);
            setCompanyName('');
            toast.success(c.createButton);
        } catch (error) { toast.error(errorMessage(error)); }
    };

    const addMember = async (event) => {
        event.preventDefault();
        try {
            await v2Request({ method: 'post', url: `/organizations/${active.id}/memberships`, data: member });
            setMember({ email: '', role: 'member' });
            await loadWorkspace(active.id);
            toast.success(c.add);
        } catch (error) { toast.error(errorMessage(error)); }
    };

    const createStore = async (event) => {
        event.preventDefault();
        try {
            await v2Request({ method: 'post', url: `/organizations/${active.id}/stores`, data: store });
            setStore({ name: '', slug: '' });
            await loadWorkspace(active.id);
            toast.success(c.createStore);
        } catch (error) { toast.error(errorMessage(error)); }
    };

    const setPublished = async (row, publish) => {
        try {
            await v2Request({ method: 'post', url: `/organizations/${active.id}/stores/${row.id}/${publish ? 'publish' : 'unpublish'}` });
            await loadWorkspace(active.id);
            toast.success(publish ? c.publish : c.unpublish);
        } catch (error) { toast.error(errorMessage(error)); }
    };

    const searchCompanies = async (event) => {
        event.preventDefault();
        try {
            const response = await v2Request({ method: 'get', url: '/directory/organizations', params: { q: connectionQuery } });
            setDiscoveredCompanies((unwrap(response) ?? []).filter((company) => company.id !== active.id));
        } catch (error) { toast.error(errorMessage(error)); }
    };

    const requestConnection = async (targetOrganizationId) => {
        setConnectionBusy(`request-${targetOrganizationId}`);
        try {
            await v2Request({
                method: 'post',
                url: `/organizations/${active.id}/connections`,
                headers: { 'Idempotency-Key': `connection-${active.id}-${targetOrganizationId}-${Date.now()}` },
                data: { target_organization_id: targetOrganizationId, message: connectionMessage || null },
            });
            setConnectionMessage('');
            setDiscoveredCompanies([]);
            await loadWorkspace(active.id);
            toast.success(c.connect);
        } catch (error) { toast.error(errorMessage(error)); }
        finally { setConnectionBusy(null); }
    };

    const respondToConnection = async (connection, action) => {
        setConnectionBusy(`${action}-${connection.id}`);
        try {
            await v2Request({
                method: 'post',
                url: `/organizations/${active.id}/connections/${connection.id}/${action}`,
                headers: { 'Idempotency-Key': `connection-${action}-${connection.id}-${Date.now()}` },
            });
            await loadWorkspace(active.id);
            toast.success(action === 'accept' ? c.accept : c.reject);
        } catch (error) { toast.error(errorMessage(error)); }
        finally { setConnectionBusy(null); }
    };

    if (loading && !companies.length) return <div className="py-16 text-center text-sm text-slate-500">{c.loading}</div>;

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-12">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
                <div><h1 className="text-2xl font-bold text-[#0a2540]">{c.title}</h1><p className="mt-1 text-sm text-slate-500">{c.subtitle}</p></div>
                {companies.length > 1 && <label className="text-xs font-semibold text-slate-500">{c.choose}<select value={active?.id ?? ''} onChange={(e) => setActiveId(Number(e.target.value))} className="ms-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>}
            </header>

            {!active ? <form onSubmit={createCompany} className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><HiOutlineBuildingOffice2 className="mx-auto h-12 w-12 text-[#0b63ce]"/><h2 className="mt-4 text-lg font-bold text-slate-900">{c.noCompany}</h2><input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={c.companyName} className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3"/><button className="mt-3 w-full rounded-xl bg-[#0b63ce] px-4 py-3 font-semibold text-white">{c.createButton}</button></form> : <>
                <section className="grid gap-4 md:grid-cols-3">
                    {[[c.plan, subscription?.plan?.[i18n.language === 'ar' ? 'name_ar' : 'name_en'] || subscription?.plan?.slug, HiOutlineCheckCircle], [c.stores, `${subscription?.usage?.stores ?? stores.length} / ${subscription?.quotas?.stores ?? c.unlimited}`, HiOutlineShoppingBag], [c.seats, `${subscription?.usage?.seats ?? members.length} / ${subscription?.quotas?.seats ?? c.unlimited}`, HiOutlineUserGroup]].map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#eaf3ff] p-2.5 text-[#0b63ce]"><Icon className="h-5 w-5"/></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-[#0a2540]">{value}</p></div></div></div>)}
                </section>

                {canManage && <form onSubmit={saveProfile} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2"><div className="md:col-span-2 flex items-center justify-between"><h2 className="font-bold text-[#0a2540]">Company public profile</h2>{active.profile?.is_verified && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Verified</span>}</div><input value={profile.headline} onChange={(e) => setProfile({...profile,headline:e.target.value})} placeholder="Company headline" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><input type="url" value={profile.website} onChange={(e) => setProfile({...profile,website:e.target.value})} placeholder="https://company.example" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><textarea value={profile.about} onChange={(e) => setProfile({...profile,about:e.target.value})} placeholder="About the company" rows={3} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm md:col-span-2"/><input value={profile.capabilities} onChange={(e) => setProfile({...profile,capabilities:e.target.value})} placeholder="Capabilities, comma separated" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><textarea value={profile.locations} onChange={(e) => setProfile({...profile,locations:e.target.value})} placeholder="Location label|EG (one per line)" rows={2} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><textarea value={profile.certificates} onChange={(e) => setProfile({...profile,certificates:e.target.value})} placeholder="Certificate name|URL (one per line)" rows={2} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><textarea value={profile.featuredProducts} onChange={(e) => setProfile({...profile,featuredProducts:e.target.value})} placeholder="Featured product|URL (one per line)" rows={2} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><button className="rounded-xl bg-[#0b63ce] px-4 py-2.5 text-sm font-bold text-white md:col-span-2">Save public profile</button></form>}

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-[#0a2540]">{c.team}</h2><span className="text-xs text-slate-400">{members.length}</span></div><div className="space-y-2">{members.map((row) => <div key={row.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><div><p className="text-sm font-semibold text-slate-800">{row.user.name}</p><p className="text-xs text-slate-500">{row.user.email}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#0b63ce]">{row.role}</span></div>)}</div>{canManage && <form onSubmit={addMember} className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px_auto]"><input type="email" required value={member.email} onChange={(e) => setMember({...member,email:e.target.value})} placeholder={c.email} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><select value={member.role} onChange={(e) => setMember({...member,role:e.target.value})} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="member">Member</option><option value="manager">Manager</option><option value="admin">Admin</option></select><button title={c.addMember} className="rounded-xl bg-[#0b63ce] px-4 text-white"><HiOutlinePlus className="h-5 w-5"/></button></form>}</section>
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-[#0a2540]">{c.stores}</h2><span className="text-xs text-slate-400">{stores.length}</span></div><div className="space-y-2">{stores.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"><div><p className="text-sm font-semibold text-slate-800">{row.name}</p><p className="text-xs text-slate-500">{row.slug} · <span className={readiness[row.id]?.ready ? 'text-emerald-600' : 'text-amber-600'}>{readiness[row.id]?.ready ? c.ready : c.notReady}</span></p></div><div className="flex items-center gap-2">{row.is_primary && <HiOutlineCheckCircle className="h-5 w-5 text-emerald-500"/>}{canManage && <button type="button" disabled={row.status !== 'active' && !readiness[row.id]?.ready} onClick={() => setPublished(row, row.status !== 'active')} className="rounded-lg border border-[#0b63ce] px-3 py-1.5 text-xs font-bold text-[#0b63ce] disabled:cursor-not-allowed disabled:opacity-40">{row.status === 'active' ? c.unpublish : c.publish}</button>}</div></div>)}</div>{canManage && <form onSubmit={createStore} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input required value={store.name} onChange={(e) => setStore({...store,name:e.target.value})} placeholder={c.storeName} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><input required value={store.slug} onChange={(e) => setStore({...store,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')})} placeholder={c.slug} dir="ltr" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><button title={c.createStore} className="rounded-xl bg-[#0b63ce] px-4 text-white"><HiOutlinePlus className="h-5 w-5"/></button></form>}</section>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3"><span className="rounded-xl bg-[#eaf3ff] p-2.5 text-[#0b63ce]"><HiOutlineLink className="h-5 w-5"/></span><div><h2 className="font-bold text-[#0a2540]">{c.connections}</h2><p className="text-xs text-slate-400">{connections.length}</p></div></div>
                        {canManageConnections && <form onSubmit={searchCompanies} className="flex min-w-64 flex-1 gap-2 sm:max-w-md"><input value={connectionQuery} onChange={(event) => setConnectionQuery(event.target.value)} placeholder={c.searchCompanies} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><button title={c.findCompanies} className="rounded-xl bg-[#0b63ce] px-4 text-white"><HiOutlineMagnifyingGlass className="h-5 w-5"/></button></form>}
                    </div>
                    {discoveredCompanies.length > 0 && <div className="mb-5 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4"><input value={connectionMessage} onChange={(event) => setConnectionMessage(event.target.value)} placeholder={c.requestMessage} className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"/><div className="grid gap-2 md:grid-cols-2">{discoveredCompanies.map((company) => <div key={company.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{company.name}</p><p className="truncate text-xs text-slate-500">{company.headline || company.slug}</p></div><button type="button" disabled={connectionBusy === `request-${company.id}`} onClick={() => requestConnection(company.id)} className="shrink-0 rounded-lg border border-[#0b63ce] px-3 py-1.5 text-xs font-bold text-[#0b63ce] disabled:opacity-40">{c.connect}</button></div>)}</div></div>}
                    <div className="grid gap-3 md:grid-cols-2">{connections.map((connection) => <article key={connection.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-slate-800">{connection.organization?.name}</p>{connection.organization?.is_verified && <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-500"/>}</div><p className="text-xs text-slate-500">{connection.direction === 'incoming' ? c.incoming : c.outgoing} · {connection.status}</p>{connection.message && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{connection.message}</p>}</div>{canManageConnections && connection.status === 'pending' && connection.direction === 'incoming' && <div className="flex shrink-0 gap-1"><button type="button" title={c.accept} disabled={connectionBusy !== null} onClick={() => respondToConnection(connection, 'accept')} className="rounded-lg bg-emerald-600 p-2 text-white disabled:opacity-40"><HiOutlineCheckCircle className="h-4 w-4"/></button><button type="button" title={c.reject} disabled={connectionBusy !== null} onClick={() => respondToConnection(connection, 'reject')} className="rounded-lg bg-rose-600 p-2 text-white disabled:opacity-40"><HiOutlineXMark className="h-4 w-4"/></button></div>}</article>)}</div>
                    {!connections.length && !discoveredCompanies.length && <p className="py-6 text-center text-sm text-slate-400">{c.noConnections}</p>}
                </section>
            </>}
        </div>
    );
}
