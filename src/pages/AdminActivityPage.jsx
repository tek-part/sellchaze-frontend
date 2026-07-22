import { Fragment, useCallback, useEffect, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import ConfirmDialog from '../components/ConfirmDialog';

function unwrapLog(payload) {
    if (!payload) return null;
    return payload.data ?? payload;
}

export default function AdminActivityPage() {
    const { t } = useTranslation();
    const { isAdmin } = useOutletContext();
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [eventType, setEventType] = useState('');
    const [channel, setChannel] = useState('');
    const [level, setLevel] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [statusCode, setStatusCode] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [selected, setSelected] = useState(() => new Set());
    const [deleting, setDeleting] = useState(false);
    const [confirmBulk, setConfirmBulk] = useState(false);

    const loadParams = useCallback(() => {
        return {
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(dateFrom ? { date_from: dateFrom } : {}),
            ...(dateTo ? { date_to: dateTo } : {}),
            ...(actionFilter.trim() ? { action: actionFilter.trim() } : {}),
            ...(eventType ? { event_type: eventType } : {}),
            ...(channel ? { channel } : {}),
            ...(level ? { level } : {}),
            ...(moduleFilter.trim() ? { module: moduleFilter.trim() } : {}),
            ...(statusCode.trim() ? { status_code: statusCode.trim() } : {}),
        };
    }, [page, perPage, debouncedSearch, dateFrom, dateTo, actionFilter, eventType, channel, level, moduleFilter, statusCode]);

    useEffect(() => setPage(1), [debouncedSearch, dateFrom, dateTo, perPage, actionFilter, eventType, channel, level, moduleFilter, statusCode]);

    useEffect(() => {
        if (!isAdmin) return;
        setLoading(true);
        setErr('');
        api.get('/admin/activity-logs', { params: loadParams() })
            .then(({ data }) => {
                const list = data.data ?? [];
                setRows(list.map(unwrapLog).filter(Boolean));
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [isAdmin, loadParams]);
    useEffect(() => {
        setSelected(new Set());
    }, [rows]);

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const fmtProps = (p) => {
        if (p == null) return '—';
        try {
            return JSON.stringify(p, null, 2);
        } catch {
            return String(p);
        }
    };

    const levelBadgeClass = (value) =>
        value === 'error'
            ? 'bg-red-100 text-red-700'
            : value === 'warning'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700';
    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    const toggleAll = () => {
        if (selected.size === rows.length) setSelected(new Set());
        else setSelected(new Set(rows.map((r) => r.id)));
    };
    const runBulkDelete = async () => {
        const ids = [...selected];
        if (ids.length === 0) return;
        setDeleting(true);
        try {
            const { data } = await api.post('/admin/activity-logs/bulk-destroy', { ids });
            toast.success(`${t('action_delete')} (${data?.deleted ?? ids.length})`);
            setConfirmBulk(false);
            setSelected(new Set());
            setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('nav_activity_log')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('activity_log_subtitle')}</p>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-card">
                <ListToolbar
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    perPage={perPage}
                    onPerPageChange={(n) => {
                        setPerPage(n);
                        setPage(1);
                    }}
                    onExportCurrent={() => {}}
                    onExportAll={() => {}}
                    exportDisabled
                    selectedCount={selected.size}
                    onBulkDelete={() => {
                        if (selected.size > 0) setConfirmBulk(true);
                    }}
                    bulkDeleteDisabled={deleting}
                    advanced={
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('filter_action')}
                                </label>
                                <input
                                    type="text"
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                    placeholder="staff_user.updated"
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('activity_filter_event_type')}
                                </label>
                                <select
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                >
                                    <option value="">{t('filter_all')}</option>
                                    <option value="user_action">user_action</option>
                                    <option value="system_event">system_event</option>
                                    <option value="background_job">background_job</option>
                                    <option value="integration">integration</option>
                                    <option value="error">error</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('activity_filter_channel')}
                                </label>
                                <select
                                    value={channel}
                                    onChange={(e) => setChannel(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                >
                                    <option value="">{t('filter_all')}</option>
                                    <option value="http">http</option>
                                    <option value="queue">queue</option>
                                    <option value="scheduler">scheduler</option>
                                    <option value="webhook">webhook</option>
                                    <option value="command">command</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('activity_filter_level')}
                                </label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                >
                                    <option value="">{t('filter_all')}</option>
                                    <option value="info">info</option>
                                    <option value="warning">warning</option>
                                    <option value="error">error</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('activity_filter_module')}
                                </label>
                                <input
                                    type="text"
                                    value={moduleFilter}
                                    onChange={(e) => setModuleFilter(e.target.value)}
                                    placeholder="api, queue, command..."
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('activity_filter_status_code')}
                                </label>
                                <input
                                    type="number"
                                    value={statusCode}
                                    onChange={(e) => setStatusCode(e.target.value)}
                                    placeholder="200, 422, 500"
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('filter_date_from')}
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
                            <div className="xl:col-span-1">
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('filter_date_to')}
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
                        </div>
                    }
                />
                <div className="relative min-h-48 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-3 py-3.5">
                                    <input
                                        type="checkbox"
                                        checked={rows.length > 0 && selected.size === rows.length}
                                        onChange={toggleAll}
                                        aria-label="select all"
                                    />
                                </th>
                                <th className="px-4 py-3.5">{t('activity_col_time')}</th>
                                <th className="px-4 py-3.5">{t('activity_col_action')}</th>
                                <th className="px-4 py-3.5">{t('activity_filter_event_type')}</th>
                                <th className="px-4 py-3.5">{t('activity_filter_channel')}</th>
                                <th className="px-4 py-3.5">{t('activity_filter_level')}</th>
                                <th className="px-4 py-3.5">{t('activity_col_actor')}</th>
                                <th className="px-4 py-3.5">{t('activity_col_subject')}</th>
                                <th className="px-4 py-3.5">{t('activity_col_ip')}</th>
                                <th className="px-4 py-3.5">{t('activity_col_details')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-14 text-center text-sm text-slate-500">
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((log) => (
                                <Fragment key={log.id}>
                                    <tr
                                        className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                    >
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(log.id)}
                                                onChange={() => toggleRow(log.id)}
                                                aria-label={`select ${log.id}`}
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                            {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-900">{log.action}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                                                {log.event_type || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-700">{log.channel || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelBadgeClass(log.level)}`}>
                                                {log.level || 'info'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {log.actor ? `${log.actor.name} (${log.actor.email})` : '—'}
                                        </td>
                                        <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-600" title={fmtProps(log.properties)}>
                                            {log.subject_type ? `${log.subject_type} #${log.subject_id}` : '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{log.ip_address || '—'}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedId((prev) => (prev === log.id ? null : log.id))}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                {t('activity_col_details')}
                                                <HiOutlineChevronDown className={`h-3.5 w-3.5 transition ${expandedId === log.id ? 'rotate-180' : ''}`} />
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedId === log.id ? (
                                        <tr className="border-t border-slate-100 bg-slate-50/60">
                                            <td colSpan={10} className="px-4 py-3">
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <div>
                                                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">properties</p>
                                                        <pre className="max-h-48 overflow-auto rounded-lg bg-white p-2 text-xs text-slate-700 ring-1 ring-slate-200">{fmtProps(log.properties)}</pre>
                                                    </div>
                                                    <div>
                                                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">context</p>
                                                        <pre className="max-h-48 overflow-auto rounded-lg bg-white p-2 text-xs text-slate-700 ring-1 ring-slate-200">{fmtProps(log.context)}</pre>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : null}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationBar meta={meta} loading={loading} onPageChange={setPage} />
            </div>
            <ConfirmDialog
                open={confirmBulk}
                onClose={() => !deleting && setConfirmBulk(false)}
                title={t('confirm_bulk_delete_title')}
                body={t('confirm_bulk_delete_body')}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleting}
                onConfirm={runBulkDelete}
            />
        </div>
    );
}
