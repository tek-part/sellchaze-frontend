import { useTranslation } from 'react-i18next';
import { HiOutlineDocumentDuplicate } from 'react-icons/hi2';

/** Native labels for the locales the platform ships; anything else falls back to `locale_{code}` or the code. */
const NATIVE_LABELS = {
    ar: 'العربية',
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español',
    tr: 'Türkçe',
};

export function localeLabel(code, t) {
    const key = `locale_${code}`;
    const translated = t ? t(key, '') : '';
    return translated || NATIVE_LABELS[code] || String(code).toUpperCase();
}

function dotClass(entry) {
    if (!entry || entry.total === 0) return 'bg-slate-300';
    if (entry.ratio >= 1) return 'bg-emerald-500';
    if (entry.filled > 0) return 'bg-amber-400';
    return 'bg-slate-300';
}

/**
 * Language pills for any multi-language editor.
 *
 *   <LocaleTabs locales={['ar','en']} value={locale} onChange={setLocale}
 *               defaultLocale="ar" completeness={{ ar: { filled, total, ratio }, en: … }}
 *               onCopyFrom={(from, to) => …} size="md" />
 *
 * - `completeness` (optional, from `src/lib/localized.js#completeness`) draws a status dot per pill:
 *   green = complete, amber = partial, grey = empty. The tooltip carries the counts.
 * - `onCopyFrom(from, to)` (optional) renders a "Copy from {other}" button for the active tab —
 *   one per other locale — so a merchant can seed a translation from an existing copy.
 * - `size`: `md` (page-level) or `sm` (inline, per-field).
 * - RTL-safe: uses logical spacing only and marks each pill with its own `lang`/`dir`.
 */
export default function LocaleTabs({
    locales = ['ar', 'en'],
    value,
    onChange,
    defaultLocale,
    completeness,
    onCopyFrom,
    size = 'md',
    className = '',
    label,
}) {
    const { t } = useTranslation();
    const sm = size === 'sm';
    const list = Array.isArray(locales) && locales.length ? locales : ['ar', 'en'];
    const active = list.includes(value) ? value : list[0];
    const others = onCopyFrom ? list.filter((l) => l !== active) : [];

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            <div
                role="tablist"
                aria-label={label || t('locale_tabs_label', 'Content language')}
                className={`inline-flex rounded-xl border border-slate-200 bg-white shadow-xs ${sm ? 'p-0.5' : 'p-1'}`}
            >
                {list.map((code) => {
                    const entry = completeness?.[code];
                    const selected = code === active;
                    const isDefault = defaultLocale && code === defaultLocale;
                    const title = entry && entry.total > 0
                        ? t('translation_progress', { filled: entry.filled, total: entry.total, defaultValue: '{{filled}}/{{total}} translated' })
                        : undefined;
                    return (
                        <button
                            key={code}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            lang={code}
                            dir={code === 'ar' ? 'rtl' : 'ltr'}
                            title={title}
                            onClick={() => onChange?.(code)}
                            className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition ${
                                sm ? 'px-2 py-0.5 text-[11px]' : 'px-3.5 py-1.5 text-sm'
                            } ${selected ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {completeness ? (
                                <span
                                    aria-hidden
                                    className={`inline-block shrink-0 rounded-full ring-1 ring-white/70 ${sm ? 'h-1.5 w-1.5' : 'h-2 w-2'} ${dotClass(entry)}`}
                                />
                            ) : null}
                            <span>{localeLabel(code, t)}</span>
                            {isDefault && !sm ? (
                                <span className={`rounded-md px-1 text-[10px] font-medium uppercase tracking-wide ${selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {t('locale_default_badge', 'Default')}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {others.map((from) => (
                <button
                    key={from}
                    type="button"
                    onClick={() => onCopyFrom(from, active)}
                    className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-600 transition hover:bg-slate-50 hover:text-brand ${
                        sm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1.5 text-xs'
                    }`}
                >
                    <HiOutlineDocumentDuplicate className={sm ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden />
                    {t('copy_from_locale', { locale: localeLabel(from, t), defaultValue: 'Copy from {{locale}}' })}
                </button>
            ))}
        </div>
    );
}
