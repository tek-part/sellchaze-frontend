import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiCheckBadge, HiOutlinePaperAirplane } from 'react-icons/hi2';
import api from '../api/client';

const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
};

export default function VerificationRequestPage() {
    const { t } = useTranslation();
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [docsText, setDocsText] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/verifications/me');
            setState(data);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const documents = docsText
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
            await api.post('/verifications', { notes, documents });
            toast.success(t('verification_request_submitted'));
            setNotes('');
            setDocsText('');
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-slate-400">{t('loading')}</div>;

    const req = state?.request;
    const alreadyVerified = state?.is_verified;
    const hasPending = req && req.status === 'pending';

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {t('verification_title')}
                    {alreadyVerified ? <HiCheckBadge className="h-7 w-7 text-blue-500" aria-hidden /> : null}
                </h1>
                <p className="mt-1 text-sm text-slate-500">{t('verification_subtitle')}</p>
            </div>

            {alreadyVerified ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                    {t('verification_already_verified')}
                </div>
            ) : null}

            {req ? (
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <h2 className="font-semibold text-slate-900">{t('verification_current_request')}</h2>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[req.status] || 'bg-slate-100 text-slate-700'}`}>
                            {t('verification_status_' + req.status)}
                        </span>
                    </div>
                    <div className="space-y-2 p-4 text-sm">
                        {req.notes ? <p><span className="text-slate-500">{t('verification_notes')}: </span>{req.notes}</p> : null}
                        {req.documents?.length ? (
                            <div>
                                <p className="text-slate-500">{t('verification_documents')}:</p>
                                <ul className="list-disc ps-5">
                                    {req.documents.map((d, i) => (<li key={i}><a href={d} target="_blank" rel="noreferrer" className="text-brand hover:underline">{d}</a></li>))}
                                </ul>
                            </div>
                        ) : null}
                        {req.review_notes ? <p className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-500">{t('verification_review_notes')}: </span>{req.review_notes}</p> : null}
                    </div>
                </section>
            ) : null}

            {!alreadyVerified && !hasPending ? (
                <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                    <h2 className="font-semibold text-slate-900">{t('verification_new_request')}</h2>
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{t('verification_notes')}</span>
                        <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder={t('verification_notes_placeholder')} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{t('verification_documents_label')}</span>
                        <textarea rows={3} value={docsText} onChange={(e) => setDocsText(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder={t('verification_documents_placeholder')} />
                        <span className="mt-1 block text-xs text-slate-400">{t('verification_documents_hint')}</span>
                    </label>
                    <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        <HiOutlinePaperAirplane className="h-4 w-4" aria-hidden />
                        {t('verification_submit')}
                    </button>
                </form>
            ) : null}
        </div>
    );
}
