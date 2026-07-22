import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlineUserGroup, HiOutlineUserPlus, HiOutlineTrash } from 'react-icons/hi2';
import api from '../api/client';

export default function EmployeesPage() {
    const { t } = useTranslation();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
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

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('employees_title')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('employees_subtitle')}</p>
            </div>

            {err ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}

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

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-3">
                    <HiOutlineUserGroup className="h-5 w-5 text-brand" aria-hidden />
                    <h2 className="font-semibold text-slate-900">{t('employees_list')}</h2>
                </div>
                <div className="p-4">
                    {loading ? (
                        <p className="text-sm text-slate-400">{t('loading')}</p>
                    ) : rows.length === 0 ? (
                        <p className="text-sm text-slate-400">{t('employees_empty')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-start text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2 text-start">{t('employees_name')}</th>
                                        <th className="px-3 py-2 text-start">{t('employees_email')}</th>
                                        <th className="px-3 py-2 text-start">{t('col_status')}</th>
                                        <th className="px-3 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((u) => (
                                        <tr key={u.id} className="border-t border-slate-100">
                                            <td className="px-3 py-2 text-slate-900">{u.name}</td>
                                            <td className="px-3 py-2 text-slate-600">{u.email}</td>
                                            <td className="px-3 py-2 text-slate-600">{u.is_active ? t('active') : t('inactive')}</td>
                                            <td className="px-3 py-2 text-end">
                                                <button onClick={() => handleDelete(u.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50">
                                                    <HiOutlineTrash className="h-4 w-4" aria-hidden />
                                                    {t('delete')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
