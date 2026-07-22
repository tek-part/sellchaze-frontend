import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiCheck, HiXMark } from 'react-icons/hi2';
import api from '../api/client';

const STATUSES = ['pending', 'approved', 'rejected'];

export default function AdminVerificationsPage() {
    const { t } = useTranslation();
    const [rows, setRows] = useState([]);
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/verifications', { params: { status } });
            setRows(data.data ?? []);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { load(); }, [load]);

    const act = async (id, kind) => {
        const notes = kind === 'reject' ? (prompt(t('verification_review_notes_prompt')) || '') : '';
        setBusyId(id);
        try {
            await api.post(`/admin/verifications/${id}/${kind}`, { review_notes: notes });
            toast.success(kind === 'approve' ? t('verification_approved') : t('verification_rejected'));
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('admin_verifications_title')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('admin_verifications_subtitle')}</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                    <button key={s} onClick={() => setStatus(s)} className={`rounded-lg px-3 py-1.5 text-sm ${status === s ? 'bg-brand text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                        {t('verification_status_' + s)}
                    </button>
                ))}
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="p-4">
                    {loading ? (
                        <p className="text-sm text-slate-400">{t('loading')}</p>
                    ) : rows.length === 0 ? (
                        <p className="text-sm text-slate-400">{t('admin_verifications_empty')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-start text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2 text-start">{t('col_user')}</th>
                                        <th className="px-3 py-2 text-start">{t('verification_notes')}</th>
                                        <th className="px-3 py-2 text-start">{t('col_date')}</th>
                                        <th className="px-3 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.id} className="border-t border-slate-100 align-top">
                                            <td className="px-3 py-2">
                                                <div className="font-medium text-slate-900">{r.user?.name}</div>
                                                <div className="text-xs text-slate-500">{r.user?.email}</div>
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">
                                                {r.notes || '—'}
                                                {r.documents?.length ? (
                                                    <ul className="mt-1 list-disc ps-5 text-xs text-slate-500">
                                                        {r.documents.map((d, i) => (<li key={i}><a href={d} target="_blank" rel="noreferrer" className="text-brand hover:underline break-all">{d}</a></li>))}
                                                    </ul>
                                                ) : null}
                                                {r.review_notes ? <p className="mt-1 rounded-sm bg-slate-50 px-2 py-1 text-xs">{r.review_notes}</p> : null}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                                            <td className="px-3 py-2 text-end">
                                                {r.status === 'pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button disabled={busyId === r.id} onClick={() => act(r.id, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">
                                                            <HiCheck className="h-4 w-4" aria-hidden />
                                                            {t('approve')}
                                                        </button>
                                                        <button disabled={busyId === r.id} onClick={() => act(r.id, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">
                                                            <HiXMark className="h-4 w-4" aria-hidden />
                                                            {t('reject')}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500">{t('verification_status_' + r.status)}</span>
                                                )}
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
