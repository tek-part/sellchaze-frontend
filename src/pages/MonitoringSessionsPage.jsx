import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineClock, HiOutlineTrash, HiOutlineUserGroup } from 'react-icons/hi2';
import api from '../api/client';
import PaginationBar from '../components/table/PaginationBar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDebounced } from '../hooks/useDebounced';

export default function MonitoringSessionsPage() {
    const { t } = useTranslation();
    const { isAdmin, permissions } = useOutletContext();
    const canView = isAdmin || permissions.includes('monitoring-live-view');
    const canBulkDelete = permissions.includes('activity-logs-list');
    const [rows, setRows] = useState([]);
    const [staffWork, setStaffWork] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [status, setStatus] = useState('');
    const [roleType, setRoleType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const debouncedSearch = useDebounced(searchInput, 350);

    const load = useCallback(async () => {
        if (!canView) return;
        setLoading(true);
        try {
            const params = {
                page,
                per_page: 20,
                ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
                ...(status ? { status } : {}),
                ...(roleType ? { role_type: roleType } : {}),
                ...(dateFrom ? { date_from: dateFrom } : {}),
                ...(dateTo ? { date_to: dateTo } : {}),
            };
            const { data } = await api.get('/admin/monitoring/sessions', { params });
            setRows(data.data || []);
            setMeta(data.meta || null);
            setStaffWork(data.staff_work || []);
            setSelectedIds([]);
        } finally {
            setLoading(false);
        }
    }, [canView, page, debouncedSearch, status, roleType, dateFrom, dateTo]);

    useEffect(() => {
        void load();
    }, [load]);
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, roleType, dateFrom, dateTo]);

    const topStaff = useMemo(() => {
        return [...staffWork].sort((a, b) => (b.month_seconds || 0) - (a.month_seconds || 0)).slice(0, 6);
    }, [staffWork]);
    const selectedCount = selectedIds.length;

    const toggleSelectAll = () => {
        if (selectedIds.length === rows.length) {
            setSelectedIds([]);
            return;
        }
        setSelectedIds(rows.map((r) => r.id));
    };

    const toggleSelectOne = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const runDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        setDeleteLoading(true);
        try {
            await api.post('/admin/monitoring/sessions/bulk-destroy', { ids: selectedIds });
            toast.success(t('monitoring_sessions_deleted'));
            setConfirmDelete(false);
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    if (!canView) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-s-4 border-brand ps-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('monitoring_sessions_title')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('monitoring_sessions_subtitle')}</p>
                </div>
                <Link
                    to="/admin/monitoring/live"
                    className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                    <HiOutlineArrowLeft className="h-4 w-4" />
                    {t('monitoring_back_live')}
                </Link>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <HiOutlineUserGroup className="h-4 w-4" />
                    {t('monitoring_staff_work_summary')}
                </p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {topStaff.map((item) => (
                        <div key={item.user_id} className="rounded-xl bg-slate-50 px-3 py-2">
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-xs text-slate-600">{t('monitoring_week_hours')}: <span className="font-mono">{secondsToClock(item.week_seconds)}</span></p>
                            <p className="text-xs text-slate-600">{t('monitoring_month_hours')}: <span className="font-mono">{secondsToClock(item.month_seconds)}</span></p>
                        </div>
                    ))}
                    {topStaff.length === 0 ? <p className="text-sm text-slate-500">{t('empty')}</p> : null}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="xl:col-span-2">
                        <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('table_search')}</label>
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={t('table_search_placeholder')}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('monitoring_filter_status')}</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <option value="">{t('filter_all')}</option>
                            <option value="active">{t('monitoring_status_active')}</option>
                            <option value="inactive">{t('monitoring_status_inactive')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('monitoring_filter_role_type')}</label>
                        <select value={roleType} onChange={(e) => setRoleType(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <option value="">{t('filter_all')}</option>
                            <option value="staff">{t('monitoring_role_staff')}</option>
                            <option value="supplier">{t('monitoring_role_supplier')}</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 xl:col-span-1">
                        <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('filter_date_from')}</label>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('filter_date_to')}</label>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" />
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                        {selectedIds.length === rows.length && rows.length > 0 ? t('monitoring_unselect_all') : t('monitoring_select_all')}
                    </button>
                    <button
                        type="button"
                        disabled={!canBulkDelete || selectedCount === 0}
                        onClick={() => canBulkDelete && setConfirmDelete(true)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40"
                    >
                        <HiOutlineTrash className="h-4 w-4" />
                        {t('monitoring_delete_selected', { count: selectedCount })}
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {rows.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(row.id)}
                                    onChange={() => toggleSelectOne(row.id)}
                                    className="mt-1 h-4 w-4 rounded-sm border-slate-300 text-brand focus:ring-brand/40"
                                />
                                <div>
                                <p className="text-sm font-semibold text-slate-900">{row.user?.name || '—'}</p>
                                <p className="text-xs text-slate-500">{row.user?.email || '—'} · {(row.user?.roles || []).join(', ')}</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                <HiOutlineClock className="h-3.5 w-3.5" />
                                {secondsToClock(row.duration_seconds || 0)}
                            </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                            <Meta label={t('monitoring_session_day')} value={dayNameLabel(row.day_name, t)} />
                            <Meta label={t('monitoring_col_device')} value={row.device_name || '—'} />
                            <Meta label={t('monitoring_col_browser')} value={row.browser || '—'} />
                            <Meta label="IP" value={row.ip_address || '—'} />
                            <Meta label={t('monitoring_session_start')} value={formatDateTime(row.started_at)} />
                            <Meta label={t('monitoring_session_end')} value={formatDateTime(row.ended_at)} />
                            <Meta label={t('monitoring_col_last_seen')} value={formatDateTime(row.last_used_at)} />
                            <Meta label={t('monitoring_col_status')} value={row.is_active ? t('monitoring_status_active') : t('monitoring_status_inactive')} />
                        </div>
                    </div>
                ))}
                {rows.length === 0 && !loading ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-card">{t('empty')}</div>
                ) : null}
            </div>

            <PaginationBar meta={meta} onPageChange={setPage} loading={loading} />
            <ConfirmDialog
                open={confirmDelete}
                onClose={() => !deleteLoading && setConfirmDelete(false)}
                title={t('monitoring_delete_selected_title')}
                body={t('monitoring_delete_selected_body', { count: selectedCount })}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleteLoading}
                onConfirm={runDeleteSelected}
            />
        </div>
    );
}

function Meta({ label, value }) {
    return (
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-[12px] text-slate-800">{value || '—'}</p>
        </div>
    );
}

function formatDateTime(v) {
    if (!v) return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
}

function secondsToClock(value) {
    const total = Math.max(0, Number(value || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function dayNameLabel(dayName, t) {
    const map = {
        Monday: t('day_monday'),
        Tuesday: t('day_tuesday'),
        Wednesday: t('day_wednesday'),
        Thursday: t('day_thursday'),
        Friday: t('day_friday'),
        Saturday: t('day_saturday'),
        Sunday: t('day_sunday'),
    };

    return map[dayName] || dayName || '—';
}
