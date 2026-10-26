import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

/**
 * Contact details drawer for the open chat. Rarely opened, so the inbox lazy-loads it on first use
 * (it only mounts while open; it has no close transition, so that is behaviour-identical).
 */
export default function WavexContactPanel({ t, effectiveChatId, headerAvatarUrl, headerTitle, headerInitials, copyJid, onReloadThread, onClose }) {
    return (
        <Dialog open onClose={onClose} className="relative z-220">
            <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
            <div className="fixed inset-0 flex justify-end">
                <DialogPanel className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <DialogTitle className="text-base font-bold text-slate-900">
                            {t('wavex_contact_info')}
                        </DialogTitle>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                        >
                            {t('wavex_contact_close')}
                        </button>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                        {!effectiveChatId ? (
                            <p className="text-sm text-slate-500">{t('wavex_wa_select_chat')}</p>
                        ) : (
                            <>
                                <div className="flex flex-col items-center gap-2">
                                    {headerAvatarUrl ? (
                                        <img
                                            src={headerAvatarUrl}
                                            alt=""
                                            referrerPolicy="no-referrer"
                                            className="h-24 w-24 rounded-full object-cover shadow-md ring-2 ring-slate-100"
                                        />
                                    ) : (
                                        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-[#128c7e] to-[#075e54] text-2xl font-bold text-white shadow-md">
                                            {headerInitials}
                                        </span>
                                    )}
                                    <p className="text-center font-semibold text-slate-900">{headerTitle}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                        {t('wavex_contact_jid')}
                                    </p>
                                    <p className="mt-1 break-all font-mono text-sm text-slate-800">
                                        {effectiveChatId}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void copyJid()}
                                        className="rounded-xl bg-[#128c7e] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#075e54]"
                                    >
                                        {t('wavex_contact_copy_jid')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onReloadThread();
                                            onClose();
                                        }}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                    >
                                        {t('wavex_reload_thread')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
