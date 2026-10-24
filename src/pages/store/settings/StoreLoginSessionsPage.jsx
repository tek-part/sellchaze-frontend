import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import useStoreContext from '../../../hooks/useStoreContext';
import MerchantSettingsHeading from '../../../components/store/MerchantSettingsHeading';
import { IndexTable, useIndexTable } from '../../../components/data-table';
import { HiOutlineArrowDownTray, HiOutlineComputerDesktop, HiOutlineTrash } from '../../../components/workspace/WorkspaceIcons';
import { loginSessionsCsv } from '../../../lib/loginSessionsCsv';
import './merchant-device-settings.css';

const NO_FILTERS = [];
const NO_VIEWS = [];

export default function StoreLoginSessionsPage() {
    const context = useStoreContext();
    return <Sessions key={context.me?.id} context={context} />;
}
function Sessions({ context }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const allowed = context.access.isStoreOwner && !context.isAdminScope;
    const [rows, setRows] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    const [saved, setSaved] = useState(false);
    const dialog = useRef(null);
    const working = useRef(false);
    useEffect(() => {
        if (!allowed) return;
        let active = true;
        setLoading(true); setLoadError(''); setError('');
        api.get('/auth/sessions').then(({ data }) => { if (active) { setRows(data.data); setSelected([]); } })
            .catch((failure) => { if (active) setLoadError(failure.response?.data?.message || failure.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [allowed, reload]);

    // The current device can never be revoked here, so it is never selectable.
    const selectable = rows.filter((row) => !row.current).map((row) => row.id);
    const allSelected = Boolean(selectable.length && selectable.every((id) => selected.includes(id)));
    const selectAll = (checked) => setSelected(checked ? selectable : []);
    const selectAllLabel = text('تحديد الجلسات الأخرى', 'Select other sessions');
    const columns = useMemo(() => [
        { key: 'select', hideable: false, width: 48,
            header: <input type="checkbox" className="ws-login-check" aria-label={selectAllLabel} disabled={busy || !selectable.length} checked={allSelected} onChange={(event) => selectAll(event.target.checked)} />,
            render: (row) => <input type="checkbox" className="ws-login-check" disabled={busy || row.current} checked={selected.includes(row.id)} aria-label={row.current ? text('الجلسة الحالية', 'Current session') : `${text('تحديد الجلسة', 'Select session')} ${row.device_name || row.created_at}`} onChange={(event) => setSelected((current) => event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id))} /> },
        { key: 'ip', header: 'IP', render: (row) => <span className="ws-login-ip" dir="ltr">{row.ip_address || '—'}</span> },
        { key: 'device', header: 'Device Info', render: (row) => <span className="ws-login-device"><span>{row.device_name || row.user_agent || '—'}</span>{row.current ? <span className="ws-dt-badge is-info">{text('الجهاز الحالي', 'Current device')}</span> : null}</span> },
        { key: 'email', header: 'Email', render: (row) => <span className="ws-login-email" dir="ltr">{row.email || '—'}</span> },
        { key: 'created', header: text('تاريخ الانشاء', 'Created at'), render: (row) => <span className="ws-dt-num">{row.created_at ? new Date(row.created_at).toLocaleString(ar ? 'ar-EG' : 'en-US') : '—'}</span> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, busy, rows, selected]);
    const table = useIndexTable({ scope: `store:${context.store?.id ?? context.apiBase}:login-sessions`, filters: NO_FILTERS, columns, views: NO_VIEWS, savedViews: false });

    if (!allowed) return <Navigate to={`${context.uiBase}/overview`} replace />;
    const exportRows = () => {
        const url = URL.createObjectURL(new Blob([loginSessionsCsv(rows.filter((row) => !selected.length || selected.includes(row.id)))], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = 'login-sessions.csv'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const revoke = async () => {
        if (working.current) return;
        working.current = true; setBusy(true); setError(''); setSaved(false);
        try {
            // Each request retains the API's own-session and current-device checks.
            for (const id of selected) {
                await api.delete(`/auth/sessions/${encodeURIComponent(id)}`);
                setRows((current) => current.filter((row) => row.id !== id));
                setSelected((current) => current.filter((value) => value !== id));
            }
            setSaved(true); dialog.current?.close();
        } catch (failure) { setError(failure.response?.data?.message || failure.message); dialog.current?.close(); }
        finally { working.current = false; setBusy(false); }
    };
    return <div dir={ar ? 'rtl' : 'ltr'}>
        {error ? <div className="ws-settings-feedback" role="alert">{error}<button type="button" onClick={() => setReload((value) => value + 1)}>{text('إعادة تحميل', 'Reload')}</button></div> : null}
        {saved ? <p className="ws-settings-feedback" role="status">{text('تم إلغاء الجلسات المحددة.', 'Selected sessions revoked.')}</p> : null}
        <section className="ws-settings-card"><MerchantSettingsHeading title={text('جلسات الدخول', 'Login sessions')} />
            <div className="ws-dt-card ws-login-card">
                <div className="ws-login-actions">
                    <label className="ws-login-select-all"><input type="checkbox" className="ws-login-check" disabled={loading || busy || !selectable.length} checked={allSelected} onChange={(event) => selectAll(event.target.checked)} />{selectAllLabel}</label>
                    {selected.length ? <span className="ws-login-count" role="status">{text(`${selected.length} محدد`, `${selected.length} selected`)}</span> : null}
                    <span className="ws-dt-spacer" />
                    <button type="button" className="ws-dt-button" disabled={loading || busy || !rows.length} onClick={exportRows}><HiOutlineArrowDownTray aria-hidden />{text('تصدير', 'Export')}</button>
                    <button type="button" className="ws-dt-button" disabled={busy || !selected.length} onClick={() => setSelected([])}>{text('الغاء التحديد', 'Clear selection')}</button>
                    <button type="button" className="ws-dt-button ws-login-delete" disabled={busy || !selected.length} onClick={() => dialog.current?.showModal()}><HiOutlineTrash aria-hidden />{text('حذف', 'Delete')}</button>
                </div>
                <div className="ws-login-table" role="region" aria-label={text('جدول جلسات الدخول', 'Login sessions table')} tabIndex={0}>
                    <IndexTable table={table} rows={rows} loading={loading} error={loadError} onRetry={() => setReload((value) => value + 1)}
                        label={text('الأجهزة المسجّلة في حسابك', 'Devices signed in to your account')}
                        emptyState={{ icon: HiOutlineComputerDesktop, title: text('لا توجد جلسات.', 'No sessions.') }} />
                </div>
            </div>
        </section>
        <dialog ref={dialog} className="ws-login-confirm" aria-label={text('إلغاء جلسات الدخول', 'Revoke login sessions')}><p>{text('سيتم تسجيل خروج الأجهزة المحددة وإيقاف إشعارات الطلبات المرتبطة بها.', 'Selected devices will be signed out and their order notifications stopped.')}</p><button type="button" disabled={busy} onClick={revoke}>{busy ? text('جارٍ الحذف…', 'Deleting…') : text('حذف', 'Delete')}</button><button type="button" disabled={busy} onClick={() => dialog.current?.close()}>{text('إلغاء', 'Cancel')}</button></dialog>
    </div>;
}
