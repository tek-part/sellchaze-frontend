import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    HiOutlineArrowLeft,
    HiOutlineBuildingStorefront,
    HiOutlineChatBubbleLeftRight,
    HiOutlineClipboardDocumentList,
    HiOutlineDocumentArrowDown,
    HiOutlinePaperClip,
    HiOutlineShieldCheck,
    HiOutlineUser,
    HiOutlineXMark,
} from 'react-icons/hi2';
import api from '../api/client';
import SearchableSelect from '../components/ui/SearchableSelect';

const TICKET_STATUSES = [
    'open',
    'awaiting_supplier',
    'supplier_responded',
    'in_progress',
    'resolved',
    'closed',
];

const MAX_MESSAGE_FILES = 5;
const MAX_MESSAGE_FILE_BYTES = 20 * 1024 * 1024;

const ACTION_TYPES = [
    { value: 'return_slip', labelKey: 'ticket_action_return_slip' },
    { value: 'manual_return', labelKey: 'ticket_action_manual_return' },
    { value: 'warehouse_adjustment', labelKey: 'ticket_action_warehouse_adjustment' },
    { value: 'refund', labelKey: 'ticket_action_refund' },
    { value: 'other', labelKey: 'ticket_action_other' },
];

function unwrapData(res) {
    return res?.data?.data ?? res?.data ?? null;
}

function formatApiError(e) {
    const d = e?.response?.data;
    if (!d) {
        return e?.message ?? 'Error';
    }
    if (typeof d.message === 'string' && d.message.trim() !== '') {
        return d.message;
    }
    if (d.errors && typeof d.errors === 'object') {
        const first = Object.values(d.errors).flat()[0];
        if (first) {
            return Array.isArray(first) ? first[0] : first;
        }
    }
    return e?.message ?? 'Error';
}

function MessageAttachments({ attachments, t }) {
    const list = Array.isArray(attachments) ? attachments : [];
    if (list.length === 0) {
        return null;
    }
    return (
        <div className="mt-2 space-y-2">
            {list.map((a, idx) => (
                <div key={`${a.url}-${idx}`}>
                    {a.kind === 'image' ? (
                        <a href={a.url} target="_blank" rel="noreferrer" className="block">
                            <img
                                src={a.url}
                                alt=""
                                className="max-h-52 max-w-full rounded-lg object-contain ring-1 ring-black/10"
                            />
                        </a>
                    ) : a.kind === 'video' ? (
                        <video src={a.url} controls className="max-h-56 w-full rounded-lg ring-1 ring-black/10" preload="metadata" />
                    ) : (
                        <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex max-w-full items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-brand ring-1 ring-slate-200/80 hover:bg-white"
                        >
                            <HiOutlineDocumentArrowDown className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="truncate">{a.name || t('ticket_attachment_download')}</span>
                        </a>
                    )}
                </div>
            ))}
        </div>
    );
}

function statusBadgeClass(status) {
    const s = String(status ?? '').toLowerCase();
    if (['resolved', 'closed'].includes(s)) {
        return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200';
    }
    if (['awaiting_supplier'].includes(s)) {
        return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200';
    }
    if (['supplier_responded', 'in_progress'].includes(s)) {
        return 'bg-sky-50 text-sky-900 ring-1 ring-sky-200';
    }
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
}

export default function TicketDetailPage() {
    const { id } = useParams();
    const outlet = useOutletContext() ?? {};
    const permissions = Array.isArray(outlet.permissions) ? outlet.permissions : [];
    const can = (p) => permissions.includes(p);
    const canListTickets = permissions.includes('tickets-list');
    const canManage = can('tickets-manage');
    const { t, i18n } = useTranslation();

    const [row, setRow] = useState(null);
    const [err, setErr] = useState('');
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [statusEdit, setStatusEdit] = useState('');
    const [savingStatus, setSavingStatus] = useState(false);
    const [actionType, setActionType] = useState('other');
    const [actionNotes, setActionNotes] = useState('');
    const [savingAction, setSavingAction] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const fileInputRef = useRef(null);

    const load = useCallback(async () => {
        if (!id || !canListTickets) {
            return;
        }
        setErr('');
        try {
            const { data } = await api.get(`/tickets/${id}`);
            const d = unwrapData({ data });
            setRow(d);
            if (d?.status) {
                setStatusEdit(d.status);
            }
        } catch (e) {
            setErr(formatApiError(e));
            setRow(null);
        }
    }, [id, canListTickets]);

    useEffect(() => {
        void load();
    }, [load]);

    const typeLabel = useMemo(() => {
        const ty = row?.type;
        if (!ty) {
            return '—';
        }
        const key = `ticket_type_${ty}`;
        return t(key, { defaultValue: ty });
    }, [row?.type, t]);

    const statusLabel = (s) => t(`ticket_status_${s}`, { defaultValue: s ?? '—' });

    const roleLabel = (role) => {
        if (role === 'merchant') {
            return t('ticket_party_merchant');
        }
        if (role === 'supplier') {
            return t('ticket_party_supplier');
        }
        if (role === 'admin') {
            return t('ticket_party_admin');
        }
        return role ?? '—';
    };

    const bubbleClasses = (senderRole) => {
        if (senderRole === 'supplier') {
            return 'self-end bg-amber-50 text-amber-950 ring-amber-200/90';
        }
        return 'self-start bg-slate-50 text-slate-900 ring-slate-200/90';
    };

    const addPendingFiles = (fileList) => {
        // Snapshot immediately: clearing the input (below) empties the live FileList before React
        // runs the setState updater, so iterating fileList inside the updater would see zero files.
        const files = fileList?.length ? Array.from(fileList) : [];
        if (files.length === 0) {
            return;
        }
        setPendingFiles((prev) => {
            const next = [...prev];
            for (const f of files) {
                if (next.length >= MAX_MESSAGE_FILES) {
                    break;
                }
                if (f.size > MAX_MESSAGE_FILE_BYTES) {
                    toast.error(t('ticket_file_too_large'));
                    continue;
                }
                next.push(f);
            }
            return next;
        });
    };

    const sendReply = async () => {
        const body = reply.trim();
        if ((!body && pendingFiles.length === 0) || !id) {
            return;
        }
        setSending(true);
        try {
            const fd = new FormData();
            fd.append('body', body);
            pendingFiles.forEach((f) => {
                fd.append('attachments[]', f);
            });
            await api.post(`/tickets/${id}/messages`, fd);
            toast.success(t('ticket_reply_sent'));
            setReply('');
            setPendingFiles([]);
            await load();
        } catch (e) {
            const status = e.response?.status;
            if (status === 413) {
                toast.error(t('ticket_upload_failed'));
            } else {
                toast.error(formatApiError(e));
            }
        } finally {
            setSending(false);
        }
    };

    const saveStatus = async () => {
        if (!id || !statusEdit) {
            return;
        }
        setSavingStatus(true);
        try {
            await api.patch(`/tickets/${id}`, { status: statusEdit });
            toast.success(t('ticket_status_updated'));
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSavingStatus(false);
        }
    };

    const recordAction = async () => {
        if (!id) {
            return;
        }
        setSavingAction(true);
        try {
            await api.post(`/tickets/${id}/actions`, {
                action: actionType,
                notes: actionNotes.trim() || null,
            });
            toast.success(t('ticket_action_recorded'));
            setActionNotes('');
            await load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSavingAction(false);
        }
    };

    if (!can('tickets-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    const isSupplierViewer = row?.viewer?.role === 'supplier';
    const canEditTicketStatus = row && !isSupplierViewer;
    const canUseOperationalActions = canManage && !isSupplierViewer;

    const suppliers = Array.isArray(row?.order?.suppliers) ? row.order.suppliers : [];

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50/60 to-brand/6 px-5 py-7 shadow-[0_8px_40px_rgba(15,23,42,0.07)] sm:px-8">
                <div
                    className="pointer-events-none absolute -inset-e-16 -top-16 h-48 w-48 rounded-full bg-brand/[0.07] blur-3xl"
                    aria-hidden
                />
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
                            <HiOutlineChatBubbleLeftRight className="h-7 w-7" aria-hidden />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                {t('ticket_detail_title', { id })}
                            </h1>
                            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(row?.status)}`}
                                >
                                    {row?.status ? statusLabel(row.status) : '—'}
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="font-medium text-slate-700">{typeLabel}</span>
                                {row?.viewer?.role ? (
                                    <>
                                        <span className="text-slate-400">·</span>
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
                                            <HiOutlineShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden />
                                            {roleLabel(row.viewer.role)}
                                        </span>
                                    </>
                                ) : null}
                            </p>
                            {row?.order?.code ? (
                                <p className="mt-3">
                                    <Link
                                        to={`/orders/${encodeURIComponent(row.order.code)}`}
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
                                    >
                                        <HiOutlineClipboardDocumentList className="h-4 w-4" aria-hidden />
                                        {t('col_order')}: {row.order.code}
                                    </Link>
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <Link
                        to="/tickets"
                        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-xs backdrop-blur-xs transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                    >
                        <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                        {t('tickets')}
                    </Link>
                </div>
            </div>

            {err && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p>
            )}

            {row ? (
                <>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <motion.section
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
                        >
                            <div className="flex items-center gap-3 border-b border-slate-100 bg-linear-to-b from-sky-50/90 to-white px-5 py-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 ring-1 ring-sky-200/80">
                                    <HiOutlineUser className="h-5 w-5" aria-hidden />
                                </span>
                                <h2 className="text-base font-semibold text-slate-900">{t('ticket_party_merchant')}</h2>
                            </div>
                            <div className="space-y-2 p-5 text-sm text-slate-800">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('ticket_requester')}</p>
                                <p className="font-semibold text-slate-900">{row.requester?.name ?? '—'}</p>
                                {row.requester?.email ? (
                                    <p className="text-slate-600">{row.requester.email}</p>
                                ) : null}
                            </div>
                        </motion.section>

                        <motion.section
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
                        >
                            <div className="flex items-center gap-3 border-b border-slate-100 bg-linear-to-b from-amber-50/90 to-white px-5 py-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-200/80">
                                    <HiOutlineBuildingStorefront className="h-5 w-5" aria-hidden />
                                </span>
                                <h2 className="text-base font-semibold text-slate-900">{t('ticket_suppliers_on_order')}</h2>
                            </div>
                            <ul className="divide-y divide-slate-100 p-2">
                                {suppliers.length === 0 ? (
                                    <li className="px-3 py-6 text-center text-sm text-slate-500">{t('empty')}</li>
                                ) : (
                                    suppliers.map((s) => (
                                        <li key={s.id} className="flex flex-col gap-0.5 px-3 py-3 text-sm">
                                            <span className="font-semibold text-slate-900">{s.name || '—'}</span>
                                            {s.email ? <span className="text-xs text-slate-500">{s.email}</span> : null}
                                        </li>
                                    ))
                                )}
                            </ul>
                        </motion.section>
                    </div>

                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
                    >
                        <div className="border-b border-slate-100 bg-linear-to-b from-slate-50/90 to-white px-5 py-4">
                            <h2 className="text-base font-semibold text-slate-900">{t('ticket_section_complaint')}</h2>
                            <p className="mt-1 text-xs text-slate-500">{t('ticket_notes')}</p>
                        </div>
                        <div className="p-5">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                                {row.notes?.trim() ? row.notes : t('empty')}
                            </p>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
                    >
                        <div className="border-b border-slate-100 px-5 py-4">
                            <h2 className="text-base font-semibold text-slate-900">{t('ticket_section_thread')}</h2>
                        </div>
                        <div className="flex flex-col gap-3 p-4">
                            {(row.messages ?? []).length === 0 ? (
                                <p className="py-8 text-center text-sm text-slate-500">{t('empty')}</p>
                            ) : (
                                (row.messages ?? []).map((m) => (
                                    <div
                                        key={m.id}
                                        className={`flex max-w-[min(100%,28rem)] flex-col gap-1 rounded-2xl px-4 py-3 text-sm shadow-xs ring-1 ${bubbleClasses(m.sender_role)}`}
                                    >
                                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            <span className="rounded-md bg-white/60 px-1.5 py-0.5 text-[10px] text-slate-700 ring-1 ring-black/5">
                                                {roleLabel(m.sender_role)}
                                            </span>
                                            <span>{m.user?.name ?? '—'}</span>
                                            <span className="font-normal normal-case text-slate-400">
                                                {m.created_at
                                                    ? new Date(m.created_at).toLocaleString(
                                                          i18n.language?.startsWith('ar') ? 'ar' : undefined,
                                                      )
                                                    : ''}
                                            </span>
                                        </div>
                                        {m.body?.trim() ? (
                                            <p className="whitespace-pre-wrap text-slate-800">{m.body}</p>
                                        ) : null}
                                        <MessageAttachments attachments={m.attachments} t={t} />
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv"
                                onChange={(e) => {
                                    addPendingFiles(e.target.files);
                                    e.target.value = '';
                                }}
                            />
                            <label className="sr-only" htmlFor="ticket-reply">
                                {t('ticket_reply_placeholder')}
                            </label>
                            <textarea
                                id="ticket-reply"
                                rows={3}
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder={t('ticket_reply_placeholder')}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                            />
                            <p className="mt-2 text-xs text-slate-500">{t('ticket_attach_hint')}</p>
                            {pendingFiles.length > 0 ? (
                                <ul className="mt-2 flex flex-wrap gap-2">
                                    {pendingFiles.map((f, idx) => (
                                        <li
                                            key={`${f.name}-${f.size}-${idx}`}
                                            className="inline-flex max-w-full items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
                                        >
                                            <span className="truncate">{f.name}</span>
                                            <button
                                                type="button"
                                                className="shrink-0 rounded-sm p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                                onClick={() => setPendingFiles((p) => p.filter((_, i) => i !== idx))}
                                                aria-label={t('cancel')}
                                            >
                                                <HiOutlineXMark className="h-4 w-4" aria-hidden />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <button
                                    type="button"
                                    disabled={sending || pendingFiles.length >= MAX_MESSAGE_FILES}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <HiOutlinePaperClip className="h-4 w-4" aria-hidden />
                                    {t('ticket_attach_files')}
                                </button>
                                <button
                                    type="button"
                                    disabled={sending || (!reply.trim() && pendingFiles.length === 0)}
                                    onClick={() => void sendReply()}
                                    className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark disabled:pointer-events-none disabled:opacity-50"
                                >
                                    {sending ? '…' : t('ticket_send_reply')}
                                </button>
                            </div>
                        </div>
                    </motion.section>

                    {canEditTicketStatus ? (
                        <motion.section
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 }}
                            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
                        >
                            <div className="border-b border-slate-100 px-5 py-4">
                                <h2 className="text-base font-semibold text-slate-900">{t('ticket_section_status')}</h2>
                            </div>
                            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
                                <div className="min-w-0 flex-1">
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {t('col_status')}
                                    </label>
                                    <SearchableSelect
                                        value={statusEdit}
                                        onChange={(e) => setStatusEdit(e.target.value)}
                                        className="mt-1.5 w-full sm:max-w-md"
                                    >
                                        {TICKET_STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {statusLabel(s)}
                                            </option>
                                        ))}
                                    </SearchableSelect>
                                </div>
                                <button
                                    type="button"
                                    disabled={savingStatus || !statusEdit || statusEdit === row.status}
                                    onClick={() => void saveStatus()}
                                    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                                >
                                    {savingStatus ? '…' : t('ticket_save_status')}
                                </button>
                            </div>
                        </motion.section>
                    ) : null}

                    {canUseOperationalActions ? (
                        <motion.section
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.14 }}
                            className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-linear-to-b from-indigo-50/40 to-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
                        >
                            <div className="border-b border-indigo-100 px-5 py-4">
                                <h2 className="text-base font-semibold text-slate-900">{t('ticket_section_record_action')}</h2>
                            </div>
                            <div className="space-y-4 p-5">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {t('ticket_action_label')}
                                    </label>
                                    <SearchableSelect
                                        value={actionType}
                                        onChange={(e) => setActionType(e.target.value)}
                                        className="mt-1.5 w-full sm:max-w-md"
                                    >
                                        {ACTION_TYPES.map((a) => (
                                            <option key={a.value} value={a.value}>
                                                {t(a.labelKey)}
                                            </option>
                                        ))}
                                    </SearchableSelect>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {t('ticket_action_notes_optional')}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                                <button
                                    type="button"
                                    disabled={savingAction}
                                    onClick={() => void recordAction()}
                                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {savingAction ? '…' : t('ticket_action_record')}
                                </button>
                            </div>
                        </motion.section>
                    ) : null}

                    {(row.actions ?? []).length > 0 ? (
                        <motion.section
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
                        >
                            <div className="border-b border-slate-100 px-5 py-4">
                                <h2 className="text-base font-semibold text-slate-900">{t('ticket_actions')}</h2>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {(row.actions ?? []).map((a) => (
                                    <li key={a.id} className="px-5 py-4 text-sm">
                                        <p className="font-semibold text-slate-900">
                                            {t(`ticket_action_${a.action}`, { defaultValue: a.action })}
                                        </p>
                                        {a.performer?.name ? (
                                            <p className="mt-1 text-xs text-slate-500">{a.performer.name}</p>
                                        ) : null}
                                        {a.notes ? (
                                            <p className="mt-2 whitespace-pre-wrap text-slate-700">{a.notes}</p>
                                        ) : null}
                                        {a.created_at ? (
                                            <p className="mt-2 text-xs text-slate-400">
                                                {new Date(a.created_at).toLocaleString(
                                                    i18n.language?.startsWith('ar') ? 'ar' : undefined,
                                                )}
                                            </p>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </motion.section>
                    ) : null}
                </>
            ) : !err ? (
                <p className="flex items-center justify-center gap-2 py-16 text-slate-500">
                    <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-brand/40" aria-hidden />
                    {t('loading')}
                </p>
            ) : null}
        </div>
    );
}
