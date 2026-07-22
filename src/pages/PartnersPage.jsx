import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DelayedSpinner from '../components/DelayedSpinner';
import {
    HiOutlineEnvelope,
    HiOutlinePaperAirplane,
    HiOutlineUserGroup,
    HiOutlineGlobeAlt,
    HiOutlineBuildingStorefront,
    HiOutlineBuildingOffice2,
    HiOutlineMagnifyingGlass,
    HiOutlineInboxArrowDown,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineMapPin,
    HiCheckBadge,
    HiOutlineUsers,
} from 'react-icons/hi2';
import api from '../api/client';

export default function PartnersPage() {
    const { t } = useTranslation();
    const ctx = useOutletContext() || {};
    const { isAdmin = false, isSupplier = false } = ctx;
    const isMerchant = !isSupplier || isAdmin;

    const [data, setData] = useState({ suppliers: [], merchants: [], pending_invitations: [] });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(isAdmin ? 'supplier' : '');
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState(isSupplier && !isAdmin ? 'merchants' : 'suppliers');

    const load = useCallback(async () => {
        setLoading(true);
        setErr('');
        try {
            const { data: resp } = await api.get('/partners');
            setData({
                suppliers: resp.suppliers ?? [],
                merchants: resp.merchants ?? [],
                pending_invitations: resp.pending_invitations ?? [],
            });
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAct = async (inv, action) => {
        try {
            await api.post(`/partners/invitations/${inv.id}/${action}`);
            toast.success(t(action === 'accept' ? 'partners_invite_accepted' : 'partners_invite_rejected'));
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    };

    const handleInvite = async (event) => {
        event.preventDefault();
        if (!email.trim()) {
            toast.error(t('partners_invite_email_required'));
            return;
        }
        setSending(true);
        try {
            const payload = { email: email.trim() };
            if (isAdmin && role) payload.invited_role = role;
            await api.post('/partners/invite', payload);
            toast.success(t('partners_invite_sent'));
            setEmail('');
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSending(false);
        }
    };

    const filterRows = (rows) => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) =>
            (r.name || '').toLowerCase().includes(q) ||
            (r.email || '').toLowerCase().includes(q) ||
            (r.username || '').toLowerCase().includes(q) ||
            (r.company || '').toLowerCase().includes(q)
        );
    };

    const filteredSuppliers = useMemo(() => filterRows(data.suppliers), [data.suppliers, search]);
    const filteredMerchants = useMemo(() => filterRows(data.merchants), [data.merchants, search]);
    const incoming = useMemo(() => data.pending_invitations.filter((i) => i.direction === 'incoming'), [data.pending_invitations]);
    const outgoing = useMemo(() => data.pending_invitations.filter((i) => i.direction !== 'incoming'), [data.pending_invitations]);

    const showSuppliersTab = isMerchant;
    const showMerchantsTab = isSupplier || isAdmin;

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-brand/10 via-white to-fuchsia-50 p-6 shadow-xs md:p-8">
                <div className="pointer-events-none absolute -inset-e-10 -top-10 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -inset-s-10 h-48 w-48 rounded-full bg-fuchsia-200/40 blur-3xl" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand shadow-xs ring-1 ring-brand/10">
                            <HiOutlineUsers className="h-3.5 w-3.5" aria-hidden />
                            {t('partners_title')}
                        </div>
                        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                            {t('partners_title')}
                        </h1>
                        <p className="mt-1 max-w-xl text-sm text-slate-600">{t('partners_subtitle')}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <MiniStat icon={HiOutlineBuildingStorefront} value={data.suppliers.length} label={t('partners_my_suppliers')} gradient="from-emerald-500 to-teal-500" />
                        <MiniStat icon={HiOutlineBuildingOffice2} value={data.merchants.length} label={t('partners_my_merchants')} gradient="from-amber-500 to-orange-500" />
                        <MiniStat icon={HiOutlineInboxArrowDown} value={incoming.length} label={t('partners_incoming_invitations')} gradient="from-sky-500 to-indigo-500" />
                    </div>
                </div>
            </div>

            {err ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            ) : null}

            {/* Incoming invitations */}
            {incoming.length > 0 ? (
                <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-xs">
                    <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white">
                            <HiOutlineInboxArrowDown className="h-4 w-4" aria-hidden />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900">{t('partners_incoming_invitations')}</h2>
                        <span className="ms-1 rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-white">{incoming.length}</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {incoming.map((inv) => (
                            <div key={inv.id} className="flex items-start gap-3 rounded-2xl border border-white bg-white p-4 shadow-xs">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-indigo-500 text-white font-bold">
                                    {(inv.sender?.name || inv.email || '?')[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900">{inv.sender?.name || inv.sender?.email || '—'}</p>
                                    <p className="text-xs text-slate-500">{t('partners_wants_to_connect_as', { role: inv.invited_role })}</p>
                                    <p className="mt-0.5 text-[11px] text-slate-400">{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}</p>
                                    <div className="mt-2 flex gap-2">
                                        <button type="button" onClick={() => handleAct(inv, 'accept')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-600">
                                            <HiOutlineCheckCircle className="h-3.5 w-3.5" aria-hidden />
                                            {t('partners_accept') || 'Accept'}
                                        </button>
                                        <button type="button" onClick={() => handleAct(inv, 'reject')} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                                            <HiOutlineXCircle className="h-3.5 w-3.5" aria-hidden />
                                            {t('partners_reject') || 'Reject'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Invite card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <HiOutlinePaperAirplane className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">{t('partners_invite_section_title')}</h2>
                        <p className="text-xs text-slate-500">{t('partners_invite_section_subtitle')}</p>
                    </div>
                </div>
                <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
                    <label className="min-w-[260px] flex-1">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{t('partners_invite_email')}</span>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                            <HiOutlineEnvelope className="h-4 w-4 text-slate-400" aria-hidden />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="flex-1 bg-transparent text-sm outline-hidden" />
                        </div>
                    </label>
                    {isAdmin ? (
                        <label>
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{t('partners_invite_role')}</span>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                                <option value="supplier">{t('role_supplier')}</option>
                                <option value="merchant">{t('role_merchant')}</option>
                            </select>
                        </label>
                    ) : (
                        <p className="text-xs text-slate-500">{isSupplier ? t('partners_auto_role_supplier_hint') : t('partners_auto_role_merchant_hint')}</p>
                    )}
                    <button type="submit" disabled={sending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand/90 disabled:opacity-50">
                        {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <HiOutlinePaperAirplane className="h-4 w-4" aria-hidden />}
                        {t('partners_invite_submit')}
                    </button>
                </form>
            </div>

            {/* Partners tabs */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
                    <div className="flex gap-1">
                        {showSuppliersTab ? (
                            <TabButton active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} count={data.suppliers.length} icon={HiOutlineBuildingStorefront}>
                                {t('partners_my_suppliers')}
                            </TabButton>
                        ) : null}
                        {showMerchantsTab ? (
                            <TabButton active={activeTab === 'merchants'} onClick={() => setActiveTab('merchants')} count={data.merchants.length} icon={HiOutlineBuildingOffice2}>
                                {t('partners_my_merchants')}
                            </TabButton>
                        ) : null}
                    </div>
                    <div className="relative flex-1 md:max-w-xs">
                        <HiOutlineMagnifyingGlass className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('search_placeholder') || 'Search…'}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 ps-9 pe-3 text-sm outline-hidden transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                    </div>
                </div>

                <div className="p-4">
                    {loading ? (
                        <DelayedSpinner className="h-40" />
                    ) : activeTab === 'suppliers' ? (
                        <PartnerGrid rows={filteredSuppliers} role="supplier" t={t} emptyLabel={t('partners_empty_suppliers')} />
                    ) : (
                        <PartnerGrid rows={filteredMerchants} role="merchant" t={t} emptyLabel={t('partners_empty_merchants')} />
                    )}
                </div>
            </div>

            {/* Outgoing invitations */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <HiOutlineClock className="h-4 w-4" aria-hidden />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">{t('partners_pending_invitations')}</h2>
                    <span className="ms-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{outgoing.length}</span>
                </div>
                <div className="p-4">
                    {outgoing.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-400">{t('partners_empty_invitations')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-start text-sm">
                                <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2 text-start">{t('partners_invite_email')}</th>
                                        <th className="px-3 py-2 text-start">{t('partners_invite_role')}</th>
                                        <th className="px-3 py-2 text-start">{t('col_status')}</th>
                                        <th className="px-3 py-2 text-start">{t('col_date')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {outgoing.map((inv) => (
                                        <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                            <td className="px-3 py-2.5 text-slate-800">{inv.email}</td>
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    inv.invited_role === 'supplier' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {inv.invited_role}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{inv.status}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-500">{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MiniStat({ icon: Icon, value, label, gradient }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-white bg-white/90 p-3 shadow-xs backdrop-blur-sm min-w-[100px]">
            <div className={`absolute -inset-e-4 -top-4 h-14 w-14 rounded-full bg-linear-to-br ${gradient} opacity-15 blur-xl`} />
            <div className="relative flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br ${gradient} text-white`}>
                    <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 text-start">
                    <p className="text-lg font-bold leading-none text-slate-900">{value}</p>
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, children, count, icon: Icon }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
            {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
            {children}
            <span className={`ms-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>{count}</span>
        </button>
    );
}

function PartnerGrid({ rows, role, t, emptyLabel }) {
    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                    <HiOutlineUserGroup className="h-8 w-8" aria-hidden />
                </div>
                <p className="text-sm text-slate-400">{emptyLabel}</p>
            </div>
        );
    }
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((u) => <PartnerCard key={u.id} u={u} role={role} t={t} />)}
        </div>
    );
}

function PartnerCard({ u, role, t }) {
    const initials = (u.name || u.email || '?').trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
    const roleColor = role === 'supplier' ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-orange-500';
    const roleBadge = role === 'supplier'
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-amber-50 text-amber-700 ring-amber-200';
    const location = [u.city, u.country].filter(Boolean).join(', ');

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
            <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${roleColor}`} />
            <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                    {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white shadow-sm" />
                    ) : (
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${roleColor} font-bold text-white shadow-sm`}>
                            {initials || '?'}
                        </div>
                    )}
                    {!u.is_active ? (
                        <span className="absolute -bottom-1 -inset-e-1 h-4 w-4 rounded-full border-2 border-white bg-slate-400" title={t('partners_inactive')} />
                    ) : (
                        <span className="absolute -bottom-1 -inset-e-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-slate-900">{u.name}</p>
                        {u.is_verified ? <HiCheckBadge className="h-4 w-4 shrink-0 text-blue-500" title={t('verified_account')} /> : null}
                    </div>
                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                    {u.username ? <p className="truncate text-xs text-slate-400">@{u.username}</p> : null}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${roleBadge}`}>
                            {role === 'supplier' ? t('role_supplier') : t('role_merchant')}
                        </span>
                        {!u.is_active ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{t('partners_inactive')}</span>
                        ) : null}
                    </div>
                    {(u.company || location) ? (
                        <div className="mt-2 space-y-0.5 text-[11px] text-slate-500">
                            {u.company ? (
                                <p className="flex items-center gap-1 truncate"><HiOutlineBuildingOffice2 className="h-3 w-3 shrink-0" aria-hidden />{u.company}</p>
                            ) : null}
                            {location ? (
                                <p className="flex items-center gap-1 truncate"><HiOutlineMapPin className="h-3 w-3 shrink-0" aria-hidden />{location}</p>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
                {u.username ? (
                    <a
                        href={`/u/${encodeURIComponent(u.username)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('view_public_profile')}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
                    >
                        <HiOutlineGlobeAlt className="h-3.5 w-3.5" aria-hidden />
                        {t('view_public_profile')}
                    </a>
                ) : (
                    <span className="text-[11px] text-slate-400">{t('partners_no_public_profile') || 'No public profile'}</span>
                )}
            </div>
        </div>
    );
}
