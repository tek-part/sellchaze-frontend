import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';
import MetricDateRange from '../../dashboard/MetricDateRange';
import { metricPreset } from '../../dashboard/metric-range';

export default function OrderExportDialog({ open, onClose, apiBase, filters, ar, theme, onQueued }) {
    const text = (a, e) => ar ? a : e; const [range, setRange] = useState(() => metricPreset('seven', new Date(), ar)); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [queued, setQueued] = useState(null); const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
    async function start() {
        if (busy) return; setBusy(true); setError('');
        try { const { data } = await api.post(`${apiBase}/orders/exports`, { ...filters, date_from: range.from, date_to: range.to, request_key: requestKey }); setQueued(data.data); onQueued(data.data); }
        catch (e) { setError(e.response?.status === 429 ? text('يرجى الانتظار خمس دقائق بين عمليات التصدير.', 'Please wait five minutes between exports.') : e.response?.data?.message || e.message); }
        finally { setBusy(false); }
    }
    return <Dialog open={open} onClose={() => { if (!busy) onClose(); }} className="ws-orders-dialog" dir={ar ? 'rtl' : 'ltr'} data-workspace-theme={theme}><DialogBackdrop className="ws-orders-backdrop" /><div className="ws-orders-dialog-position"><DialogPanel className="ws-orders-export-panel"><DialogTitle>{text('تصدير الطلبات', 'Export orders')}</DialogTitle><div className="ws-orders-export-content">{queued ? <><h3>{text('تم طلب التصدير', 'Export requested')}</h3><p role="status">{text('سيُضاف الملف إلى الإشعارات عند اكتماله. يمكنك متابعة حالة التصدير من هذه الصفحة.', 'The file will appear in notifications when ready. You can also follow its status on this page.')}</p><Link to="/notifications" onClick={onClose}>{text('عرض الإشعارات', 'View notifications')}</Link></> : <><h3>{text('يمكنك استخدام خاصية التصدير مرة كل 5 دقائق لمنع الاستخدام التعسفي.', 'You can export once every five minutes to prevent misuse.')}</h3><p>{text('سيتم إنشاء الملف وإضافته في الإشعارات فور انتهاء التصدير. برجاء زيارة الإشعارات خلال دقائق من بدء التصدير.', 'The file will be generated and added to notifications when the export finishes. Check notifications a few minutes after requesting it.')}</p><h3>{text('برجاء اختيار تاريخ البدء وتاريخ الانتهاء', 'Choose the start and end date')}</h3><MetricDateRange value={range} ar={ar} theme={theme} onApply={next => { setRange(next); setRequestKey(crypto.randomUUID()); }} /></>}{error ? <p role="alert" className="ws-orders-error">{error}</p> : null}</div><footer><button type="button" disabled={busy} onClick={queued ? onClose : start}>{busy ? text('جارٍ إرسال الطلب…', 'Requesting…') : queued ? text('إغلاق', 'Close') : text('تصدير', 'Export')}</button></footer></DialogPanel></div></Dialog>;
}
