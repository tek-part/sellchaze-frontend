import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineBell, HiOutlineEnvelope, HiOutlineKey, HiOutlineUser } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../api/client';
import { ROLES_OMITTED_FROM_STAFF_USER_ROLE_PICKER } from '../config/rolesUi';

function unwrapUser(payload) {
    if (!payload) return null;
    return payload.data ?? payload;
}

export default function AdminUserFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions = [] } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const canAccessForm = isEdit
        ? can('users-edit') && (can('users-list') || can('users-pending-list'))
        : can('users-create') && can('users-list');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [roleNames, setRoleNames] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [profile, setProfile] = useState({
        username: '',
        phone: '',
        company: '',
        city: '',
        country: '',
        address: '',
        biography: '',
    });

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(isEdit);
    const [notifRows, setNotifRows] = useState([]);
    const [notifDraft, setNotifDraft] = useState({});
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifSaving, setNotifSaving] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data: rolesPayload } = await api.get('/admin/staff-role-options');
                const staff = Array.isArray(rolesPayload?.data) ? rolesPayload.data : [];
                if (!active) return;
                setRoleNames(staff.map((r) => r.name).filter(Boolean));

                if (isEdit) {
                    const { data: userData } = await api.get(`/admin/users/${id}`);
                    const u = unwrapUser(userData);
                    if (!active || !u) return;
                    setName(u.name || '');
                    setEmail(u.email || '');
                    setIsActive(u.is_active !== false);
                    setSelectedRoles(
                        Array.isArray(u.roles)
                            ? u.roles.filter((r) => !ROLES_OMITTED_FROM_STAFF_USER_ROLE_PICKER.includes(r))
                            : [],
                    );
                    const pr = u.profile || {};
                    setProfile({
                        username: pr.username || '',
                        phone: pr.phone || '',
                        company: pr.company || '',
                        city: pr.city || '',
                        country: pr.country || '',
                        address: pr.address || '',
                        biography: pr.biography || '',
                    });
                    setNotifLoading(true);
                    try {
                        const { data: prefRes } = await api.get(`/admin/users/${id}/notification-preferences`);
                        const prefs = prefRes?.data?.preferences ?? [];
                        if (!active) return;
                        setNotifRows(Array.isArray(prefs) ? prefs : []);
                        const d = {};
                        (Array.isArray(prefs) ? prefs : []).forEach((p) => {
                            d[p.key] = { in_app: !!p.in_app, email: !!p.email };
                        });
                        setNotifDraft(d);
                    } catch {
                        if (active) {
                            setNotifRows([]);
                            setNotifDraft({});
                        }
                    } finally {
                        if (active) setNotifLoading(false);
                    }
                }
            } catch (e) {
                if (!active) return;
                setErr(e.response?.data?.message || e.message);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [id, isEdit]);

    const profilePayload = useMemo(() => {
        const o = {};
        if (profile.username) o.username = profile.username;
        if (profile.phone) o.phone = profile.phone;
        if (profile.company) o.company = profile.company;
        if (profile.city) o.city = profile.city;
        if (profile.country) o.country = profile.country;
        if (profile.address) o.address = profile.address;
        if (profile.biography) o.biography = profile.biography;
        return Object.keys(o).length ? o : undefined;
    }, [profile]);

    const toggleRole = (r) => {
        setSelectedRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
    };


    const saveNotificationPreferences = async () => {
        if (!isEdit || !id) return;
        setNotifSaving(true);
        try {
            await api.patch(`/admin/users/${id}/notification-preferences`, { preferences: notifDraft });
            toast.success(t('notif_pref_saved_toast'));
            const { data: prefRes } = await api.get(`/admin/users/${id}/notification-preferences`);
            const prefs = prefRes?.data?.preferences ?? [];
            setNotifRows(Array.isArray(prefs) ? prefs : []);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setNotifSaving(false);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr('');
        try {
            if (!isEdit) {
                if (!password || password.length < 8) {
                    setErr(t('password_min_length'));
                    setSaving(false);
                    return;
                }
                await api.post('/admin/users', {
                    name,
                    email,
                    password,
                    is_active: isActive,
                    roles: selectedRoles,
                    ...(profilePayload ? { profile: profilePayload } : {}),
                });
                navigate('/admin/users');
                return;
            }
            const body = {
                name,
                email,
                roles: selectedRoles,
                ...(password ? { password } : {}),
                ...(profilePayload ? { profile: profilePayload } : {}),
            };
            await api.patch(`/admin/users/${id}`, body);
            navigate(`/admin/users/${id}`);
        } catch (e2) {
            const msg = e2.response?.data?.message;
            const errors = e2.response?.data?.errors;
            if (errors && typeof errors === 'object') {
                setErr(Object.values(errors).flat().join(' ') || msg || e2.message);
            } else {
                setErr(msg || e2.message);
            }
        } finally {
            setSaving(false);
        }
    };

    if (!canAccessForm) {
        return <Navigate to="/dashboard" replace />;
    }

    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">{t('loading')}</div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {isEdit ? t('staff_user_edit') : t('staff_user_create')}
                </h1>
            </div>
            {err ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
            <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500">
                            <HiOutlineUser className="h-4 w-4" />
                            {t('col_name')}
                        </span>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500">
                            <HiOutlineEnvelope className="h-4 w-4" />
                            {t('email')}
                        </span>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500">
                        <HiOutlineKey className="h-4 w-4" />
                        {t('password')}
                    </span>
                    <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isEdit ? t('password_optional') : ''}
                        required={!isEdit}
                    />
                </label>
                {!isEdit ? (
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        {t('col_status')} — {t('status_active')}
                    </label>
                ) : null}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{t('roles')}</p>
                    <div className="flex flex-wrap gap-2">
                        {roleNames.map((r) => (
                            <label key={r} className="inline-flex items-center gap-1 rounded-sm border border-slate-200 px-2 py-1 text-xs">
                                <input type="checkbox" checked={selectedRoles.includes(r)} onChange={() => toggleRole(r)} />
                                <span>{r}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <span className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('profile_username')}</span>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={profile.username}
                            onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('profile_phone')}</span>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={profile.phone}
                            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                        />
                    </label>
                    <label className="block md:col-span-2">
                        <span className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('profile_company')}</span>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={profile.company}
                            onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('profile_city')}</span>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={profile.city}
                            onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('profile_country')}</span>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={profile.country}
                            onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                        />
                    </label>
                    <label className="block md:col-span-2">
                        <span className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('profile_address')}</span>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={profile.address}
                            onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                        />
                    </label>
                </div>

                {isEdit && notifRows.length > 0 ? (
                    <div id="notification-preferences" className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 ring-1 ring-slate-100">
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <HiOutlineBell className="h-4 w-4 text-brand" aria-hidden />
                            {t('notif_pref_section_title')}
                        </h2>
                        <p className="mb-4 text-xs text-slate-500">{t('notif_pref_section_hint')}</p>
                        {notifLoading ? (
                            <p className="text-xs text-slate-500">{t('loading')}</p>
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
                                                <td className="py-2 pe-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!notifDraft[row.key]?.in_app}
                                                        onChange={(e) =>
                                                            setNotifDraft((prev) => ({
                                                                ...prev,
                                                                [row.key]: {
                                                                    ...prev[row.key],
                                                                    in_app: e.target.checked,
                                                                    email: !!prev[row.key]?.email,
                                                                },
                                                            }))
                                                        }
                                                        className="h-4 w-4 rounded-sm border-slate-300 text-brand"
                                                    />
                                                </td>
                                                <td className="py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!notifDraft[row.key]?.email}
                                                        onChange={(e) =>
                                                            setNotifDraft((prev) => ({
                                                                ...prev,
                                                                [row.key]: {
                                                                    ...prev[row.key],
                                                                    in_app: !!prev[row.key]?.in_app,
                                                                    email: e.target.checked,
                                                                },
                                                            }))
                                                        }
                                                        className="h-4 w-4 rounded-sm border-slate-300 text-brand"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="mt-4">
                            <button
                                type="button"
                                disabled={notifSaving || notifLoading}
                                onClick={() => void saveNotificationPreferences()}
                                className="rounded-lg border border-brand bg-white px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/5 disabled:opacity-50"
                            >
                                {notifSaving ? '…' : t('notif_pref_save')}
                            </button>
                        </div>
                    </div>
                ) : null}
                <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        {t('product_form_save')}
                    </button>
                    <button type="button" onClick={() => navigate(isEdit ? `/admin/users/${id}` : '/admin/users')} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
                        {t('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
