import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from '../../components/workspace/WorkspaceIcons';
import { IndexTable, useIndexTable } from '../../components/data-table';
import api from '../../api/client';

// The groups endpoint accepts page and per_page (up to 200); it has no search or sort parameters.
const DEFAULTS = { perPage: 50, perPageOptions: [50, 100, 200] };
const NO_FILTERS = [];
const NO_VIEWS = [];

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

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadErr, setLoadErr] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const latest = useRef(0);
    // Row actions call the latest handler (it depends on the current page).
    const removeOne = useRef(null);

    const columns = useMemo(() => [
        { key: 'name', header: t('wavex_cg_name'), primary: true, hideable: false,
            render: (g) => <Link className="ws-dt-title" to={`/wavex/groups/${g.id}`}>{g.name}</Link> },
        { key: 'description', header: t('wavex_cg_description'), render: (g) => g.description || <span className="ws-dt-sub">{'—'}</span> },
        { key: 'members', header: t('wavex_cg_members_count'), align: 'end', render: (g) => <span className="ws-dt-num">{g.members_count ?? 0}</span> },
        { key: 'actions', header: t('wavex_cg_actions'), hideable: false, align: 'end',
            render: (g) => <div className="ws-dt-row-actions">
                <Link className="ws-dt-icon" to={`/wavex/groups/${g.id}`} title={t('wavex_cg_view')} aria-label={`${t('wavex_cg_view')} ${g.name}`}><HiOutlineEye aria-hidden /></Link>
                <Link className="ws-dt-icon" to={`/wavex/groups/${g.id}/edit`} title={t('wavex_cg_edit')} aria-label={`${t('wavex_cg_edit')} ${g.name}`}><HiOutlinePencilSquare aria-hidden /></Link>
                <button type="button" className="ws-dt-icon" onClick={() => void removeOne.current?.(g.id)} disabled={busy} title={t('wavex_cg_delete')} aria-label={`${t('wavex_cg_delete')} ${g.name}`}><HiOutlineTrash aria-hidden /></button>
            </div> },
    ], [t, busy]);
    const table = useIndexTable({ scope: 'wavex:groups', filters: NO_FILTERS, columns, views: NO_VIEWS, defaults: DEFAULTS, savedViews: false });
    const { page, perPage } = table.state;

    const loadGroups = useCallback(async () => {
        const request = ++latest.current;
        setLoadErr('');
        setLoading(true);
        try {
            const { data } = await api.get('/wavex/contact-groups', { params: { page, per_page: perPage } });
            if (request === latest.current) setResult(data);
        } catch (e) {
            if (request === latest.current) { setLoadErr(e.response?.data?.message || e.message); setResult(null); }
        } finally {
            if (request === latest.current) setLoading(false);
        }
    }, [page, perPage]);

    useEffect(() => {
        if (!permissions.includes('wavex-access')) return;
        void loadGroups();
    }, [loadGroups, permissions]);

    const reload = async () => {
        table.clearSelection();
        await loadGroups();
    };

    useEffect(() => { removeOne.current = deleteGroup; });

    async function deleteGroup(id) {
        if (!confirm(t('wavex_cg_confirm_delete'))) return;
        setBusy(true);
        setErr('');
        try {
            await api.delete(`/wavex/contact-groups/${id}`);
            await reload();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    }

    async function bulkDelete(ids) {
        if (ids.length === 0) return;
        if (!confirm(t('wavex_cg_confirm_bulk_delete', { count: ids.length }))) return;
        setBusy(true);
        setErr('');
        try {
            await api.post('/wavex/contact-groups/bulk-destroy', { ids });
            await reload();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    }

    if (!can('wavex-access')) return <Navigate to="/dashboard" replace />;

    const groups = getPaginatedRows(result);
    const paginator = result?.data && !Array.isArray(result.data) ? result.data : result;
    const createLink = (
        <Link
            to="/wavex/groups/new"
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
            <HiOutlinePlus className="h-4 w-4" />
            {t('wavex_cg_new_group')}
        </Link>
    );

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
                        onClick={() => void reload()}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <HiOutlineArrowPath className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        {t('wavex_groups_reload')}
                    </button>
                    {createLink}
                </div>
            </div>

            {err && (
                <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="ws-dt-card">
                <IndexTable
                    table={table}
                    rows={groups}
                    loading={loading || (!result && !loadErr)}
                    error={loadErr}
                    onRetry={() => void reload()}
                    meta={paginator ? { total: paginator.total ?? groups.length, last_page: paginator.last_page ?? 1 } : undefined}
                    label={t('wavex_groups_title')}
                    rowHref={(g) => `/wavex/groups/${g.id}`}
                    bulkActions={[{ key: 'delete', label: t('wavex_cg_delete_selected'), icon: HiOutlineTrash, tone: 'danger', disabled: () => busy, onAction: (selected) => void bulkDelete(selected.map((g) => g.id)) }]}
                    emptyState={{ icon: HiOutlineUserGroup, title: t('wavex_cg_empty'), action: createLink }}
                />
            </motion.div>
        </div>
    );
}
