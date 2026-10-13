import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import useStoreContext from '../../../hooks/useStoreContext';
import MerchantSettingsHeading from '../../../components/store/MerchantSettingsHeading';
import { loginSessionsCsv } from '../../../lib/loginSessionsCsv';
import './merchant-device-settings.css';

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
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    const [saved, setSaved] = useState(false);
    const dialog = useRef(null);
    const working = useRef(false);
    useEffect(() => {
        if (!allowed) return;
        let active = true;
        setLoading(true); setError('');
        api.get('/auth/sessions').then(({ data }) => { if (active) { setRows(data.data); setSelected([]); } })
            .catch((failure) => { if (active) setError(failure.response?.data?.message || failure.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [allowed, reload]);
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
    const selectable = rows.filter((row) => !row.current).map((row) => row.id);
    return <div dir={ar ? 'rtl' : 'ltr'}>
        {error ? <div className="ws-settings-feedback" role="alert">{error}<button onClick={() => setReload((value) => value + 1)}>{text('إعادة تحميل', 'Reload')}</button></div> : null}
        {saved ? <p className="ws-settings-feedback" role="status">{text('تم إلغاء الجلسات المحددة.', 'Selected sessions revoked.')}</p> : null}
        <section className="ws-settings-card"><MerchantSettingsHeading title={text('جلسات الدخول', 'Login sessions')} />
            <div className="ws-login-actions"><button disabled={loading || busy || !rows.length} onClick={exportRows}>{text('تصدير', 'Export')}</button><button disabled={busy || !selected.length} onClick={() => setSelected([])}>{text('الغاء التحديد', 'Clear selection')}</button><button disabled={busy || !selected.length} onClick={() => dialog.current?.showModal()}>{text('حذف', 'Delete')}</button></div>
            {loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : <div className="ws-login-table"><table><thead><tr>
                <th><input type="checkbox" aria-label={text('تحديد الجلسات الأخرى', 'Select other sessions')} disabled={busy || !selectable.length} checked={Boolean(selectable.length && selectable.every((id) => selected.includes(id)))} onChange={(event) => setSelected(event.target.checked ? selectable : [])} /></th>
                <th>IP</th><th>Device Info</th><th>Email</th><th>{text('تاريخ الانشاء', 'Created at')}</th>
            </tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><input type="checkbox" disabled={busy || row.current} checked={selected.includes(row.id)} aria-label={row.current ? text('الجلسة الحالية', 'Current session') : `${text('تحديد الجلسة', 'Select session')} ${row.device_name || row.created_at}`} onChange={(event) => setSelected((current) => event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id))} /></td><td dir="ltr">{row.ip_address || '—'}</td><td>{row.device_name || row.user_agent || '—'}{row.current ? <span> · {text('الجهاز الحالي', 'Current device')}</span> : null}</td><td dir="ltr">{row.email || '—'}</td><td>{row.created_at ? new Date(row.created_at).toLocaleString(ar ? 'ar-EG' : 'en-US') : '—'}</td></tr>)}</tbody></table>{!rows.length ? <p>{text('لا توجد جلسات.', 'No sessions.')}</p> : null}</div>}
        </section>
        <dialog ref={dialog} className="ws-login-confirm" aria-label={text('إلغاء جلسات الدخول', 'Revoke login sessions')}><p>{text('سيتم تسجيل خروج الأجهزة المحددة وإيقاف إشعارات الطلبات المرتبطة بها.', 'Selected devices will be signed out and their order notifications stopped.')}</p><button disabled={busy} onClick={revoke}>{busy ? text('جارٍ الحذف…', 'Deleting…') : text('حذف', 'Delete')}</button><button disabled={busy} onClick={() => dialog.current?.close()}>{text('إلغاء', 'Cancel')}</button></dialog>
    </div>;
}
