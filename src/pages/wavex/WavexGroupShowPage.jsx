import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineUserGroup,
    HiOutlineArrowLeft,
    HiOutlinePencilSquare,
    HiOutlineArrowPath,
    HiOutlineTrash,
} from 'react-icons/hi2';
import api from '../../api/client';

function getPaginatedRows(data) {
    const d = data?.data ?? data;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d)) return d;
    return [];
}

export default function WavexGroupShowPage() {
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const can = (p) => permissions.includes(p);

    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(false);
    const [err, setErr] = useState('');
    const [importBusy, setImportBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [importWaBanner, setImportWaBanner] = useState('');

    useEffect(() => {
        const w = location.state?.importWarning;
        if (!w) {
            return;
        }
        setImportWaBanner(String(w));
        navigate(location.pathname, { replace: true, state: {} });
    }, [location.pathname, location.state?.importWarning, navigate]);

    const loadGroup = useCallback(async () => {
        setErr('');
        setLoading(true);
        try {
            const { data } = await api.get(`/wavex/contact-groups/${id}`);
            setGroup(data?.data ?? data);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadMembers = useCallback(async () => {
        setMembersLoading(true);
        try {
            const { data } = await api.get(`/wavex/contact-groups/${id}/members`, { params: { per_page: 500 } });
            setMembers(getPaginatedRows(data));
        } catch {
            setMembers([]);
        } finally {
            setMembersLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!permissions.includes('wavex-access')) return;
        void loadGroup();
        void loadMembers();
    }, [loadGroup, loadMembers, permissions]);

    async function onImportFile(ev) {
        const file = ev.target.files?.[0];
        ev.target.value = '';
        if (!file) return;
        setImportBusy(true);
        setErr('');
        try {
            const fd = new FormData();
            fd.append('file', file);
            await api.post(`/wavex/contact-groups/${id}/import`, fd);
            await loadMembers();
            await loadGroup();
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        } finally {
            setImportBusy(false);
        }
    }

    async function downloadExport(format) {
        setErr('');
        try {
            const res = await api.get(`/wavex/contact-groups/${id}/export`, {
                params: { format },
                responseType: 'blob',
            });
            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contacts.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        }
    }

    async function deleteMember(memberId) {
        setBusy(true);
        setErr('');
        try {
            await api.delete(`/wavex/contact-groups/${id}/members/${memberId}`);
            await loadMembers();
            await loadGroup();
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        } finally {
            setBusy(false);
        }
    }

    async function deleteSelectedMembers() {
        if (selectedMembers.length === 0) return;
        if (!confirm(t('wavex_cg_confirm_delete_members', { count: selectedMembers.length }))) return;
        setBusy(true);
        setErr('');
        try {
            for (const mId of selectedMembers) {
                await api.delete(`/wavex/contact-groups/${id}/members/${mId}`);
            }
            setSelectedMembers([]);
            await loadMembers();
            await loadGroup();
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        } finally {
            setBusy(false);
        }
    }

    async function deleteGroup() {
        if (!confirm(t('wavex_cg_confirm_delete'))) return;
        setBusy(true);
        try {
            await api.delete(`/wavex/contact-groups/${id}`);
            navigate('/wavex/groups');
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
            setBusy(false);
        }
    }

    const toggleMemberSelect = (mId) => {
        setSelectedMembers((prev) =>
            prev.includes(mId) ? prev.filter((x) => x !== mId) : [...prev, mId],
        );
    };

    const toggleAllMembers = () => {
        setSelectedMembers(selectedMembers.length === members.length ? [] : members.map((m) => m.id));
    };

    if (!can('wavex-access')) return <Navigate to="/dashboard" replace />;

    if (loading) {
        return <p className="p-6 text-sm text-slate-500">{t('loading')}</p>;
    }

    if (!group) {
        return (
            <div className="p-6 text-center">
                <p className="text-sm text-red-600">{err || t('wavex_cg_not_found')}</p>
                <Link to="/wavex/groups" className="mt-2 inline-block text-sm text-brand hover:underline">
                    {t('wavex_cg_back_to_list')}
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        to="/wavex/groups"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand"
                    >
                        <HiOutlineArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="border-s-4 border-brand ps-4">
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                            <HiOutlineUserGroup className="h-7 w-7 text-brand" aria-hidden />
                            {group.name}
                        </h1>
                        {group.description && (
                            <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={deleteGroup}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                        <HiOutlineTrash className="h-4 w-4" />
                        {t('wavex_cg_delete')}
                    </button>
                    <Link
                        to={`/wavex/groups/${id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                        <HiOutlinePencilSquare className="h-4 w-4" />
                        {t('wavex_cg_edit')}
                    </Link>
                </div>
            </div>

            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            {importWaBanner && (
                <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <p>{t('wavex_cg_import_wa_partial', { message: importWaBanner })}</p>
                    <button
                        type="button"
                        onClick={() => setImportWaBanner('')}
                        className="shrink-0 text-xs font-semibold text-amber-800 underline hover:no-underline"
                    >
                        {t('wavex_cg_import_wa_dismiss')}
                    </button>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
            >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {t('wavex_cg_members_count')}: {group.members_count ?? members.length}
                        </h2>
                        <button
                            type="button"
                            onClick={() => void loadMembers()}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            <HiOutlineArrowPath className={membersLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedMembers.length > 0 && (
                            <button
                                type="button"
                                onClick={deleteSelectedMembers}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                <HiOutlineTrash className="h-3.5 w-3.5" />
                                {t('wavex_cg_delete_selected')} ({selectedMembers.length})
                            </button>
                        )}
                        <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            <input type="file" accept=".csv,.txt,.xlsx" className="hidden" onChange={onImportFile} disabled={importBusy} />
                            {importBusy ? t('loading') : t('wavex_cg_import')}
                        </label>
                        <button
                            type="button"
                            onClick={() => void downloadExport('xlsx')}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            {t('wavex_cg_export_xlsx')}
                        </button>
                        <button
                            type="button"
                            onClick={() => void downloadExport('csv')}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            {t('wavex_cg_export_csv')}
                        </button>
                    </div>
                </div>

                {membersLoading ? (
                    <p className="text-sm text-slate-500">{t('loading')}</p>
                ) : (
                    <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-slate-50 text-xs text-slate-600">
                                <tr>
                                    <th className="w-10 px-3 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedMembers.length === members.length && members.length > 0}
                                            onChange={toggleAllMembers}
                                            className="rounded-sm border-slate-300"
                                        />
                                    </th>
                                    <th className="px-3 py-2">{t('wavex_cg_col_phone')}</th>
                                    <th className="px-3 py-2">{t('wavex_cg_col_name')}</th>
                                    <th className="w-20 px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {members.map((m) => (
                                    <tr key={m.id} className={selectedMembers.includes(m.id) ? 'bg-brand/5' : ''}>
                                        <td className="px-3 py-1.5">
                                            <input
                                                type="checkbox"
                                                checked={selectedMembers.includes(m.id)}
                                                onChange={() => toggleMemberSelect(m.id)}
                                                className="rounded-sm border-slate-300"
                                            />
                                        </td>
                                        <td className="px-3 py-1.5 font-mono text-xs">{m.phone}</td>
                                        <td className="px-3 py-1.5 text-slate-700">{m.display_name || '\u2014'}</td>
                                        <td className="px-3 py-1.5">
                                            <button
                                                type="button"
                                                onClick={() => void deleteMember(m.id)}
                                                disabled={busy}
                                                className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                            >
                                                {t('wavex_cg_remove')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {members.length === 0 && (
                            <p className="p-4 text-center text-sm text-slate-500">{t('wavex_cg_no_members')}</p>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
