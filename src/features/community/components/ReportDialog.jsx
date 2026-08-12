import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineFlag } from 'react-icons/hi2';
import api from '../../../api/client';
import notify from '../../../components/ui/notify';

/** The reasons the backend accepts for POST /reports. */
const REASONS = ['spam', 'fraud', 'harassment', 'illegal', 'impersonation', 'other'];

/**
 * Report a post or a comment: a proper dialog with a reason picker and an
 * optional details box — replaces the old window.prompt flow.
 *
 * Controlled: render with `target={{ type: 'post'|'comment', id }}` to open,
 * `target={null}` to close (onClose clears it in the parent).
 */
export default function ReportDialog({ target, onClose }) {
    const { t } = useTranslation();
    const [reason, setReason] = useState('spam');
    const [details, setDetails] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        if (busy || !target) return;
        setBusy(true);
        try {
            await api.post('/reports', {
                target_type: target.type,
                target_id: target.id,
                reason,
                details: details.trim() || undefined,
            });
            notify.success(t('toast_reported', 'Report sent'), t('toast_reported_hint', 'Our team will review it.'));
            setDetails('');
            setReason('spam');
            onClose?.();
        } catch (error) {
            notify.error(t('toast_failed', 'Something went wrong'), error?.response?.data?.message || '');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={!!target} onClose={() => onClose?.()} className="relative z-[90]">
            <DialogBackdrop transition className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition duration-200 data-closed:opacity-0" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel
                    transition
                    className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200/80 transition duration-200 data-closed:scale-95 data-closed:opacity-0"
                >
                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100">
                            <HiOutlineFlag className="h-5 w-5" aria-hidden />
                        </span>
                        {t('report_title', 'Report content')}
                    </DialogTitle>

                    <form onSubmit={submit} className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-1.5">
                            {REASONS.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setReason(value)}
                                    aria-pressed={reason === value}
                                    className={`sc-press rounded-xl px-3 py-2 text-sm font-bold transition ${
                                        reason === value ? 'bg-red-500 text-white shadow-md shadow-red-500/25' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                                    }`}
                                >
                                    {t(`report_reason_${value}`, value)}
                                </button>
                            ))}
                        </div>

                        <label className="block text-xs font-bold text-slate-600">
                            {t('report_details', 'Details (optional)')}
                            <textarea
                                rows={3}
                                value={details}
                                onChange={(event) => setDetails(event.target.value)}
                                maxLength={2000}
                                className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => onClose?.()}
                                className="sc-press rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200/70"
                            >
                                {t('action_cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={busy}
                                className="sc-press rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-500/25 transition hover:bg-red-600 disabled:opacity-50"
                            >
                                {busy ? t('sending', 'Sending…') : t('report_submit', 'Send report')}
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
