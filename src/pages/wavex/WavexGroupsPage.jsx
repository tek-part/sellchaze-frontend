import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowPath,
    HiOutlineUserGroup,
    HiOutlinePlus,
    HiOutlineEye,
    HiOutlinePencilSquare,
    HiOutlineTrash,
} from 'react-icons/hi2';
import api from '../../api/client';

function getPaginatedRows(data) {
    const d = data?.data ?? data;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d)) return d;
    return [];
}

export default function WavexGroupsPage() {
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [selected, setSelected] = useState([]);
    const [busy, setBusy] = useState(false);

    const loadGroups = useCallback(async () => {
        setErr('');
        setLoading(true);
        try {
            const { data } = await api.get('/wavex/contact-groups', { params: { per_page: 200 } });
            setGroups(getPaginatedRows(data));
            setSelected([]);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!permissions.includes('wavex-access')) return;
        void loadGroups();
    }, [loadGroups, permissions]);

    const toggleSelect = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const toggleAll = () => {
        if (selected.length === groups.length) {
            setSelected([]);
        } else {
            setSelected(groups.map((g) => g.id));
        }
    };

    async function deleteGroup(id) {
        if (!confirm(t('wavex_cg_confirm_delete'))) return;
        setBusy(true);
        setErr('');
        try {
            await api.delete(`/wavex/contact-groups/${id}`);
            await loadGroups();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    }

    async function bulkDelete() {
        if (selected.length === 0) return;
        if (!confirm(t('wavex_cg_confirm_bulk_delete', { count: selected.length }))) return;
        setBusy(true);
        setErr('');
        try {
            await api.post('/wavex/contact-groups/bulk-destroy', { ids: selected });
            await loadGroups();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    }

    if (!can('wavex-access')) return <Navigate to="/dashboard" replace />;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <HiOutlineUserGroup className="h-8 w-8 text-brand" aria-hidden />
                        {t('wavex_groups_title')}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{t('wavex_groups_subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void loadGroups()}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <HiOutlineArrowPath className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        {t('wavex_groups_reload')}
                    </button>
                    <Link
                        to="/wavex/groups/new"
                        className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                        <HiOutlinePlus className="h-4 w-4" />
                        {t('wavex_cg_new_group')}
                    </Link>
                </div>
            </div>

            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}

            {selected.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
                >
                    <span className="text-sm font-medium text-red-800">
                        {t('wavex_cg_selected_count', { count: selected.length })}
                    </span>
                    <button
                        type="button"
                        onClick={bulkDelete}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        <HiOutlineTrash className="h-4 w-4" />
                        {t('wavex_cg_delete_selected')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelected([])}
                        className="text-xs font-medium text-red-700 hover:underline"
                    >
                        {t('wavex_cg_deselect_all')}
                    </button>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200/80 bg-white shadow-card"
            >
                {loading && groups.length === 0 ? (
                    <p className="p-6 text-sm text-slate-500">{t('loading')}</p>
                ) : groups.length === 0 ? (
                    <div className="p-10 text-center">
                        <HiOutlineUserGroup className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-2 text-sm text-slate-500">{t('wavex_cg_empty')}</p>
                        <Link
                            to="/wavex/groups/new"
                            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                        >
                            <HiOutlinePlus className="h-4 w-4" />
                            {t('wavex_cg_new_group')}
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs text-slate-600">
                                <tr>
                                    <th className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.length === groups.length && groups.length > 0}
                                            onChange={toggleAll}
                                            className="rounded-sm border-slate-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3">{t('wavex_cg_name')}</th>
                                    <th className="px-4 py-3">{t('wavex_cg_description')}</th>
                                    <th className="px-4 py-3 text-center">{t('wavex_cg_members_count')}</th>
                                    <th className="w-48 px-4 py-3 text-center">{t('wavex_cg_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {groups.map((g) => (
                                    <tr key={g.id} className={selected.includes(g.id) ? 'bg-brand/5' : 'hover:bg-slate-50'}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(g.id)}
                                                onChange={() => toggleSelect(g.id)}
                                                className="rounded-sm border-slate-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{g.name}</td>
                                        <td className="px-4 py-3 text-slate-500">{g.description || '\u2014'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                                                {g.members_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    to={`/wavex/groups/${g.id}`}
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand"
                                                    title={t('wavex_cg_view')}
                                                >
                                                    <HiOutlineEye className="h-4 w-4" />
                                                </Link>
                                                <Link
                                                    to={`/wavex/groups/${g.id}/edit`}
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand"
                                                    title={t('wavex_cg_edit')}
                                                >
                                                    <HiOutlinePencilSquare className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => void deleteGroup(g.id)}
                                                    disabled={busy}
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                    title={t('wavex_cg_delete')}
                                                >
                                                    <HiOutlineTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
