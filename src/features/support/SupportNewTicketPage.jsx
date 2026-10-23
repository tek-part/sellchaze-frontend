import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';
import SupportFilePicker from './SupportFilePicker';
import { CATEGORIES, MERCHANT_PRIORITIES, errorText, toFormData, useSupportCopy, validateFiles } from './supportShared';

const control = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

export default function SupportNewTicketPage() {
    const { text, label } = useSupportCopy();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const preset = CATEGORIES.includes(params.get('category')) ? params.get('category') : 'general';
    const [form, setForm] = useState({ subject: '', category: preset, priority: 'normal', body: '' });
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const sending = useRef(false);
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    async function submit(e) {
        e.preventDefault();
        if (sending.current) return;
        const fileError = validateFiles(files, text);
        if (fileError) { setError(fileError); return; }
        sending.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.post('/support/tickets', toFormData(form, files));
            navigate(`/support/${data.data.id}`, { replace: true });
        } catch (err) {
            setError(errorText(err));
        } finally {
            sending.current = false; setBusy(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-5">
            <PageHeader title={text('تذكرة دعم جديدة', 'New support ticket')} subtitle={text('اشرح المشكلة بالتفصيل وأرفق لقطة شاشة إن أمكن.', 'Describe the problem in detail and attach a screenshot if you can.')}
                action={<Link to="/support" className="text-sm font-semibold text-slate-600 hover:text-slate-900">{text('كل التذاكر', 'All tickets')}</Link>} />
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" noValidate={false}>
                {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
                <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm sm:col-span-2"><span className="font-semibold text-slate-800">{text('الموضوع', 'Subject')}</span>
                        <input className={control} required minLength={3} maxLength={160} value={form.subject} onChange={set('subject')} placeholder={text('مثال: الدومين لا يفتح المتجر', 'e.g. My domain does not open the store')} /></label>
                    <label className="space-y-1.5 text-sm"><span className="font-semibold text-slate-800">{text('القسم', 'Category')}</span>
                        <select className={control} value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c} value={c}>{label('category', c)}</option>)}</select></label>
                    <label className="space-y-1.5 text-sm"><span className="font-semibold text-slate-800">{text('الأولوية', 'Priority')}</span>
                        <select className={control} value={form.priority} onChange={set('priority')}>{MERCHANT_PRIORITIES.map((p) => <option key={p} value={p}>{label('priority', p)}</option>)}</select></label>
                    <label className="space-y-1.5 text-sm sm:col-span-2"><span className="font-semibold text-slate-800">{text('التفاصيل', 'Details')}</span>
                        <textarea className={`${control} min-h-40`} required minLength={10} maxLength={5000} value={form.body} onChange={set('body')} dir="auto"
                            placeholder={text('ماذا حدث؟ ما الخطوات التي قمت بها؟ ما الذي توقعته؟', 'What happened? What steps did you take? What did you expect?')} /></label>
                    <div className="sm:col-span-2"><SupportFilePicker files={files} onChange={setFiles} disabled={busy} /></div>
                </fieldset>
                <div className="flex justify-end">
                    <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                        {busy ? <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
                        {text('إرسال التذكرة', 'Send ticket')}
                    </button>
                </div>
            </form>
        </div>
    );
}
