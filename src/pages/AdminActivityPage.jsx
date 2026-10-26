import { useMemo, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { IndexFilters, IndexTable, downloadCsv, useIndexQuery, useIndexTable } from '../components/data-table';
import { HiOutlineClipboardDocumentList, HiOutlineInformationCircle, HiOutlineTrash } from '../components/workspace/WorkspaceIcons';

function unwrapLog(payload) {
    if (!payload) return null;
    return payload.data ?? payload;
}

const fmtProps = (p) => {
    if (p == null) return '—';
    try {
        return JSON.stringify(p, null, 2);
    } catch {
        return String(p);
    }
};
const option = (value) => ({ value, label: value });
const EVENT_TYPES = ['user_action', 'system_event', 'background_job', 'integration', 'error'].map(option);
const CHANNELS = ['http', 'queue', 'scheduler', 'webhook', 'command'].map(option);
const LEVELS = ['info', 'warning', 'error'].map(option);
const LEVEL_TONES = { error: 'is-critical', warning: 'is-warning', info: 'is-success' };
// The endpoint is always ordered by time; it only accepts the direction (`sort_dir`).
const DEFAULTS = { sort: { by: 'created_at', direction: 'desc' }, perPage: 25 };
const errorText = (e) => e.response?.data?.message || e.message;

export default function AdminActivityPage() {
    const { t, i18n } = useTranslation();
    const { isAdmin } = useOutletContext();
    const [details, setDetails] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmBulk, setConfirmBulk] = useState(null);

    const filters = useMemo(() => [
        { key: 'level', label: t('activity_filter_level'), type: 'select', options: LEVELS },
        { key: 'event_type', label: t('activity_filter_event_type'), type: 'select', options: EVENT_TYPES },
        { key: 'channel', label: t('activity_filter_channel'), type: 'select', options: CHANNELS },
        { key: 'action', label: t('filter_action'), type: 'text' },
        { key: 'module', label: t('activity_filter_module'), type: 'text' },
        { key: 'status_code', label: t('activity_filter_status_code'), type: 'text' },
        { key: 'created', param: 'date', label: t('activity_col_time'), type: 'date-range' },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);
    const views = useMemo(() => [
        { id: 'all', label: t('filter_all'), state: { filters: {} } },
        { id: 'errors', label: t('admin_dt_view_errors'), state: { filters: { level: 'error' } } },
        { id: 'warnings', label: t('admin_dt_view_warnings'), state: { filters: { level: 'warning' } } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);
    const columns = useMemo(() => [
        { key: 'time', header: t('activity_col_time'), sortKey: 'created_at', csv: (log) => log.created_at ?? '',
            render: (log) => <span className="ws-dt-num">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</span> },
        { key: 'action', header: t('activity_col_action'), hideable: false, primary: true, csv: (log) => log.action,
            render: (log) => <span className="font-mono text-xs font-semibold" dir="ltr">{log.action}</span> },
        { key: 'event_type', header: t('activity_filter_event_type'), csv: (log) => log.event_type ?? '',
            render: (log) => <span className="ws-dt-badge is-info">{log.event_type || '—'}</span> },
        { key: 'channel', header: t('activity_filter_channel'), csv: (log) => log.channel ?? '', render: (log) => log.channel || '—' },
        { key: 'level', header: t('activity_filter_level'), csv: (log) => log.level || 'info',
            render: (log) => <span className={`ws-dt-badge ${LEVEL_TONES[log.level || 'info'] ?? ''}`}>{log.level || 'info'}</span> },
        { key: 'actor', header: t('activity_col_actor'), csv: (log) => (log.actor ? `${log.actor.name} (${log.actor.email})` : ''),
            render: (log) => (log.actor ? <div><span>{log.actor.name}</span><span className="ws-dt-sub" dir="ltr">{log.actor.email}</span></div> : '—') },
        { key: 'subject', header: t('activity_col_subject'), csv: (log) => (log.subject_type ? `${log.subject_type} #${log.subject_id}` : ''),
            render: (log) => <span className="inline-block max-w-xs truncate font-mono text-xs" dir="ltr" title={fmtProps(log.properties)}>{log.subject_type ? `${log.subject_type} #${log.subject_id}` : '—'}</span> },
        { key: 'ip', header: t('activity_col_ip'), csv: (log) => log.ip_address ?? '', render: (log) => <span className="ws-dt-num" dir="ltr">{log.ip_address || '—'}</span> },
        { key: 'details', header: <span className="sr-only">{t('activity_col_details')}</span>, hideable: false, align: 'end',
            render: (log) => <div className="ws-dt-row-actions"><button type="button" className="ws-dt-icon" onClick={() => setDetails(log)} title={t('activity_col_details')} aria-label={`${t('activity_col_details')}: ${log.action}`}><HiOutlineInformationCircle aria-hidden /></button></div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);

    const table = useIndexTable({ scope: 'admin:activity', filters, columns, views, defaults: DEFAULTS });
    const listParams = useMemo(() => {
        const { sort_by: _sortBy, sort_direction: direction, ...rest } = table.apiParams;
        return { ...rest, ...(direction ? { sort_dir: direction } : {}) };
    }, [table.apiParams]);
    const { data: rows, meta, loading, error: err, reload } = useIndexQuery({ url: '/admin/activity-logs', params: listParams, enabled: Boolean(isAdmin), formatError: errorText,
        map: (data) => ({ data: (data.data ?? []).map(unwrapLog).filter(Boolean), meta: data.meta ?? null }) });

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const selectedRows = [...table.selected.values()];

    const runBulkDelete = async () => {
        const ids = confirmBulk ?? [];
        if (ids.length === 0) return;
        setDeleting(true);
        try {
            const { data } = await api.post('/admin/activity-logs/bulk-destroy', { ids });
            toast.success(`${t('action_delete')} (${data?.deleted ?? ids.length})`);
            setConfirmBulk(null);
            table.clearSelection();
            reload();
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setDeleting(false);
        }
    };

    const bulkActions = [
        { key: 'delete', label: t('action_delete'), icon: HiOutlineTrash, tone: 'danger', disabled: () => deleting, onAction: (list) => setConfirmBulk(list.map((log) => log.id)) },
    ];

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('nav_activity_log')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('activity_log_subtitle')}</p>
            </div>
            <div className="ws-dt-card">
                {/* Logs can run into the millions: export covers the selection or the current page only. */}
                <IndexFilters table={table} searchPlaceholder={t('admin_dt_search_activity')} exportDisabled={loading || !rows.length}
                    onExport={() => downloadCsv(`activity-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, selectedRows.length ? selectedRows : rows)} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={reload} meta={meta}
                    label={t('nav_activity_log')} bulkActions={bulkActions}
                    emptyState={{ icon: HiOutlineClipboardDocumentList, title: t('empty'), description: t('activity_log_subtitle') }} />
            </div>

            <ConfirmDialog
                open={Boolean(confirmBulk)}
                onClose={() => !deleting && setConfirmBulk(null)}
                title={t('confirm_bulk_delete_title')}
                body={t('confirm_bulk_delete_body')}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleting}
                onConfirm={runBulkDelete}
            />

            <Dialog open={Boolean(details)} onClose={() => setDetails(null)} className="relative z-100">
                <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="flex max-h-[min(90dvh,40rem)] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                        <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                            <DialogTitle className="text-lg font-bold text-slate-900">{t('activity_col_details')}</DialogTitle>
                            {details ? <p className="mt-1 font-mono text-xs text-slate-500" dir="ltr">{details.action}{details.created_at ? ` · ${new Date(details.created_at).toLocaleString()}` : ''}</p> : null}
                        </div>
                        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto px-5 py-4 md:grid-cols-2">
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">properties</p>
                                <pre className="max-h-96 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-700 ring-1 ring-slate-200" dir="ltr">{fmtProps(details?.properties)}</pre>
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">context</p>
                                <pre className="max-h-96 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-700 ring-1 ring-slate-200" dir="ltr">{fmtProps(details?.context)}</pre>
                            </div>
                        </div>
                        <div className="shrink-0 border-t border-slate-100 px-5 py-3">
                            <button type="button" onClick={() => setDetails(null)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                {t('close', 'Close')}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
