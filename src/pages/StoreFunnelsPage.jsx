import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineClipboardDocument, HiOutlineEye, HiOutlinePencil, HiOutlineDocumentDuplicate, HiOutlinePlayCircle, HiOutlineFunnel } from '../components/workspace/WorkspaceIcons';
import ConfirmDialog from '../components/ConfirmDialog';
import { IndexFilters, IndexTable, downloadCsv, useIndexQuery, useIndexTable } from '../components/data-table';
import { funnelCopy, funnelError } from '../components/store/funnels/funnelCopy';
import '../components/store/funnels/funnel-workspace.css';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';

const DEFAULTS = { sort: { by: 'created_at', direction: 'desc' }, perPage: 25 };
const STATUS_TONE = { published: 'is-success', scheduled: 'is-info', draft: '' };

export default function StoreFunnelsPage() {
    const { i18n } = useTranslation(); const ar = i18n.language?.startsWith('ar'); const c = funnelCopy[ar ? 'ar' : 'en'];
    const text = (a, e) => (ar ? a : e);
    const { apiBase, uiBase } = useStoreScope(); const { access, store } = useOutletContext();
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState(null); const [guide, setGuide] = useState(false);
    const [actionError, setActionError] = useState('');
    const allowed = access?.canStorePages;

    async function copyCode(code) {
        try { await navigator.clipboard.writeText(code); toast.success(c.copied); } catch { toast.error(c.copyFailed); }
    }
    const date = (value) => (value ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—');
    const statuses = ['published', 'draft', 'scheduled'];
    const filters = useMemo(() => [
        { key: 'status', label: c.status, type: 'select', options: statuses.map((status) => ({ value: status, label: c[status] })) },
    ], [ar]); // eslint-disable-line react-hooks/exhaustive-deps
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        ...statuses.map((status) => ({ id: status, label: c[status], state: { filters: { status } } })),
    ], [ar]); // eslint-disable-line react-hooks/exhaustive-deps
    const columns = useMemo(() => [
        { key: 'title', header: c.name, hideable: false, primary: true, sortKey: 'title', csv: (funnel) => funnel.title,
            render: (funnel) => <Link className="ws-dt-title" to={`${uiBase}/funnels/${funnel.id}/edit`}>{funnel.title}</Link> },
        { key: 'slug', header: c.slug, sortKey: 'slug', csv: (funnel) => funnel.slug, render: (funnel) => <span dir="ltr">{funnel.slug}</span> },
        { key: 'code', header: c.code, sortKey: 'public_id', csv: (funnel) => funnel.code,
            render: (funnel) => <button type="button" className="fw-code" onClick={() => void copyCode(funnel.code)} aria-label={`${c.copyCode}: ${funnel.title}`}><HiOutlineClipboardDocument aria-hidden /><span dir="ltr">{funnel.code}</span></button> },
        { key: 'status', header: c.status, sortKey: 'status', csv: (funnel) => funnel.status,
            render: (funnel) => <span className={`ws-dt-badge ${STATUS_TONE[funnel.status] ?? ''}`}>{c[funnel.status] || funnel.status}</span> },
        { key: 'product', header: c.product, defaultHidden: true, csv: (funnel) => funnel.product?.name ?? '', render: (funnel) => funnel.product?.name || <span className="ws-dt-sub">{c.missing}</span> },
        { key: 'locale', header: c.locale, defaultHidden: true, csv: (funnel) => funnel.locale ?? '', render: (funnel) => <span className="uppercase">{funnel.locale || '—'}</span> },
        { key: 'created', header: text('تاريخ الإنشاء', 'Created'), sortKey: 'created_at', csv: (funnel) => funnel.created_at ?? '', render: (funnel) => <span className="ws-dt-num">{date(funnel.created_at)}</span> },
        { key: 'actions', header: <span className="sr-only">{text('إجراءات', 'Actions')}</span>, hideable: false, align: 'end',
            render: (funnel) => <div className="ws-dt-row-actions">
                {funnel.is_public && funnel.public_url ? <a className="ws-dt-icon" href={funnel.public_url} target="_blank" rel="noopener noreferrer" aria-label={`${c.view}: ${funnel.title}`} title={c.view}><HiOutlineEye aria-hidden /></a> : <button type="button" className="ws-dt-icon" disabled title={c.publishFirst} aria-label={`${c.view}: ${funnel.title} — ${c.publishFirst}`}><HiOutlineEye aria-hidden /></button>}
                <Link className="ws-dt-icon fw-edit" to={`${uiBase}/funnels/${funnel.id}/edit`} aria-label={`${c.edit}: ${funnel.title}`} title={c.edit}><HiOutlinePencil aria-hidden /></Link>
                <Link className="ws-dt-icon" to={`${uiBase}/funnels/create?clone=${encodeURIComponent(funnel.code)}`} aria-label={`${c.duplicate}: ${funnel.title}`} title={c.duplicate}><HiOutlineDocumentDuplicate aria-hidden /></Link>
            </div> },
    ], [ar, uiBase]); // eslint-disable-line react-hooks/exhaustive-deps

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:funnels`, filters, columns, views, defaults: DEFAULTS });
    // This endpoint names its sort parameters `sort` / `direction`.
    const { sort_by: sortBy, sort_direction: direction, ...rest } = table.apiParams;
    const params = { ...rest, ...(sortBy ? { sort: sortBy, direction } : {}) };
    // A page past the end (e.g. after deleting its last funnels) jumps to the last page instead.
    const jumpPastEnd = (data) => {
        if (data.data.length > 0 || table.state.page <= data.meta.last_page) return true;
        table.setPage(Math.max(1, data.meta.last_page));
        return false;
    };
    const { data: rows, meta, loading, error, reload } = useIndexQuery({ url: `${apiBase}/funnels`, params, enabled: Boolean(allowed), formatError: funnelError, accept: jumpPastEnd });
    const { clearSelection } = table;
    useEffect(() => { clearSelection(); setConfirm(null); setActionError(''); }, [apiBase, clearSelection]);

    async function remove() {
        if (!confirm) return;
        setBusy(true); setActionError('');
        try { await api.post(`${apiBase}/funnels/bulk-delete`, { ids: confirm }); setConfirm(null); table.clearSelection(); reload(); }
        catch (e) { setActionError(funnelError(e)); setConfirm(null); } finally { setBusy(false); }
    }
    if (!allowed) return <Navigate to={`${uiBase}/overview`} replace />;
    const selectedRows = [...table.selected.values()];
    const bulkActions = [
        { key: 'delete', label: c.delete, icon: HiOutlineTrash, tone: 'danger', disabled: () => busy, onAction: (list) => { setActionError(''); setConfirm(list.map((funnel) => funnel.id)); } },
    ];
    return <div className="fw-list ws-catalog-page">
        <header className="ws-catalog-heading"><div><h1>{c.title}</h1><p>{c.subtitle}</p><button type="button" className="fw-guide mt-3" onClick={() => setGuide(true)}><HiOutlinePlayCircle aria-hidden />{c.title}</button></div>
            <div className="ws-catalog-actions"><Link to={`${uiBase}/funnels/create`} className="ws-dt-button ws-dt-button-primary"><HiOutlinePlus aria-hidden />{c.create}</Link></div></header>
        {actionError ? <div className="fw-error" role="alert">{actionError}</div> : null}
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={c.search} exportDisabled={!rows.length}
                onExport={() => downloadCsv(`funnels-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, selectedRows.length ? selectedRows : rows)} />
            <IndexTable table={table} rows={rows} loading={loading} error={error} onRetry={reload} meta={meta}
                label={c.title} bulkActions={bulkActions} rowHref={(funnel) => `${uiBase}/funnels/${funnel.id}/edit`}
                emptyState={{ icon: HiOutlineFunnel, title: c.empty, description: c.hint, action: <Link className="ws-dt-button ws-dt-button-primary" to={`${uiBase}/funnels/create`}>{c.create}</Link> }} />
        </div>
        <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} title={c.deleteTitle} body={<><p>{c.deleteBody}</p><p>{confirm?.length ?? 0} {c.selectedCount}</p></>} danger loading={busy} onConfirm={remove} confirmLabel={c.delete} cancelLabel={c.cancel} />
        <Dialog open={guide} onClose={() => setGuide(false)} className="fw-dialog"><DialogBackdrop className="fw-backdrop" /><div className="fw-dialog-position"><DialogPanel className="fw-guide-panel"><DialogTitle>{c.guideTitle}</DialogTitle><ol>{c.guideSteps.map(step => <li key={step}>{step}</li>)}</ol><button type="button" className="fw-button" onClick={() => setGuide(false)}>{c.close}</button></DialogPanel></div></Dialog>
    </div>;
}
