import { useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineClipboardDocument, HiOutlineEye, HiOutlinePencil, HiOutlineChevronUpDown, HiOutlineChevronUp, HiOutlineChevronDown, HiOutlinePlayCircle } from '../components/workspace/WorkspaceIcons';
import ConfirmDialog from '../components/ConfirmDialog';
import { funnelCopy, funnelError } from '../components/store/funnels/funnelCopy';
import '../components/store/funnels/funnel-workspace.css';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';

export default function StoreFunnelsPage() {
    const { i18n } = useTranslation(); const c = funnelCopy[i18n.language?.startsWith('ar') ? 'ar' : 'en'];
    const { apiBase, uiBase } = useStoreScope(); const { access } = useOutletContext();
    const [page, setPage] = useState(1); const [perPage, setPerPage] = useState(25);
    const [sort, setSort] = useState('created_at'); const [direction, setDirection] = useState('desc');
    const [data, setData] = useState({ data: [], meta: {} }); const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState(false); const [guide, setGuide] = useState(false);
    const [error, setError] = useState(''); const [reload, setReload] = useState(0);
    const allowed = access?.canStorePages;
    useEffect(() => {
        if (!allowed) return undefined;
        let active = true; const controller = new AbortController();
        setLoading(true); setSelected([]); setError('');
        api.get(`${apiBase}/funnels`, { params: { page, per_page: perPage, sort, direction }, signal: controller.signal })
            .then(({ data: result }) => { if (active) { if (result.data.length === 0 && page > result.meta.last_page) setPage(Math.max(1, result.meta.last_page)); else setData(result); } })
            .catch(e => { if (active) setError(funnelError(e)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [allowed, apiBase, page, perPage, sort, direction, reload]);
    function changeSort(column) { setDirection(sort === column && direction === 'asc' ? 'desc' : 'asc'); setSort(column); setPage(1); }
    async function copyCode(code) {
        try { await navigator.clipboard.writeText(code); toast.success(c.copied); } catch { toast.error(c.copyFailed); }
    }
    async function remove() {
        setBusy(true); setError('');
        try { await api.post(`${apiBase}/funnels/bulk-delete`, { ids: selected }); setConfirm(false); setSelected([]); setReload(value => value + 1); }
        catch (e) { setError(funnelError(e)); setConfirm(false); } finally { setBusy(false); }
    }
    function heading(column, label) {
        const Icon = sort === column ? direction === 'asc' ? HiOutlineChevronUp : HiOutlineChevronDown : HiOutlineChevronUpDown;
        return <th scope="col" aria-sort={sort === column ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" onClick={() => changeSort(column)} disabled={busy} aria-label={`${c.sortBy} ${label} ${sort === column && direction === 'asc' ? c.sortDescending : c.sortAscending}`}>{label}<Icon aria-hidden /></button></th>;
    }
    if (!allowed) return <Navigate to={`${uiBase}/overview`} replace />;
    const rows = data.data; const allSelected = rows.length > 0 && rows.every(row => selected.includes(row.id));
    return <div className="fw-workspace">
        <header className="fw-header"><h1>{c.title}</h1><p>{c.subtitle}</p><button type="button" className="fw-guide" onClick={() => setGuide(true)}><HiOutlinePlayCircle aria-hidden />{c.title}</button></header>
        <div className="fw-list-toolbar">
            {selected.length > 0 ? <div className="fw-selection" role="status"><button type="button" onClick={() => setSelected([])} disabled={busy}>{c.clearSelection}</button><span>{selected.length} {c.selectedCount}</span><button type="button" className="fw-delete" onClick={() => setConfirm(true)} disabled={busy}><HiOutlineTrash aria-hidden />{c.delete}</button></div> : <span />}
            <Link to={`${uiBase}/funnels/create`} className="fw-new"><HiOutlinePlus aria-hidden />{c.create}</Link>
        </div>
        {error ? <div className="fw-error" role="alert">{error}<button type="button" onClick={() => setReload(value => value + 1)}>{c.retry}</button></div> : null}
        <div className="fw-table-wrap"><table className="fw-table" aria-label={c.title} aria-busy={loading}>
            <colgroup>{[3.4, 14, 8, 29, 11, 9, 15, 10.6].map((width, i) => <col key={i} style={{ width: `${width}%` }} />)}</colgroup>
            <thead><tr><th scope="col"><input type="checkbox" aria-label={c.selectAll} checked={allSelected} disabled={loading || busy || rows.length === 0} ref={node => { if (node) node.indeterminate = selected.length > 0 && !allSelected; }} onChange={() => setSelected(allSelected ? [] : rows.map(row => row.id))} /></th>{heading('title', c.name)}{heading('slug', c.slug)}{heading('public_id', c.code)}{heading('status', c.status)}<th scope="col">{c.view}</th><th scope="col"><span className="sr-only">{c.edit}</span></th><th scope="col"><span className="sr-only">{c.duplicate}</span></th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={8}><p className="fw-empty" role="status">{c.loading}</p></td></tr> : rows.length === 0 ? <tr><td colSpan={8}><p className="fw-empty">{c.empty}</p></td></tr> : rows.map(funnel => <tr key={funnel.id} data-selected={selected.includes(funnel.id) || undefined}>
                <td><input type="checkbox" aria-label={`${c.selectRow}: ${funnel.title}`} disabled={busy} checked={selected.includes(funnel.id)} onChange={() => setSelected(value => value.includes(funnel.id) ? value.filter(id => id !== funnel.id) : [...value, funnel.id])} /></td>
                <td>{funnel.title}</td><td><span dir="ltr">{funnel.slug}</span></td>
                <td><button type="button" className="fw-code" onClick={() => void copyCode(funnel.code)} aria-label={`${c.copyCode}: ${funnel.title}`}><HiOutlineClipboardDocument aria-hidden /><span dir="ltr">{funnel.code}</span></button></td>
                <td><span className={`fw-status fw-status-${funnel.status}`}>{c[funnel.status] || funnel.status}</span></td>
                <td>{funnel.is_public && funnel.public_url ? <a className="fw-view" href={funnel.public_url} target="_blank" rel="noopener noreferrer" aria-label={`${c.view}: ${funnel.title}`}><HiOutlineEye aria-hidden /></a> : <button type="button" className="fw-view" disabled title={c.publishFirst} aria-label={`${c.view}: ${funnel.title} — ${c.publishFirst}`}><HiOutlineEye aria-hidden /></button>}</td>
                <td><Link className="fw-edit" to={`${uiBase}/funnels/${funnel.id}/edit`}><HiOutlinePencil aria-hidden />{c.edit}</Link></td>
                <td><Link className="fw-clone" to={`${uiBase}/funnels/create?clone=${encodeURIComponent(funnel.code)}`}>{c.duplicate}</Link></td>
            </tr>)}</tbody>
        </table></div>
        <nav className="fw-pagination" aria-label={c.title}><label>{c.perPage}<select value={perPage} disabled={busy} onChange={event => { setPerPage(Number(event.target.value)); setPage(1); }}>{[10, 25, 50, 100].map(value => <option key={value} value={value}>{value}</option>)}</select></label><span>{data.meta.from || 0}–{data.meta.to || 0} {c.of} {data.meta.total || 0}</span><button type="button" disabled={page <= 1 || loading || busy} onClick={() => setPage(value => value - 1)} aria-label={c.previous}><HiOutlineChevronUp className="fw-page-prev" aria-hidden /></button><button type="button" disabled={page >= (data.meta.last_page || 1) || loading || busy} onClick={() => setPage(value => value + 1)} aria-label={c.nextPage}><HiOutlineChevronDown className="fw-page-next" aria-hidden /></button></nav>
        <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title={c.deleteTitle} body={<><p>{c.deleteBody}</p><p>{selected.length} {c.selectedCount}</p></>} danger loading={busy} onConfirm={remove} confirmLabel={c.delete} cancelLabel={c.cancel} />
        <Dialog open={guide} onClose={() => setGuide(false)} className="fw-dialog"><DialogBackdrop className="fw-backdrop" /><div className="fw-dialog-position"><DialogPanel className="fw-guide-panel"><DialogTitle>{c.guideTitle}</DialogTitle><ol>{c.guideSteps.map(step => <li key={step}>{step}</li>)}</ol><button type="button" className="fw-button" onClick={() => setGuide(false)}>{c.close}</button></DialogPanel></div></Dialog>
    </div>;
}
