import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineBriefcase,
    HiOutlineCalendarDays,
    HiOutlineClock,
    HiOutlineMapPin,
    HiOutlinePencilSquare,
    HiOutlineShieldCheck,
    HiOutlineBell,
    HiOutlineUser,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../api/client';
import { impersonateUserId } from '../utils/impersonationApi';
import UserAvatar from '../components/UserAvatar';
import PaginationBar from '../components/table/PaginationBar';

function unwrapUser(payload) {
    if (!payload) return null;
    return payload.data ?? payload;
}

export default function AdminUserDetailPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const { isAdmin, me, permissions = [] } = useOutletContext() ?? {};
    const can = (p) => permissions.includes(p);
    const canViewStaffAdmin = can('users-list') || can('users-pending-list');
    const canApproveRegistration = can('users-edit') && can('users-pending-list');
    const canViewMonitoring = isAdmin || can('monitoring-live-view');
    const [user, setUser] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [sessionsMeta, setSessionsMeta] = useState(null);
    const [sessionsPage, setSessionsPage] = useState(1);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [approving, setApproving] = useState(false);
    const [approvalRole, setApprovalRole] = useState('Staff');
    const [impersonateLoading, setImpersonateLoading] = useState(false);
    const [notifRows, setNotifRows] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setErr('');
        api
            .get(`/admin/users/${id}`)
            .then(({ data }) => {
                if (!active) return;
                setUser(unwrapUser(data));
            })
            .catch((e) => {
                if (!active) return;
                setErr(e.response?.data?.message || e.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [id]);

    useEffect(() => {
        if (user?.pending_approval && (user.registration_role === 'Staff' || user.registration_role === 'Supplier')) {
            setApprovalRole(user.registration_role);
        } else if (user && !user.pending_approval) {
            setApprovalRole('Staff');
        }
    }, [user]);

    useEffect(() => {
        let active = true;
        const userId = user?.id != null ? String(user.id) : '';
        if (!id || user?.pending_approval || userId !== String(id)) {
            if (userId !== String(id)) setNotifRows([]);
            return () => {
                active = false;
            };
        }
        setNotifLoading(true);
        void api
            .get(`/admin/users/${id}/notification-preferences`)
            .then(({ data }) => {
                if (!active) return;
                setNotifRows(data?.data?.preferences ?? []);
            })
            .catch(() => {
                if (active) setNotifRows([]);
            })
            .finally(() => {
                if (active) setNotifLoading(false);
            });
        return () => {
            active = false;
        };
    }, [id, user?.id, user?.pending_approval]);

    useEffect(() => {
        let active = true;
        if (!canViewMonitoring) return () => {};
        setSessionsLoading(true);
        api
            .get('/admin/monitoring/sessions', { params: { user_id: id, page: sessionsPage, per_page: 8 } })
            .then(({ data }) => {
                if (!active) return;
                setSessions(data.data || []);
                setSessionsMeta(data.meta || null);
            })
            .catch(() => {
                if (!active) return;
                setSessions([]);
                setSessionsMeta(null);
            })
            .finally(() => {
                if (active) setSessionsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [id, canViewMonitoring, sessionsPage]);

    if (!canViewStaffAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">{t('loading')}</div>
        );
    }

    if (err || !user) {
        return (
            <div className="space-y-4">
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err || t('empty')}</p>
                <Link to="/admin/users" className="text-sm font-medium text-brand hover:underline">
                    {t('back_to_list')}
                </Link>
            </div>
        );
    }

    const p = user.profile || {};
    const showUserEditLink =
        can('users-edit') && (user.pending_approval ? can('users-pending-list') : can('users-list'));

    async function approveRegistration() {
        setApproving(true);
        try {
            await api.patch(`/admin/users/${id}`, {
                approve_pending_registration: true,
                approval_role: approvalRole,
            });
            toast.success(t('admin_user_approved_toast'));
            const { data } = await api.get(`/admin/users/${id}`);
            setUser(unwrapUser(data));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setApproving(false);
        }
    }

    return (
        <div className="space-y-6">
            {user.pending_approval ? (
                <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <p>
                        {t('admin_user_pending_banner', {
                            role: user.registration_role || '—',
                        })}
                    </p>
                    {canApproveRegistration ? (
                        <>
                            <p className="font-semibold text-amber-900">{t('admin_user_approval_pick_role')}</p>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        name="approval-role"
                                        checked={approvalRole === 'Staff'}
                                        onChange={() => setApprovalRole('Staff')}
                                        className="text-amber-800"
                                    />
                                    {t('auth_role_staff')}
                                </label>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        name="approval-role"
                                        checked={approvalRole === 'Supplier'}
                                        onChange={() => setApprovalRole('Supplier')}
                                        className="text-amber-800"
                                    />
                                    {t('auth_role_supplier')}
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={() => void approveRegistration()}
                                disabled={approving}
                                className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
                            >
                                {approving ? '…' : t('admin_user_approve_registration')}
                            </button>
                        </>
                    ) : (
                        <p className="text-xs text-amber-900">{t('admin_user_pending_no_approve_perm')}</p>
                    )}
                </div>
            ) : null}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <UserAvatar user={user} sizeClass="h-16 w-16" alt={user.name || ''} />
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{user.name}</h1>
                            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {user.is_active ? t('status_active') : t('status_inactive')}
                                </span>
                                <span className="inline-flex rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand-dark">
                                    {(Array.isArray(user.roles) ? user.roles.join(', ') : '—') || '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {showUserEditLink ? (
                            <Link
                                to={`/admin/users/${id}/edit`}
                                className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white"
                            >
                                <HiOutlinePencilSquare className="h-4 w-4" />
                                {t('action_edit')}
                            </Link>
                        ) : null}
                        {!user.pending_approval && user.is_active !== false && me?.id !== user.id ? (
                            <button
                                type="button"
                                disabled={impersonateLoading}
                                onClick={async () => {
                                    setImpersonateLoading(true);
                                    await impersonateUserId(user.id, t);
                                    setImpersonateLoading(false);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
                            >
                                <HiOutlineUser className="h-4 w-4" />
                                {impersonateLoading ? '…' : t('impersonation_sign_in_as')}
                            </button>
                        ) : null}
                        <Link to="/admin/users" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            {t('back_to_list')}
                        </Link>
                    </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        icon={HiOutlineShieldCheck}
                        label={t('col_status')}
                        value={user.is_active ? t('status_active') : t('status_inactive')}
                    />
                    <MetricCard
                        icon={HiOutlineCalendarDays}
                        label={t('col_last_login')}
                        value={user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—'}
                    />
                    <MetricCard
                        icon={HiOutlineMapPin}
                        label={t('last_login_ip')}
                        value={user.last_login_ip || '—'}
                    />
                    <MetricCard
                        icon={HiOutlineCalendarDays}
                        label={t('created_at')}
                        value={user.created_at ? new Date(user.created_at).toLocaleString() : '—'}
                    />
                </div>
            </div>

            {can('users-list') && !user.pending_approval && user && String(user.id) === String(id) ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            <HiOutlineBell className="h-4 w-4" />
                            {t('notif_pref_section_title')}
                        </h2>
                        <Link
                            to={`/admin/users/${id}/edit#notification-preferences`}
                            className="text-xs font-semibold text-brand hover:underline"
                        >
                            {t('action_edit')}
                        </Link>
                    </div>
                    {notifLoading ? (
                        <p className="text-xs text-slate-500">{t('loading')}</p>
                    ) : notifRows.length === 0 ? (
                        <p className="text-xs text-slate-500">{t('notif_pref_empty')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                                        <th className="py-2 pe-4">{t('col_name')}</th>
                                        <th className="py-2 pe-4">{t('notif_pref_col_in_app')}</th>
                                        <th className="py-2">{t('notif_pref_col_email')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifRows.map((row) => (
                                        <tr key={row.key} className="border-b border-slate-100">
                                            <td className="py-2 pe-4 text-slate-800">{t(row.label_key)}</td>
                                            <td className="py-2 pe-4 text-slate-600">{row.in_app ? t('yes') : t('no')}</td>
                                            <td className="py-2 text-slate-600">{row.email ? t('yes') : t('no')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : null}


            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                    <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        <HiOutlineUser className="h-4 w-4" />
                        {t('staff_account_section')}
                    </h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">{t('roles')}</dt>
                            <dd>{Array.isArray(user.roles) ? user.roles.join(', ') : '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">{t('col_last_login')}</dt>
                            <dd>{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">{t('created_at')}</dt>
                            <dd>{user.created_at ? new Date(user.created_at).toLocaleString() : '—'}</dd>
                        </div>
                    </dl>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                    <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        <HiOutlineBriefcase className="h-4 w-4" />
                        {t('staff_profile_section')}
                    </h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">{t('profile_username')}</dt>
                            <dd>{p.username || '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">{t('profile_phone')}</dt>
                            <dd>{p.phone || '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">{t('profile_company')}</dt>
                            <dd>{p.company || '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">{t('profile_city')}</dt>
                            <dd>{p.city || '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">{t('profile_country')}</dt>
                            <dd>{p.country || '—'}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {canViewMonitoring ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            <HiOutlineClock className="h-4 w-4" />
                            {t('monitoring_sessions_title')}
                        </h2>
                    </div>
                    <div className="relative min-h-40 overflow-auto px-5 py-4">
                        {sessions.length === 0 && !sessionsLoading ? (
                            <p className="py-8 text-center text-sm text-slate-500">{t('empty')}</p>
                        ) : null}
                        <div className="space-y-2">
                            {sessions.map((s) => (
                                <div key={s.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {dayNameLabel(s.day_name, t)} · {secondsToClock(s.duration_seconds || 0)}
                                        </p>
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                            }`}
                                        >
                                            {s.is_active ? t('monitoring_status_active') : t('monitoring_status_inactive')}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-600">
                                        {t('monitoring_session_start')}: {s.started_at ? new Date(s.started_at).toLocaleString() : '—'}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        {t('monitoring_session_end')}: {s.ended_at ? new Date(s.ended_at).toLocaleString() : '—'}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        {t('monitoring_col_device')}: {s.device_name || '—'} · {t('monitoring_col_browser')}: {s.browser || '—'} · IP: {s.ip_address || '—'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <PaginationBar meta={sessionsMeta} onPageChange={setSessionsPage} loading={sessionsLoading} />
                </div>
            ) : null}
        </div>
    );
}

function MetricCard({ icon: Icon, label, value }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{value || '—'}</p>
        </div>
    );
}

function secondsToClock(value) {
    const total = Math.max(0, Number(value || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function dayNameLabel(dayName, t) {
    const map = {
        Monday: t('day_monday'),
        Tuesday: t('day_tuesday'),
        Wednesday: t('day_wednesday'),
        Thursday: t('day_thursday'),
        Friday: t('day_friday'),
        Saturday: t('day_saturday'),
        Sunday: t('day_sunday'),
    };

    return map[dayName] || dayName || '—';
}
