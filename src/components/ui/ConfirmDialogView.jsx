import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineTrash, HiOutlineExclamationTriangle, HiOutlineQuestionMarkCircle } from '../workspace/WorkspaceIcons';

/**
 * The dialog itself, split from `confirmDialog.jsx` so Headless UI's Dialog stays out of the
 * dashboard's entry chunk. <ConfirmDialogHost> loads it on idle and renders it once a confirmation
 * is first requested.
 */
const ICONS = {
    danger: HiOutlineTrash,
    warning: HiOutlineExclamationTriangle,
    question: HiOutlineQuestionMarkCircle,
};

export default function ConfirmDialogView({ state, settle }) {
    const { t } = useTranslation();
    const open = !!state;
    const o = state?.options ?? {};
    const danger = o.danger !== false; // default: destructive (delete) styling
    const Icon = ICONS[o.icon] ?? (danger ? HiOutlineTrash : HiOutlineQuestionMarkCircle);

    return (
        <Dialog open={open} onClose={() => settle(false)} className="relative z-[200]">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition duration-150 data-[closed]:opacity-0"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel
                    transition
                    className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-200/80 transition duration-150 data-[closed]:scale-95 data-[closed]:opacity-0"
                >
                    <div
                        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                            danger ? 'bg-red-100 text-red-600' : 'bg-brand/10 text-brand'
                        }`}
                    >
                        <Icon className="h-7 w-7" aria-hidden />
                    </div>

                    <DialogTitle className="mt-4 text-lg font-bold text-slate-900">
                        {o.title ?? t('confirm_title', 'Are you sure?')}
                    </DialogTitle>
                    {o.text ? <p className="mt-2 text-sm leading-relaxed text-slate-500">{o.text}</p> : null}

                    <div className="mt-6 flex gap-2">
                        <button
                            type="button"
                            onClick={() => settle(false)}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            {o.cancelText ?? t('action_cancel', 'Cancel')}
                        </button>
                        <button
                            type="button"
                            autoFocus
                            onClick={() => settle(true)}
                            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition ${
                                danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-dark'
                            }`}
                        >
                            {o.confirmText ?? (danger ? t('action_delete', 'Delete') : t('action_confirm', 'Confirm'))}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
