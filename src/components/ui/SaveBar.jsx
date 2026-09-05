import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlineExclamationCircle } from 'react-icons/hi2';

/**
 * Sticky "unsaved changes" bar. Renders nothing until `dirty` is true, then
 * pins itself to the bottom of the scroll area with Discard / Save actions.
 */
export default function SaveBar({ dirty, saving = false, onSave, onReset, saveLabel, message }) {
    const { t } = useTranslation();
    if (!dirty) return null;

    return (
        <div className="sticky bottom-3 z-20 mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_18px_50px_-20px_rgba(15,23,42,.35)] ring-1 ring-brand/10 backdrop-blur">
                <p className="flex items-center gap-2 text-sm text-slate-700">
                    <HiOutlineExclamationCircle className="h-5 w-5 text-amber-500" aria-hidden />
                    {message || t('ui_unsaved_changes', 'You have unsaved changes.')}
                </p>
                <div className="flex items-center gap-2">
                    {onReset ? (
                        <button
                            type="button"
                            onClick={onReset}
                            disabled={saving}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            {t('ui_discard', 'Discard')}
                        </button>
                    ) : null}
                    <button
                        type={onSave ? 'button' : 'submit'}
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-50"
                    >
                        {saving ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" aria-hidden /> : null}
                        {saving ? t('ui_saving', 'Saving…') : (saveLabel || t('ui_save_changes', 'Save changes'))}
                    </button>
                </div>
            </div>
        </div>
    );
}
