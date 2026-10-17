import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function StoreOrderTransferProofs({ endpoint, ar, canManage, paid }) {
    const [rows, setRows] = useState([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [review, setReview] = useState(null); const [note, setNote] = useState('');
    useEffect(() => { let active = true; api.get(`${endpoint}/payment/proofs`).then(({ data }) => { if (active) setRows(data.data || []); }).catch(() => { if (active) setError(ar ? 'تعذر تحميل إيصالات التحويل' : 'Unable to load transfer receipts'); }); return () => { active = false; }; }, [endpoint, ar, paid]);
    const download = async row => {
        setBusy(true); setError('');
        try { const response = await api.get(`${endpoint}/payment/proofs/${row.id}`, { responseType: 'blob' }); const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = `transfer-receipt.${row.mime === 'application/pdf' ? 'pdf' : row.mime === 'image/jpeg' ? 'jpg' : row.mime === 'image/webp' ? 'webp' : 'png'}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
        catch { setError(ar ? 'تعذر تنزيل الإيصال' : 'Unable to download receipt'); } finally { setBusy(false); }
    };
    const reject = async event => {
        event.preventDefault(); if (busy) return; setBusy(true); setError('');
        try { const { data } = await api.post(`${endpoint}/payment/proofs/${review}/reject`, { note }); setRows(data.data); setReview(null); setNote(''); }
        catch (failure) { setError(failure.response?.data?.message || failure.message); } finally { setBusy(false); }
    };
    const labels = ar ? { pending: 'بانتظار المراجعة', accepted: 'مقبول', rejected: 'مرفوض' } : { pending: 'Pending review', accepted: 'Accepted', rejected: 'Rejected' };
    return <section style={{ marginTop: 16 }}><h3>{ar ? 'إيصالات التحويل' : 'Transfer receipts'}</h3>{error ? <p role="alert">{error}</p> : null}{rows.length ? rows.map(row => <div key={row.id} style={{ paddingBlock: 12, borderBottom: '1px solid #e3e8ef' }}><p>{labels[row.status] || row.status} · {row.reference || '—'}</p><button type="button" disabled={busy} onClick={() => { void download(row); }}>{ar ? 'تنزيل الإيصال' : 'Download receipt'}</button>{canManage && !paid && row.status === 'pending' ? <button type="button" disabled={busy} style={{ marginInlineStart: 12 }} onClick={() => { setReview(row.id); setNote(''); }}>{ar ? 'رفض الإيصال' : 'Reject receipt'}</button> : null}{row.review_note ? <p>{row.review_note}</p> : null}</div>) : <p>{ar ? 'لم يُرفع إيصال بعد.' : 'No receipt uploaded yet.'}</p>}{review ? <form onSubmit={reject}><label>{ar ? 'سبب الرفض — يظهر للعميل' : 'Rejection reason — visible to the customer'}<textarea required maxLength={2000} value={note} onChange={event => setNote(event.target.value)} /></label><button type="submit" disabled={busy}>{ar ? 'تأكيد الرفض' : 'Confirm rejection'}</button><button type="button" disabled={busy} onClick={() => setReview(null)}>{ar ? 'إلغاء' : 'Cancel'}</button></form> : null}</section>;
}
