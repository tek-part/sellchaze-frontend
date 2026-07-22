import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

export default function ConfirmDialog({
    open,
    onClose,
    title,
    body,
    confirmLabel,
    cancelLabel,
    onConfirm,
    danger,
    loading,
}) {
    return (
        <Dialog open={open} onClose={loading ? () => {} : onClose} className="relative z-100">
            <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <DialogTitle className="text-lg font-bold text-slate-900">{title}</DialogTitle>
                    {body != null ? <div className="mt-2 text-sm text-slate-600">{body}</div> : null}
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => void onConfirm()}
                            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-xs disabled:opacity-50 ${
                                danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-dark'
                            }`}
                        >
                            {loading ? '…' : confirmLabel}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
