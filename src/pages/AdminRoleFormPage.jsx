import { useCallback, useEffect, useMemo, useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Navigate, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import api from '../api/client';
import { ROLES_OMITTED_FROM_ADMIN_ROLES_INDEX } from '../config/rolesUi';

function unwrapRole(payload) {
    if (!payload) return null;
    return payload.data ?? payload;
}

export default function AdminRoleFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAdmin } = useOutletContext();

    const [name, setName] = useState('');
    const [groups, setGroups] = useState([]);
    const [selected, setSelected] = useState(() => new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const togglePerm = useCallback((permName) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(permName)) {
                next.delete(permName);
            } else {
                next.add(permName);
            }
            return next;
        });
    }, []);

    const selectAllInGroup = useCallback((permNames) => {
        setSelected((prev) => {
            const next = new Set(prev);
            permNames.forEach((n) => next.add(n));
            return next;
        });
    }, []);

    const clearGroup = useCallback((permNames) => {
        setSelected((prev) => {
            const next = new Set(prev);
            permNames.forEach((n) => next.delete(n));
            return next;
        });
    }, []);

    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }
        let active = true;
        setLoading(true);
        setErr('');
        const run = async () => {
            try {
                if (isEdit) {
                    const { data } = await api.get(`/admin/roles/${id}`);
                    if (!active) return;
                    const row = unwrapRole(data);
                    setGroups(Array.isArray(data.permission_groups) ? data.permission_groups : []);
                    setName(row?.name ?? '');
                    setSelected(new Set(Array.isArray(row?.permissions) ? row.permissions : []));
                } else {
                    const { data } = await api.get('/admin/roles');
                    if (!active) return;
                    setGroups(Array.isArray(data.permission_groups) ? data.permission_groups : []);
                    setName('');
                    setSelected(new Set());
                }
            } catch (e) {
                if (active) setErr(e.response?.data?.message || e.message);
            } finally {
                if (active) setLoading(false);
            }
        };
        void run();
        return () => {
            active = false;
        };
    }, [isAdmin, isEdit, id]);

    const groupLabel = useMemo(
        () => (key) => {
            const k = `perm_group_${key}`;
            const label = t(k);
            return label === k ? key : label;
        },
        [t],
    );

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr('');
        try {
            const payload = {
                name: name.trim(),
                permissions: Array.from(selected),
            };
            if (isEdit) {
                await api.patch(`/admin/roles/${id}`, payload);
            } else {
                await api.post('/admin/roles', payload);
            }
            navigate('/admin/roles');
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

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">{t('loading')}</div>
        );
    }

    if (isEdit && ROLES_OMITTED_FROM_ADMIN_ROLES_INDEX.includes(String(name ?? ''))) {
        return <Navigate to="/admin/roles" replace />;
    }

    return (
        <div className="space-y-6">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {isEdit ? t('role_form_title_edit') : t('role_form_title_new')}
                </h1>
                <p className="mt-1 text-sm text-slate-500">{t('role_permissions_hint')}</p>
            </div>
            {err ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
            <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5">
                <label className="block max-w-md">
                    <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{t('role_name_label')}</span>
                    <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isEdit && name === 'Admin'}
                    />
                </label>

                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-slate-800">{t('permissions')}</h2>
                    <div className="space-y-2">
                        {groups.map((g) => {
                            const names = (g.permissions || []).map((p) => p.name);
                            return (
                                <Disclosure key={g.key} defaultOpen={names.length <= 8}>
                                    {({ open }) => (
                                        <div className="rounded-xl border border-slate-200/90">
                                            <DisclosureButton className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-start text-sm font-medium text-slate-800 hover:bg-slate-50/80">
                                                <span>{groupLabel(g.key)}</span>
                                                <span className="flex shrink-0 items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(ev) => {
                                                            ev.preventDefault();
                                                            ev.stopPropagation();
                                                            selectAllInGroup(names);
                                                        }}
                                                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-brand"
                                                    >
                                                        {t('perm_select_all')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(ev) => {
                                                            ev.preventDefault();
                                                            ev.stopPropagation();
                                                            clearGroup(names);
                                                        }}
                                                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600"
                                                    >
                                                        {t('perm_deselect_all')}
                                                    </button>
                                                    <HiOutlineChevronDown
                                                        className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
                                                    />
                                                </span>
                                            </DisclosureButton>
                                            <DisclosurePanel className="border-t border-slate-100 px-3 py-3">
                                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                    {(g.permissions || []).map((p) => (
                                                        <label
                                                            key={p.id}
                                                            className="inline-flex min-w-48 max-w-full cursor-pointer items-center gap-2 text-sm"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selected.has(p.name)}
                                                                onChange={() => togglePerm(p.name)}
                                                                className="rounded-sm border-slate-300 text-brand focus:ring-brand/30"
                                                            />
                                                            <span className="font-mono text-xs text-slate-700">{p.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                {names.length === 0 ? (
                                                    <p className="text-xs text-slate-400">{t('empty')}</p>
                                                ) : null}
                                            </DisclosurePanel>
                                        </div>
                                    )}
                                </Disclosure>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {t('product_form_save')}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/roles')}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
