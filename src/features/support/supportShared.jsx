import { useTranslation } from 'react-i18next';
import api from '../../api/client';

export const CATEGORIES = ['general', 'billing', 'store_setup', 'domain', 'payments', 'shipping', 'technical', 'account'];
export const MERCHANT_PRIORITIES = ['low', 'normal', 'high'];
export const PRIORITIES = [...MERCHANT_PRIORITIES, 'urgent'];
export const STATUSES = ['open', 'awaiting_merchant', 'resolved', 'closed'];
export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_FILES = 'image/jpeg,image/png,image/webp,application/pdf';

const COPY = {
    category: {
        general: ['استفسار عام', 'General question'],
        billing: ['الفواتير والاشتراك', 'Billing & subscription'],
        store_setup: ['إعداد المتجر', 'Store setup'],
        domain: ['الدومين و SSL', 'Domain & SSL'],
        payments: ['بوابات الدفع', 'Payments'],
        shipping: ['الشحن', 'Shipping'],
        technical: ['مشكلة تقنية', 'Technical issue'],
        account: ['الحساب والدخول', 'Account & sign-in'],
    },
    status: {
        open: ['بانتظار الدعم', 'Waiting for support'],
        awaiting_merchant: ['بانتظار ردك', 'Waiting for your reply'],
        resolved: ['تم الحل', 'Resolved'],
        closed: ['مغلقة', 'Closed'],
    },
    staffStatus: {
        open: ['بانتظار الرد', 'Needs reply'],
        awaiting_merchant: ['بانتظار التاجر', 'Waiting for merchant'],
    },
    priority: {
        low: ['منخفضة', 'Low'],
        normal: ['عادية', 'Normal'],
        high: ['مرتفعة', 'High'],
        urgent: ['عاجلة', 'Urgent'],
    },
};

const STATUS_TONE = {
    open: 'bg-amber-50 text-amber-800 ring-amber-200',
    awaiting_merchant: 'bg-sky-50 text-sky-800 ring-sky-200',
    resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const PRIORITY_TONE = {
    low: 'text-slate-500',
    normal: 'text-slate-700',
    high: 'text-amber-700',
    urgent: 'text-red-700',
};

/** Bilingual copy helper used across the support screens (keeps support strings in one place). */
export function useSupportCopy() {
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar');
    const text = (a, e) => (ar ? a : e);
    const label = (group, key, staff = false) => {
        const pair = (staff && COPY.staffStatus[key] && group === 'status' ? COPY.staffStatus[key] : COPY[group]?.[key]) || [key, key];
        return text(pair[0], pair[1]);
    };
    const dateTime = (iso) => (iso ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : '');
    const relative = (iso) => {
        if (!iso) return '';
        const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
        const units = [['day', 86400], ['hour', 3600], ['minute', 60]];
        const rtf = new Intl.RelativeTimeFormat(ar ? 'ar' : 'en', { numeric: 'auto' });
        for (const [unit, size] of units) {
            if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
        }
        return rtf.format(0, 'minute');
    };
    return { ar, text, label, dateTime, relative };
}

export function StatusPill({ status, staff = false }) {
    const { label } = useSupportCopy();
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_TONE[status] || STATUS_TONE.closed}`}>
            {label('status', status, staff)}
        </span>
    );
}

export function PriorityLabel({ priority }) {
    const { label } = useSupportCopy();
    return <span className={`text-xs font-semibold ${PRIORITY_TONE[priority] || ''}`}>{label('priority', priority)}</span>;
}

export const errorText = (error) => Object.values(error?.response?.data?.errors || {}).flat().join(' ') || error?.response?.data?.message || error?.message || '';

/** Client-side check mirroring the API rules, so a bad file fails before upload. */
export function validateFiles(files, text) {
    if (files.length > MAX_FILES) return text(`يمكنك إرفاق ${MAX_FILES} ملفات كحد أقصى.`, `Attach up to ${MAX_FILES} files.`);
    const allowed = ACCEPTED_FILES.split(',');
    for (const file of files) {
        if (!allowed.includes(file.type)) return text(`الملف ${file.name} غير مدعوم. الصور و PDF فقط.`, `${file.name} is not supported. Images and PDF only.`);
        if (file.size > MAX_FILE_BYTES) return text(`الملف ${file.name} أكبر من 5 ميجابايت.`, `${file.name} is larger than 5 MB.`);
    }
    return '';
}

export function toFormData(fields, files) {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') form.append(key, value); });
    files.forEach((file) => form.append('attachments[]', file));
    return form;
}

/** Attachments are private: fetch with the session token, then hand the browser a blob URL. */
export async function openAttachment(url, name) {
    const { data } = await api.get(url, { responseType: 'blob' });
    const href = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = href;
    link.download = name || 'attachment';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30_000);
}

export const formatBytes = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
