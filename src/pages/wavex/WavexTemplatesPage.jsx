import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowPath,
    HiOutlineDocumentDuplicate,
    HiOutlineEye,
    HiOutlinePencilSquare,
    HiOutlinePlus,
    HiOutlineTrash,
} from '../../components/workspace/WorkspaceIcons';
import { IndexTable, useIndexTable } from '../../components/data-table';
import api from '../../api/client';
import { getPaginatedRows } from '../../utils/apiPagination';

// The templates endpoint pages by 50 and has no search or sort parameters.
const DEFAULTS = { perPage: 50, perPageOptions: [50] };
const NO_FILTERS = [];
const NO_VIEWS = [];

function mediaTypeLabel(t, type) {
    if (type === 'image') return t('wavex_template_media_type_image');
    if (type === 'video') return t('wavex_template_media_type_video');
    if (type === 'document') return t('wavex_template_media_type_document');
    return '';
}

export default function WavexTemplatesPage() {
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const canAccessWavex = permissions.includes('wavex-access');

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const latest = useRef(0);
    // Row actions call the latest handler (it depends on the current page).
    const removeOne = useRef(null);

    const columns = useMemo(() => [
        { key: 'name', header: t('wavex_template_name'), primary: true, hideable: false,
            render: (row) => <Link className="ws-dt-title" to={`/wavex/templates/${row.id}`}>{row.name}</Link> },
        { key: 'body', header: t('wavex_template_body'),
            render: (row) => <p className="line-clamp-2 max-w-xs whitespace-pre-wrap text-xs text-slate-600">{row.body}</p> },
        { key: 'attachment', header: t('wavex_template_attachment'),
            render: (row) => (row.media_type ? <span className="ws-dt-badge is-info">{mediaTypeLabel(t, row.media_type)}</span> : <span className="ws-dt-sub">{'—'}</span>) },
        { key: 'actions', header: t('wavex_cg_actions'), hideable: false, align: 'end',
            render: (row) => <div className="ws-dt-row-actions">
                <Link className="ws-dt-icon" to={`/wavex/templates/${row.id}`} title={t('wavex_tpl_view')} aria-label={`${t('wavex_tpl_view')} ${row.name}`}><HiOutlineEye aria-hidden /></Link>
                <Link className="ws-dt-icon" to={`/wavex/templates/${row.id}/edit`} title={t('wavex_template_edit')} aria-label={`${t('wavex_template_edit')} ${row.name}`}><HiOutlinePencilSquare aria-hidden /></Link>
                <button type="button" className="ws-dt-icon" onClick={() => void removeOne.current?.(row.id)} disabled={busy} title={t('wavex_template_delete')} aria-label={`${t('wavex_template_delete')} ${row.name}`}><HiOutlineTrash aria-hidden /></button>
            </div> },
    ], [t, busy]);

    const table = useIndexTable({ scope: 'wavex:templates', filters: NO_FILTERS, columns, views: NO_VIEWS, defaults: DEFAULTS, savedViews: false });
    const page = table.state.page;

    const load = useCallback(async () => {
        const request = ++latest.current;
        setLoadErr('');
        setLoading(true);
        try {
            const { data } = await api.get('/wavex/templates', { params: { page } });
            if (request === latest.current) setResult(data);
        } catch (e) {
            if (request === latest.current) { setLoadErr(e.response?.data?.message || e.message); setResult(null); }
        } finally {
            if (request === latest.current) setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        if (!canAccessWavex) return;
        void load();
    }, [load, canAccessWavex]);

    const reload = async () => {
        table.clearSelection();
        await load();
    };

    useEffect(() => { removeOne.current = deleteTemplate; });

    async function deleteTemplate(id) {
        if (!confirm(t('wavex_tpl_confirm_delete'))) return;
        setBusy(true);
        setErr('');
        try {
            await api.delete(`/wavex/templates/${id}`);
            await reload();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    }

    async function bulkDelete(ids) {
        if (ids.length === 0) return;
        if (!confirm(t('wavex_tpl_confirm_bulk_delete', { count: ids.length }))) return;
        setBusy(true);
        setErr('');
        try {
            await api.post('/wavex/templates/bulk-destroy', { ids });
            await reload();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    }

    if (!canAccessWavex) return <Navigate to="/dashboard" replace />;

    const rows = getPaginatedRows(result);
    const createLink = (
        <Link
            to="/wavex/templates/new"
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
            <HiOutlinePlus className="h-4 w-4" />
            {t('wavex_template_create')}
        </Link>
    );

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <HiOutlineDocumentDuplicate className="h-8 w-8 text-brand" aria-hidden />
                        {t('wavex_templates_title')}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{t('wavex_templates_subtitle')}</p>
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
                    rows={rows}
                    loading={loading}
                    error={loadErr}
                    onRetry={() => void reload()}
                    meta={result ? { total: result.total ?? rows.length, last_page: result.last_page ?? 1 } : undefined}
                    label={t('wavex_templates_title')}
                    rowHref={(row) => `/wavex/templates/${row.id}`}
                    bulkActions={[{ key: 'delete', label: t('wavex_cg_delete_selected'), icon: HiOutlineTrash, tone: 'danger', disabled: () => busy, onAction: (selected) => void bulkDelete(selected.map((row) => row.id)) }]}
                    emptyState={{ icon: HiOutlineDocumentDuplicate, title: t('empty'), action: createLink }}
                />
            </motion.div>
        </div>
    );
}
