import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiCheck, HiOutlineShieldCheck, HiXMark } from '../components/workspace/WorkspaceIcons';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { clientIndexRows } from '../lib/clientIndexRows';
import api from '../api/client';

const STATUSES = ['pending', 'approved', 'rejected'];
const STATUS_TONES = { pending: 'is-warning', approved: 'is-success', rejected: 'is-critical' };
const DEFAULTS = { sort: { by: 'created_at', direction: 'desc' }, perPage: 25 };
// The endpoint returns the latest 200 requests at once; search, sort and paging happen here.
const CLIENT = {
    search: [(r) => r.user?.name, (r) => r.user?.email, (r) => r.notes, (r) => r.review_notes],
    sorts: { created_at: (r) => r.created_at, user: (r) => r.user?.name },
};

export default function AdminVerificationsPage() {
    const { t, i18n } = useTranslation();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [reload, setReload] = useState(0);
    const [busyId, setBusyId] = useState(null);

    const statusOptions = STATUSES.map((value) => ({ value, label: t(`verification_status_${value}`) }));
    const filters = useMemo(() => [
        { key: 'status', label: t('col_status'), type: 'select', options: statusOptions },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);
    const views = useMemo(() => [
        { id: 'all', label: t('filter_all'), state: { filters: {} } },
        ...statusOptions.map((option) => ({ id: option.value, label: option.label, state: { filters: { status: option.value } } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);

    const act = async (id, kind) => {
        const notes = kind === 'reject' ? (prompt(t('verification_review_notes_prompt')) || '') : '';
        setBusyId(id);
        try {
            await api.post(`/admin/verifications/${id}/${kind}`, { review_notes: notes });
            toast.success(kind === 'approve' ? t('verification_approved') : t('verification_rejected'));
            setReload((value) => value + 1);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setBusyId(null);
        }
    };

    const columns = useMemo(() => [
        { key: 'user', header: t('col_user'), hideable: false, primary: true, sortKey: 'user', csv: (r) => r.user?.name ?? '',
            render: (r) => <div><span className="ws-dt-title">{r.user?.name}</span><span className="ws-dt-sub" dir="ltr">{r.user?.email}</span></div> },
        { key: 'email', header: t('email'), defaultHidden: true, csv: (r) => r.user?.email ?? '', render: (r) => <span dir="ltr">{r.user?.email ?? '—'}</span> },
        { key: 'notes', header: t('verification_notes'), csv: (r) => r.notes ?? '',
            render: (r) => <div className="min-w-48 max-w-md whitespace-normal">
                {r.notes || '—'}
                {r.documents?.length ? <ul className="mt-1 list-disc ps-5 text-xs">
                    {r.documents.map((d, i) => <li key={i}><a href={d} target="_blank" rel="noreferrer" className="break-all text-brand hover:underline">{d}</a></li>)}
                </ul> : null}
                {r.review_notes ? <p className="ws-dt-sub mt-1">{r.review_notes}</p> : null}
            </div> },
        { key: 'status', header: t('col_status'), csv: (r) => r.status,
            render: (r) => <span className={`ws-dt-badge ${STATUS_TONES[r.status] ?? ''}`}>{t(`verification_status_${r.status}`)}</span> },
        { key: 'reviewer', header: t('admin_dt_reviewer'), defaultHidden: true, csv: (r) => r.reviewer?.name ?? '', render: (r) => r.reviewer?.name ?? '—' },
        { key: 'created', header: t('col_date'), sortKey: 'created_at', csv: (r) => r.created_at ?? '',
            render: (r) => <span className="ws-dt-num">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</span> },
        { key: 'actions', header: <span className="sr-only">{t('col_actions')}</span>, hideable: false, align: 'end',
            render: (r) => (r.status === 'pending' ? <div className="flex justify-end gap-2">
                <button type="button" disabled={busyId === r.id} onClick={() => void act(r.id, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">
                    <HiCheck className="h-4 w-4" aria-hidden />
                    {t('approve')}
                </button>
                <button type="button" disabled={busyId === r.id} onClick={() => void act(r.id, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">
                    <HiXMark className="h-4 w-4" aria-hidden />
                    {t('reject')}
                </button>
            </div> : <span className="ws-dt-sub">{t(`verification_status_${r.status}`)}</span>) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language, busyId]);

    const table = useIndexTable({ scope: 'admin:verifications', filters, columns, views, defaults: DEFAULTS });

    // Requests waiting for review stay the landing list, as before.
    const landed = useRef(false);
    useEffect(() => {
        if (landed.current) return;
        landed.current = true;
        const { state } = table;
        if (state.view === 'all' && !state.search && !Object.keys(state.filters).length) table.selectView(views[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const status = table.state.filters.status;
    useEffect(() => {
        let active = true;
        setLoading(true);
        setErr('');
        api.get('/admin/verifications', { params: status ? { status } : {} })
            .then(({ data }) => { if (active) setList(data.data ?? []); })
            .catch((e) => { if (active) { setErr(e.response?.data?.message || e.message); toast.error(e.response?.data?.message || e.message); } })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [status, reload]);

    const { rows, meta, all } = clientIndexRows(list, table.state, CLIENT);

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('admin_verifications_title')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('admin_verifications_subtitle')}</p>
            </div>
            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={t('admin_dt_search_verifications')} exportDisabled={loading || !all.length}
                    onExport={() => downloadCsv(`verifications-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, all)} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={() => setReload((value) => value + 1)} meta={meta}
                    label={t('admin_verifications_title')}
                    emptyState={{ icon: HiOutlineShieldCheck, title: t('admin_verifications_empty') }} />
            </div>
        </div>
    );
}
