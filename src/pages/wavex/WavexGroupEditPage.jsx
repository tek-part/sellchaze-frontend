import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineUserGroup,
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
    HiOutlineTrash,
} from 'react-icons/hi2';
import api from '../../api/client';

function parseMemberLines(block) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const out = [];
    for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        const phone = parts[0] || '';
        if (!phone) continue;
        const display_name = parts.length > 1 ? parts.slice(1).join(', ') : null;
        out.push({ phone, display_name: display_name || null });
    }
    return out;
}

function getPaginatedRows(data) {
    const d = data?.data ?? data;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d)) return d;
    return [];
}

export default function WavexGroupEditPage() {
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const { id } = useParams();
    const navigate = useNavigate();
    const can = (p) => permissions.includes(p);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [addMembersBlock, setAddMembersBlock] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [success, setSuccess] = useState('');
    const [importBusy, setImportBusy] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);

    const loadGroup = useCallback(async () => {
        setErr('');
        setLoading(true);
        try {
            const { data } = await api.get(`/wavex/contact-groups/${id}`);
            const g = data?.data ?? data;
            setName(g.name || '');
            setDescription(g.description || '');
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
            setSelectedMembers([]);
        } catch {
            setMembers([]);
        } finally {
            setMembersLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!can('wavex-access')) return;
        void loadGroup();
        void loadMembers();
    }, [loadGroup, loadMembers, permissions]);

    async function handleSave(e) {
        e.preventDefault();
        if (!name.trim()) return;
        setBusy(true);
        setErr('');
        setSuccess('');
        try {
            await api.put(`/wavex/contact-groups/${id}`, {
                name: name.trim(),
                description: description.trim() || null,
            });
            setSuccess(t('wavex_cg_saved'));
            setTimeout(() => setSuccess(''), 3000);
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        } finally {
            setBusy(false);
        }
    }

    async function addMembers(e) {
        e.preventDefault();
        const list = parseMemberLines(addMembersBlock);
        if (list.length === 0) return;
        setBusy(true);
        setErr('');
        try {
            await api.post(`/wavex/contact-groups/${id}/members`, { members: list });
            setAddMembersBlock('');
            await loadMembers();
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        } finally {
            setBusy(false);
        }
    }

    async function deleteMember(memberId) {
        setBusy(true);
        setErr('');
        try {
            await api.delete(`/wavex/contact-groups/${id}/members/${memberId}`);
            await loadMembers();
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
            await loadMembers();
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

    const toggleMemberSelect = (mId) => {
        setSelectedMembers((prev) =>
            prev.includes(mId) ? prev.filter((x) => x !== mId) : [...prev, mId],
        );
    };

    const toggleAllMembers = () => {
        if (selectedMembers.length === members.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(members.map((m) => m.id));
        }
    };

    if (!can('wavex-access')) return <Navigate to="/dashboard" replace />;

    if (loading) {
        return <p className="p-6 text-sm text-slate-500">{t('loading')}</p>;
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
                            {t('wavex_cg_edit')}: {name}
                        </h1>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={deleteGroup}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                    <HiOutlineTrash className="h-4 w-4" />
                    {t('wavex_cg_delete')}
                </button>
            </div>

            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            {success && (
                <p className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
            )}

            {/* Group Info */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
            >
                <h2 className="mb-4 text-lg font-semibold text-slate-800">{t('wavex_cg_group_info')}</h2>
                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="text-sm font-medium text-slate-700">{t('wavex_cg_name')}</label>
                        <input
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">{t('wavex_cg_description')}</label>
                        <textarea
                            className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                        {busy ? t('loading') : t('wavex_cg_save')}
                    </button>
                </form>
            </motion.div>

            {/* Members */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
            >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-800">{t('wavex_cg_members_count')}: {members.length}</h2>
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
                    <div className="mb-6 max-h-72 overflow-y-auto rounded-lg border border-slate-100">
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

                <form onSubmit={addMembers} className="space-y-3 border-t border-slate-100 pt-4">
                    <p className="text-sm font-medium text-slate-800">{t('wavex_cg_add_members')}</p>
                    <textarea
                        className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
                        value={addMembersBlock}
                        onChange={(e) => setAddMembersBlock(e.target.value)}
                        placeholder={t('wavex_campaign_recipients_hint')}
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full rounded-xl border border-brand bg-brand/5 py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand/10 disabled:opacity-50"
                    >
                        {t('wavex_cg_add_members')}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
