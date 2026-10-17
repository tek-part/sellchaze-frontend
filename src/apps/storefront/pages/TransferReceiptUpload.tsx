import { useRef, useState, type FormEvent } from 'react';
import { apiFetch } from '../api/client';
import { Button } from '../foundation/components';

export interface TransferProof { id: string; status: string; reference?: string | null; review_note?: string | null; created_at: string }
export default function TransferReceiptUpload({ token, proofs, ar, onUploaded, canUpload }: { token: string; proofs: ReadonlyArray<TransferProof>; ar: boolean; onUploaded: () => void; canUpload: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault(); if (!file || busy) return;
    setBusy(true); setError('');
    try {
      const body = new FormData(); body.append('token', token); body.append('file', file); body.append('reference', reference);
      await apiFetch('/checkout/receipt/upload', { method: 'POST', body });
      setFile(null); setReference(''); if (input.current) input.current.value = ''; onUploaded();
    } catch (failure) { setError(failure instanceof Error ? failure.message : (ar ? 'تعذر رفع الإيصال' : 'Receipt upload failed')); }
    finally { setBusy(false); }
  };
  const statuses: Record<string, string> = ar ? { pending: 'بانتظار مراجعة المتجر', accepted: 'تم قبول الإيصال', rejected: 'الإيصال مرفوض' } : { pending: 'Awaiting store review', accepted: 'Receipt accepted', rejected: 'Receipt rejected' };
  return <section style={{ marginTop: 24 }}><h3>{ar ? 'إيصال التحويل' : 'Transfer receipt'}</h3>
    <p>{ar ? 'رفع الإيصال لا يؤكد وصول المبلغ. يراجع المتجر التحويل ويؤكد الدفع.' : 'Uploading a receipt does not confirm payment. The store reviews the transfer before confirming it.'}</p>
    {proofs.map(proof => <div key={proof.id}><p>{statuses[proof.status] || proof.status}{proof.reference ? ` · ${proof.reference}` : ''}</p>{proof.review_note ? <p>{proof.review_note}</p> : null}</div>)}
    {canUpload && proofs.length < 3 ? <form onSubmit={event => { void submit(event); }} style={{ display: 'grid', gap: 12 }}>
      <label className="sf-field"><span>{ar ? 'مرجع التحويل (اختياري)' : 'Transfer reference (optional)'}</span><input className="sf-input" value={reference} maxLength={200} disabled={busy} onChange={event => setReference(event.target.value)} /></label>
      <label className="sf-field"><span>{ar ? 'صورة أو PDF — بحد أقصى 5 ميجابايت' : 'Image or PDF — up to 5 MB'}</span><input ref={input} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required disabled={busy} onChange={event => { const selected = event.target.files?.[0] || null; if (selected && selected.size > 5 * 1024 * 1024) { setError(ar ? 'الحد الأقصى 5 ميجابايت' : 'Maximum file size is 5 MB'); setFile(null); event.target.value = ''; } else { setFile(selected); setError(''); } }} /></label>
      {error ? <p role="alert">{error}</p> : null}<Button type="submit" loading={busy} disabled={!file || busy}>{ar ? 'إرسال الإيصال للمراجعة' : 'Submit receipt for review'}</Button>
    </form> : null}
  </section>;
}
