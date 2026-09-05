import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineClock, HiOutlineXMark } from 'react-icons/hi2';

const fmt = (value) => { try { return value ? new Date(value).toLocaleString() : ''; } catch { return ''; } };

function Section({ title, rows, render }) {
    const { t } = useTranslation();
    return (
        <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
            {rows.length === 0 ? <p className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-400">{t('customizer_no_revisions', 'No revisions yet.')}</p> : <div className="space-y-1.5">{rows.map(render)}</div>}
        </section>
    );
}

/** Side drawer listing page and theme revisions with restore actions. */
export default function RevisionsDrawer({ open, onClose, pageRevisions, themeRevisions, onRestorePage, onRestoreTheme, busy }) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose} className="relative z-[120]">
            <DialogBackdrop transition className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition duration-200 data-closed:opacity-0" />
            <div className="fixed inset-0 flex justify-end">
                <DialogPanel transition className="flex h-full w-[min(92vw,22rem)] flex-col bg-white shadow-2xl transition duration-300 ease-out data-closed:translate-x-full data-closed:rtl:-translate-x-full">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                        <HiOutlineClock className="h-5 w-5 text-brand" aria-hidden />
                        <DialogTitle className="flex-1 text-sm font-semibold text-slate-900">{t('customizer_revisions', 'Revisions')}</DialogTitle>
                        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={t('close', 'Close')}><HiOutlineXMark className="h-5 w-5" aria-hidden /></button>
                    </div>
                    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
                        <Section
                            title={t('customizer_page_revisions', 'Page layout')}
                            rows={pageRevisions}
                            render={(r) => (
                                <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-700">#{r.revision_number ?? r.id} · {t('customizer_sections_count', { count: r.sections_count ?? 0, defaultValue: '{{count}} sections' })}</p>
                                        <p className="text-[11px] text-slate-400">{fmt(r.created_at)}</p>
                                    </div>
                                    <button type="button" disabled={busy} onClick={() => onRestorePage(r)} className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand-light/60 disabled:opacity-50">{t('customizer_restore', 'Restore')}</button>
                                </div>
                            )}
                        />
                        <Section
                            title={t('customizer_theme_revisions', 'Theme settings')}
                            rows={themeRevisions}
                            render={(r) => (
                                <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-700">{r.source || '—'}</p>
                                        <p className="text-[11px] text-slate-400">{fmt(r.created_at)}</p>
                                    </div>
                                    <button type="button" disabled={busy} onClick={() => onRestoreTheme(r)} className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand-light/60 disabled:opacity-50">{t('customizer_restore', 'Restore')}</button>
                                </div>
                            )}
                        />
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
