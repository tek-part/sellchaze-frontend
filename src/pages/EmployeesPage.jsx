import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlineUserGroup, HiOutlineUserPlus, HiOutlineTrash } from '../components/workspace/WorkspaceIcons';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { clientIndexRows } from '../lib/clientIndexRows';
import api from '../api/client';

const DEFAULTS = { sort: { by: 'name', direction: 'asc' }, perPage: 25 };
// The endpoint returns every employee at once; search, filters, sort and paging happen here.
const CLIENT = {
    search: [(u) => u.name, (u) => u.email],
    filters: { status: (u, value) => (value === 'active' ? Boolean(u.is_active) : !u.is_active) },
    sorts: { name: (u) => u.name, email: (u) => u.email, created_at: (u) => u.created_at },
};

export default function EmployeesPage() {
    const { t, i18n } = useTranslation();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setErr('');
        try {
            const { data } = await api.get('/employees');
            setRows(data.data ?? []);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) {
            toast.error(t('employees_fill_all'));
            return;
        }
        setSaving(true);
        try {
            await api.post('/employees', form);
            toast.success(t('employees_created'));
            setForm({ name: '', email: '', password: '' });
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('employees_confirm_delete'))) return;
        try {
            await api.delete(`/employees/${id}`);
            toast.success(t('employees_deleted'));
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    };

    const filters = useMemo(() => [
        { key: 'status', label: t('col_status'), type: 'select', options: [{ value: 'active', label: t('active') }, { value: 'inactive', label: t('inactive') }] },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const views = useMemo(() => [{ id: 'all', label: t('filter_all'), state: { filters: {} } }], [i18n.language]);
    const columns = useMemo(() => [
        { key: 'name', header: t('employees_name'), hideable: false, primary: true, sortKey: 'name', csv: (u) => u.name, render: (u) => <span className="ws-dt-title">{u.name}</span> },
        { key: 'email', header: t('employees_email'), sortKey: 'email', csv: (u) => u.email, render: (u) => <span dir="ltr">{u.email}</span> },
        { key: 'status', header: t('col_status'), csv: (u) => (u.is_active ? t('active') : t('inactive')),
            render: (u) => <span className={`ws-dt-badge ${u.is_active ? 'is-success' : ''}`}>{u.is_active ? t('active') : t('inactive')}</span> },
        { key: 'created', header: t('col_created'), sortKey: 'created_at', defaultHidden: true, csv: (u) => u.created_at ?? '',
            render: (u) => <span className="ws-dt-num">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span> },
        { key: 'actions', header: <span className="sr-only">{t('delete')}</span>, hideable: false, align: 'end',
            render: (u) => <div className="ws-dt-row-actions"><button type="button" className="ws-dt-icon" onClick={() => void handleDelete(u.id)} title={t('delete')} aria-label={`${t('delete')} ${u.name}`}><HiOutlineTrash aria-hidden /></button></div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);
    const table = useIndexTable({ scope: 'admin:employees', filters, columns, views, defaults: DEFAULTS });
    const { rows: pageRows, meta, all } = clientIndexRows(rows, table.state, CLIENT);

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('employees_title')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('employees_subtitle')}</p>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-3">
                    <HiOutlineUserPlus className="h-5 w-5 text-brand" aria-hidden />
                    <h2 className="font-semibold text-slate-900">{t('employees_add')}</h2>
                </div>
                <form onSubmit={handleCreate} className="grid gap-3 p-4 md:grid-cols-4">
                    <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder={t('employees_name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" type="email" placeholder={t('employees_email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" type="password" placeholder={t('employees_password')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <button type="submit" disabled={saving} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t('employees_create')}</button>
                </form>
            </section>

            <section className="space-y-2">
                <div className="flex items-start gap-2 px-1">
                    <HiOutlineUserGroup className="h-5 w-5 text-brand" aria-hidden />
                    <h2 className="font-semibold text-slate-900">{t('employees_list')}</h2>
                </div>
                <div className="ws-dt-card">
                    <IndexFilters table={table} searchPlaceholder={t('admin_dt_search_name_email')} exportDisabled={loading || !all.length}
                        onExport={() => downloadCsv(`employees-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, all)} />
                    <IndexTable table={table} rows={pageRows} loading={loading} error={err} onRetry={() => void load()} meta={meta}
                        label={t('employees_list')} emptyState={{ icon: HiOutlineUserGroup, title: t('employees_empty') }} />
                </div>
            </section>
        </div>
    );
}
