import { useCallback, useEffect, useState } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineXMark, HiOutlineCheck } from 'react-icons/hi2';
import api from '../api/client';
import SearchableSelect from '../components/ui/SearchableSelect';
import { confirmDialog } from '../components/ui/confirmDialog';

const TYPES = ['text', 'number', 'select', 'multiselect', 'color', 'boolean'];

const NEEDS_VALUES = (type) => type === 'select' || type === 'multiselect' || type === 'color';

function TypeBadge({ type }) {
    return (
        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {type}
        </span>
    );
}

function AttributeFormModal({ open, initial, onSave, onClose, tr }) {
    const isEdit = !!initial;
    const [name, setName] = useState('');
    const [type, setType] = useState('text');
    const [valuesText, setValuesText] = useState('');
    const [saving, setSaving] = useState(false);

    // Seed / reset the form each time the modal opens (create vs. a specific row).
    useEffect(() => {
        if (!open) return;
        setName(initial?.name ?? '');
        setType(initial?.type ?? 'text');
        setValuesText((initial?.values ?? []).map((v) => v.value).join('\n'));
        setSaving(false);
    }, [open, initial]);

    const submit = async () => {
        if (!name.trim() || !type) {
            toast.error(tr('attributes_validation_error'));
            return;
        }
        setSaving(true);
        try {
            const values = NEEDS_VALUES(type)
                ? valuesText.split('\n').map((v) => v.trim()).filter(Boolean)
                : [];
            await onSave({ name: name.trim(), type, values });
        } catch {
            // Keep the modal open so the user can retry; the page toasts the error.
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={saving ? () => {} : onClose} className="relative z-100">
            <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <DialogTitle className="text-lg font-bold text-slate-900">
                        {isEdit ? tr('attributes_action_edit') : tr('attributes_action_new')}
                    </DialogTitle>

                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                {tr('attributes_col_name')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') submit();
                                }}
                                placeholder={tr('attributes_placeholder_name')}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-hidden transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                {tr('attributes_col_type')}
                            </label>
                            <SearchableSelect value={type} onChange={(e) => setType(e.target.value)} className="w-full">
                                {TYPES.map((tp) => (
                                    <option key={tp} value={tp}>
                                        {tp}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </div>

                        {NEEDS_VALUES(type) ? (
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    {tr('attributes_col_values')}
                                </label>
                                <textarea
                                    value={valuesText}
                                    onChange={(e) => setValuesText(e.target.value)}
                                    rows={5}
                                    placeholder={tr('attributes_placeholder_values')}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono outline-hidden transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                                />
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <HiOutlineXMark className="h-4 w-4" aria-hidden />
                            {tr('attributes_action_cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-50"
                        >
                            <HiOutlineCheck className="h-4 w-4" aria-hidden />
                            {saving ? '…' : tr('attributes_action_save')}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

export default function AttributesPage() {
    const { t } = useTranslation();
    const ctx = useOutletContext();
    const { permissions = [], isAdmin = false } = ctx || {};
    const can = (p) => isAdmin || permissions.includes(p);
    const canView = can('attributes-list');
    const canCreate = can('attributes-create');
    const canEdit = can('attributes-edit');
    const canDelete = can('attributes-delete');

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null); // the row being edited, or null when creating

    const load = useCallback(async () => {
        setLoading(true);
        setErr('');
        try {
            const { data } = await api.get('/attributes', { params: { per_page: 100 } });
            const list = data.data ?? [];
            setRows(
                list.map((a) => ({
                    id: a.id,
                    name: a.name,
                    type: a.type ?? 'text',
                    values: (a.attribute_values ?? []).map((v) => ({ id: v.id, value: v.value })),
                })),
            );
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (canView) load();
    }, [canView, load]);

    if (!canView) {
        return <Navigate to="/dashboard" replace />;
    }

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setModalOpen(true);
    };

    // Create or update depending on the modal mode. Rethrows on failure so the
    // modal stays open; resolves (and closes) on success.
    const handleSubmit = async (payload) => {
        try {
            if (editing) {
                await api.put(`/attributes/${editing.id}`, payload);
                toast.success(t('attributes_toast_updated'));
            } else {
                await api.post('/attributes', payload);
                toast.success(t('attributes_toast_created'));
            }
            setModalOpen(false);
            setEditing(null);
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
            throw e;
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirmDialog({
            title: t('attributes_action_delete', 'Delete attribute'),
            text: t('attributes_confirm_delete'),
            confirmText: t('attributes_action_delete', 'Delete'),
        });
        if (!ok) return;
        try {
            await api.delete(`/attributes/${id}`);
            toast.success(t('attributes_toast_deleted'));
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    };

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('perm_group_attributes')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('attributes_page_subtitle')}</p>
            </div>

            {err ? (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 className="font-semibold text-slate-900">{t('attributes_section_definitions')}</h2>
                    {canCreate ? (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white"
                        >
                            <HiOutlinePlus className="h-4 w-4" aria-hidden />
                            {t('attributes_action_new')}
                        </button>
                    ) : null}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2.5">{t('attributes_col_name')}</th>
                                <th className="px-3 py-2.5">{t('attributes_col_type')}</th>
                                <th className="px-3 py-2.5">{t('attributes_col_values')}</th>
                                <th className="px-3 py-2.5 text-end">{t('attributes_col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-10 text-center text-slate-400">
                                        {t('loading')}
                                    </td>
                                </tr>
                            ) : null}
                            {!loading && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-10 text-center text-slate-500">
                                        {t('attributes_empty_definitions')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((r) => (
                                    <tr key={r.id} className="border-t border-slate-100">
                                        <td className="px-3 py-2.5 font-medium text-slate-900">{r.name}</td>
                                        <td className="px-3 py-2.5">
                                            <TypeBadge type={r.type} />
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-700">
                                            {r.values.length === 0 ? (
                                                <span className="text-xs text-slate-400">—</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {r.values.slice(0, 8).map((v) => (
                                                        <span
                                                            key={v.id}
                                                            className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand"
                                                        >
                                                            {v.value}
                                                        </span>
                                                    ))}
                                                    {r.values.length > 8 ? (
                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                                            +{r.values.length - 8}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-end">
                                            <div className="inline-flex gap-1">
                                                {canEdit ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(r)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                                    >
                                                        <HiOutlinePencil className="h-4 w-4" aria-hidden />
                                                        {t('attributes_action_edit')}
                                                    </button>
                                                ) : null}
                                                {canDelete ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(r.id)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                    >
                                                        <HiOutlineTrash className="h-4 w-4" aria-hidden />
                                                        {t('attributes_action_delete')}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AttributeFormModal
                open={modalOpen}
                initial={editing}
                onSave={handleSubmit}
                onClose={() => {
                    setModalOpen(false);
                    setEditing(null);
                }}
                tr={t}
            />
        </div>
    );
}
