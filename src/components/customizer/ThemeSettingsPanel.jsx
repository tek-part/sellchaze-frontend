import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlineChevronDown, HiOutlineSwatch } from 'react-icons/hi2';
import SettingsForm from './SettingsForm';

/**
 * Theme settings tab: `settings_schema` groups rendered as accordions with the shared field renderer.
 * `values`/`onChange` operate on the whole draft settings object.
 */
export default function ThemeSettingsPanel({ groups, values, onChange, status, error, onRetry, themeName, locales, defaultLocale, editLocale, viewport, apiBase }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(() => new Set(groups?.[0]?.id ? [groups[0].id] : []));
    const toggle = (id) => setOpen((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

    if (status === 'loading') {
        return (
            <div className="space-y-2 p-3">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
        );
    }
    if (status === 'error') {
        return (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><HiOutlineSwatch className="h-6 w-6" aria-hidden /></span>
                <p className="text-sm font-semibold text-slate-800">{t('customizer_theme_unavailable', 'Theme settings are unavailable')}</p>
                <p className="text-xs leading-relaxed text-slate-500">{error || t('customizer_theme_unavailable_hint', 'Activate a theme first, or try again.')}</p>
                {onRetry ? <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><HiOutlineArrowPath className="h-4 w-4" aria-hidden />{t('action_retry', 'Retry')}</button> : null}
            </div>
        );
    }
    if (!groups?.length) {
        return <p className="px-6 py-14 text-center text-xs text-slate-400">{t('customizer_theme_no_settings', 'This theme has no settings.')}</p>;
    }

    return (
        <div className="p-3">
            {themeName ? <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{themeName}</p> : null}
            <div className="space-y-2">
                {groups.map((group) => {
                    const isOpen = open.has(group.id);
                    return (
                        <section key={group.id} className={`overflow-hidden rounded-xl border bg-white transition ${isOpen ? 'border-brand/30 shadow-xs' : 'border-slate-200/80'}`}>
                            <button type="button" onClick={() => toggle(group.id)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-start">
                                <span className="text-sm font-semibold text-slate-800">{group.label || group.id}</span>
                                <span className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400">{(group.fields || []).length}</span>
                                    <HiOutlineChevronDown className={`h-4 w-4 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                                </span>
                            </button>
                            {isOpen ? (
                                <div className="border-t border-slate-100 px-3 py-3">
                                    <SettingsForm
                                        fields={group.fields || []}
                                        values={values}
                                        onChange={onChange}
                                        locales={locales}
                                        defaultLocale={defaultLocale}
                                        editLocale={editLocale}
                                        viewport={viewport}
                                        apiBase={apiBase}
                                    />
                                </div>
                            ) : null}
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
