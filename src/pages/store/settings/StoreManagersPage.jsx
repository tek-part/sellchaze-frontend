import { useEffect, useId, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import useStoreContext from '../../../hooks/useStoreContext';
import MerchantSettingsHeading from '../../../components/store/MerchantSettingsHeading';
import './store-managers.css';

const blank = () => ({ name: '', email: '', password: '', is_active: true, permissions: ['store.view'] });

export default function StoreManagersPage() {
    const context = useStoreContext();
    return <Managers key={context.me?.id} context={context} />;
}

function Managers({ context }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const allowed = context.access.isStoreOwner && !context.isAdminScope && !context.me?.parent_user_id;
    const [rows, setRows] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [reload, setReload] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [editor, setEditor] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const editorDialog = useRef(null);
    const confirmDialog = useRef(null);
    const working = useRef(false);
    const prefix = useId();
    const endpoint = `${context.apiBase}/managers`;

    useEffect(() => {
        if (!allowed) return;
        let active = true;
        setLoading(true);
        const timer = window.setTimeout(() => {
            api.get(endpoint, { params: { search, status, page } }).then(({ data }) => {
                if (active) { setRows(data.data); setCatalog(data.permissions); setMeta(data.meta); }
            }).catch((failure) => { if (active) setError(failure.response?.data?.message || failure.message); })
                .finally(() => { if (active) setLoading(false); });
        }, 200);
        return () => { active = false; window.clearTimeout(timer); };
    }, [allowed, endpoint, search, status, page, reload]);

    useEffect(() => {
        if (editor && !editorDialog.current?.open) {
            editorDialog.current?.showModal();
            editorDialog.current?.scrollTo({ top: 0, behavior: 'instant' });
        }
        if (!editor && editorDialog.current?.open) editorDialog.current.close();
    }, [editor]);
    useEffect(() => {
        if (confirm && !confirmDialog.current?.open) confirmDialog.current?.showModal();
        if (!confirm && confirmDialog.current?.open) confirmDialog.current.close();
    }, [confirm]);

    if (!allowed) return <Navigate to={`${context.uiBase}/overview`} replace />;
    const edit = (row) => {
        setError(''); setNotice('');
        setEditor(row ? { id: row.id, form: { name: row.name, email: row.email, password: '', is_active: row.is_active, permissions: row.permissions, version: row.version } } : { form: blank() });
    };
    const change = (key, value) => setEditor((current) => ({ ...current, form: { ...current.form, [key]: value } }));
    const run = async (operation, message) => {
        if (working.current) return;
        working.current = true; setBusy(true); setError(''); setNotice('');
        try {
            await operation();
            setEditor(null); setConfirm(null); setNotice(message); setReload((value) => value + 1);
        } catch (failure) {
            const data = failure.response?.data;
            setError(failure.response?.status === 409 ? text('تغيّرت بيانات الحساب. أعد تحميل القائمة قبل التعديل مرة أخرى.', 'This account changed. Reload the list before editing again.') : data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message || failure.message);
        } finally { working.current = false; setBusy(false); }
    };
    const save = (event) => {
        event.preventDefault();
        const payload = { ...editor.form };
        if (!payload.password) delete payload.password;
        void run(() => editor.id ? api.put(`${endpoint}/${editor.id}`, payload) : api.post(endpoint, payload), text('تم حفظ حساب المدير وصلاحياته.', 'Manager account and permissions saved.'));
    };
    const recover = () => { setEditor(null); setConfirm(null); setError(''); setReload((value) => value + 1); };
    const feedback = error ? <div role="alert" className="ws-managers-error"><span>{error}</span><button type="button" disabled={busy} onClick={recover}>{text('إعادة تحميل القائمة', 'Reload list')}</button></div> : null;

    return <div className="ws-managers" dir={ar ? 'rtl' : 'ltr'}>
        {notice ? <p className="ws-settings-feedback" role="status">{notice}</p> : null}
        {!editor && !confirm ? feedback : null}
        <section className="ws-settings-card">
            <MerchantSettingsHeading title={text('المديرين', 'Managers')} description={text('تحديد الصلاحيات لكل مدير للتحكم في متجرك. إضافة وتعديل وحذف المديرين من هنا.', 'Choose each manager’s store permissions. Add, edit and remove manager accounts here.')} />
            <div className="ws-managers-toolbar">
                <label><span>{text('بحث المديرين', 'Search managers')}</span><input type="search" maxLength={150} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={text('الاسم أو البريد الإلكتروني', 'Name or email')} /></label>
                <label><span>{text('الحالة', 'Status')}</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{[['all', text('كل المديرين', 'All managers')], ['active', text('مفعّل', 'Active')], ['inactive', text('معطّل', 'Inactive')], ['removed', text('المحذوفون', 'Removed')]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                <button type="button" className="ws-managers-primary" disabled={loading || busy || !catalog.length} onClick={() => edit(null)}>{text('إضافة مدير', 'Add manager')}</button>
            </div>
            {loading ? <p className="ws-managers-empty" role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : <>
                <div className="ws-managers-table" role="region" aria-label={text('قائمة المديرين', 'Managers list')} tabIndex={0}><table><thead><tr>
                    {[text('الاسم', 'Name'), text('البريد الإلكتروني', 'Email'), text('الحالة', 'Status'), text('الصلاحيات', 'Permissions'), text('الإجراءات', 'Actions')].map((label) => <th key={label}>{label}</th>)}
                </tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.name}</td><td dir="ltr">{row.email}</td><td><span className="ws-manager-status" data-active={row.is_active && !row.deleted_at}>{row.deleted_at ? text('محذوف', 'Removed') : row.is_active ? text('مفعّل', 'Active') : text('معطّل', 'Inactive')}</span></td><td>{row.permissions.length} {text('صلاحيات', 'permissions')}</td><td><div className="ws-manager-actions">{row.deleted_at ? <button type="button" disabled={busy} onClick={() => { setError(''); setConfirm({ type: 'restore', row }); }}>{text('استعادة', 'Restore')}</button> : <><button type="button" disabled={busy} onClick={() => edit(row)} aria-label={`${text('تعديل', 'Edit')} ${row.name}`}>{text('تعديل', 'Edit')}</button><button type="button" disabled={busy} className="ws-manager-remove" onClick={() => { setError(''); setConfirm({ type: 'remove', row }); }} aria-label={`${text('حذف', 'Remove')} ${row.name}`}>{text('حذف', 'Remove')}</button></>}</div></td></tr>)}</tbody></table></div>
                {!rows.length ? <p className="ws-managers-empty">{text('لا يوجد مديرون مطابقون للبحث.', 'No managers match this search.')}</p> : null}
                <div className="ws-managers-pagination"><span>{meta.total} {text('مدير', 'managers')} · {meta.current_page} / {meta.last_page}</span><button type="button" disabled={page <= 1 || busy} onClick={() => setPage((value) => value - 1)}>{text('السابق', 'Previous')}</button><button type="button" disabled={page >= meta.last_page || busy} onClick={() => setPage((value) => value + 1)}>{text('التالي', 'Next')}</button></div>
            </>}
        </section>
        <dialog ref={editorDialog} className="ws-manager-dialog" aria-labelledby={`${prefix}-title`} onCancel={(event) => { event.preventDefault(); if (!busy) setEditor(null); }}>
            {editor ? <form onSubmit={save}><header><h2 id={`${prefix}-title`}>{editor.id ? text('تعديل المدير', 'Edit manager') : text('إضافة مدير', 'Add manager')}</h2><button type="button" disabled={busy} aria-label={text('إغلاق', 'Close')} onClick={() => setEditor(null)}>×</button></header>
                <div className="ws-manager-form-body">{feedback}<fieldset disabled={busy} className="ws-manager-fields">
                    <label><span>{text('الاسم', 'Name')}</span><input autoComplete="off" required maxLength={191} value={editor.form.name} onChange={(event) => change('name', event.target.value)} /></label>
                    <label><span>{text('البريد الإلكتروني', 'Email')}</span><input type="email" dir="ltr" autoComplete="off" required maxLength={191} value={editor.form.email} onChange={(event) => change('email', event.target.value)} /></label>
                    <label htmlFor={`${prefix}-password`}><span id={`${prefix}-password-label`}>{editor.id ? text('كلمة مرور جديدة (اختياري)', 'New password (optional)') : text('كلمة المرور', 'Password')}</span><input id={`${prefix}-password`} aria-labelledby={`${prefix}-password-label`} aria-describedby={`${prefix}-password-hint`} type="password" autoComplete="new-password" required={!editor.id} minLength={12} maxLength={128} value={editor.form.password} onChange={(event) => change('password', event.target.value)} /><small id={`${prefix}-password-hint`}>{text('12 حرفًا على الأقل.', 'At least 12 characters.')}</small></label>
                    <label><span>{text('الحالة', 'Status')}</span><select value={editor.form.is_active ? 'active' : 'inactive'} onChange={(event) => change('is_active', event.target.value === 'active')}><option value="active">{text('مفعّل', 'Active')}</option><option value="inactive">{text('معطّل', 'Inactive')}</option></select></label>
                </fieldset><fieldset disabled={busy} className="ws-manager-permissions"><legend>{text('صلاحيات المتجر', 'Store permissions')}</legend>{catalog.map((permission) => <label key={permission.key}><input type="checkbox" disabled={permission.required} checked={permission.required || editor.form.permissions.includes(permission.key)} onChange={(event) => change('permissions', event.target.checked ? [...new Set([...editor.form.permissions, permission.key])] : editor.form.permissions.filter((key) => key !== permission.key))} /><span>{permission.label[ar ? 'ar' : 'en']}</span></label>)}</fieldset>
                    <p className="ws-manager-session-note">{text('تغيير الصلاحيات أو بيانات الدخول أو تعطيل الحساب يسجل خروج جلسات المدير الحالية. لا تشمل هذه الصلاحيات إدارة المديرين أو محفظة مالك المتجر.', 'Changing permissions or sign-in details, or disabling the account, signs out its current sessions. These permissions do not include manager administration or the store owner’s wallet.')}</p>
                </div><footer><button type="button" disabled={busy} onClick={() => setEditor(null)}>{text('إلغاء', 'Cancel')}</button><button type="submit" className="ws-managers-primary" disabled={busy}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button></footer>
            </form> : null}
        </dialog>
        <dialog ref={confirmDialog} className="ws-manager-dialog ws-manager-confirm" aria-label={confirm?.type === 'restore' ? text('استعادة المدير', 'Restore manager') : text('حذف المدير', 'Remove manager')} onCancel={(event) => { event.preventDefault(); if (!busy) setConfirm(null); }}>
            {confirm ? <><header><h2>{confirm.type === 'restore' ? text('استعادة المدير', 'Restore manager') : text('حذف المدير', 'Remove manager')}</h2></header><div className="ws-manager-form-body">{feedback}<p><strong>{confirm.row.name}</strong></p><p>{confirm.type === 'restore' ? text('ستتم استعادة الحساب معطّلًا. يمكنك مراجعته ثم تفعيله من نموذج التعديل.', 'The account will be restored as inactive. Review it before enabling access in the edit form.') : text('سيتم إيقاف الحساب وتسجيل خروج جلساته. يمكنك استعادته لاحقًا من قائمة المحذوفين.', 'The account will be disabled and its sessions signed out. You can restore it later from the Removed list.')}</p></div><footer><button type="button" disabled={busy} onClick={() => setConfirm(null)}>{text('إلغاء', 'Cancel')}</button><button type="button" className="ws-managers-primary" disabled={busy} onClick={() => void run(() => confirm.type === 'restore' ? api.post(`${endpoint}/${confirm.row.id}/restore`, { version: confirm.row.version }) : api.delete(`${endpoint}/${confirm.row.id}`, { data: { version: confirm.row.version } }), confirm.type === 'restore' ? text('تمت استعادة الحساب معطّلًا.', 'Account restored as inactive.') : text('تم حذف المدير وإلغاء جلساته.', 'Manager removed and sessions revoked.'))}>{busy ? text('جارٍ التنفيذ…', 'Working…') : confirm.type === 'restore' ? text('استعادة', 'Restore') : text('حذف', 'Remove')}</button></footer></> : null}
        </dialog>
    </div>;
}
