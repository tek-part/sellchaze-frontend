import { useCallback, useEffect, useState } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineXMark, HiOutlineCheck } from 'react-icons/hi2';
import api from '../api/client';

const TYPES = ['text', 'number', 'select', 'multiselect', 'color', 'boolean'];

const NEEDS_VALUES = (type) => type === 'select' || type === 'multiselect' || type === 'color';

function TypeBadge({ type }) {
    return (
        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {type}
        </span>
    );
}

function AttributeFormRow({ initial, onSave, onCancel, tr }) {
    const [name, setName] = useState(initial?.name ?? '');
    const [type, setType] = useState(initial?.type ?? 'text');
    const [valuesText, setValuesText] = useState((initial?.values ?? []).map((v) => v.value).join('\n'));
    const [saving, setSaving] = useState(false);

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
        } finally {
            setSaving(false);
        }
    };

    return (
        <tr className="bg-brand/5">
            <td className="px-3 py-2">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={tr('attributes_placeholder_name')}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    autoFocus
                />
            </td>
            <td className="px-3 py-2">
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                >
                    {TYPES.map((tp) => (
                        <option key={tp} value={tp}>
                            {tp}
                        </option>
                    ))}
                </select>
            </td>
            <td className="px-3 py-2">
                {NEEDS_VALUES(type) ? (
                    <textarea
                        value={valuesText}
                        onChange={(e) => setValuesText(e.target.value)}
                        rows={3}
                        placeholder={tr('attributes_placeholder_values')}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-mono"
                    />
                ) : (
                    <span className="text-xs text-slate-400">—</span>
                )}
            </td>
            <td className="px-3 py-2 text-end">
                <div className="inline-flex gap-1">
                    <button
                        type="button"
                        onClick={submit}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                        <HiOutlineCheck className="h-4 w-4" aria-hidden />
                        {tr('attributes_action_save')}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
                    >
                        <HiOutlineXMark className="h-4 w-4" aria-hidden />
                        {tr('attributes_action_cancel')}
                    </button>
                </div>
            </td>
        </tr>
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
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);

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

    const handleCreate = async (payload) => {
        try {
            await api.post('/attributes', payload);
            toast.success(t('attributes_toast_created'));
            setCreating(false);
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    };

    const handleUpdate = async (id, payload) => {
        try {
            await api.put(`/attributes/${id}`, payload);
            toast.success(t('attributes_toast_updated'));
            setEditingId(null);
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('attributes_confirm_delete'))) return;
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
                    {canCreate && !creating ? (
                        <button
                            type="button"
                            onClick={() => setCreating(true)}
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
                            {creating ? (
                                <AttributeFormRow
                                    onSave={handleCreate}
                                    onCancel={() => setCreating(false)}
                                    tr={t}
                                />
                            ) : null}
                            {loading && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-10 text-center text-slate-400">
                                        {t('loading')}
                                    </td>
                                </tr>
                            ) : null}
                            {!loading && rows.length === 0 && !creating ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-10 text-center text-slate-500">
                                        {t('attributes_empty_definitions')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((r) =>
                                editingId === r.id ? (
                                    <AttributeFormRow
                                        key={r.id}
                                        initial={r}
                                        onSave={(payload) => handleUpdate(r.id, payload)}
                                        onCancel={() => setEditingId(null)}
                                        tr={t}
                                    />
                                ) : (
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
                                                        onClick={() => setEditingId(r.id)}
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
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
