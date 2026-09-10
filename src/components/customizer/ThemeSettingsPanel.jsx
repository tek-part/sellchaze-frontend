import { useTranslation } from 'react-i18next';
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineArrowPath,
    HiOutlineChevronRight,
    HiOutlineLanguage,
    HiOutlinePhoto,
    HiOutlineRectangleGroup,
    HiOutlineShoppingBag,
    HiOutlineSparkles,
    HiOutlineSquares2X2,
    HiOutlineSwatch,
    HiOutlineWindow,
} from 'react-icons/hi2';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

/** Best-effort icon per `settings_schema` group id (theme manifests are free-form). */
const GROUP_ICON = [
    [/colou?r|palette|brand/i, HiOutlineSwatch],
    [/typo|font|text/i, HiOutlineLanguage],
    [/header|nav|announce/i, HiOutlineWindow],
    [/footer/i, HiOutlineRectangleGroup],
    [/product|cart|checkout|shop/i, HiOutlineShoppingBag],
    [/image|media|logo|favicon/i, HiOutlinePhoto],
    [/layout|grid|spacing/i, HiOutlineSquares2X2],
    [/social|effect|animation/i, HiOutlineSparkles],
];
export function groupIcon(group) {
    const key = `${group?.id || ''} ${group?.label || ''}`;
    return GROUP_ICON.find(([re]) => re.test(key))?.[1] || HiOutlineAdjustmentsHorizontal;
}

/**
 * Theme settings tab (left panel): the `settings_schema` groups as a navigable list. Picking a
 * group opens its fields in the inspector; the row stays highlighted while it is open.
 */
export default function ThemeSettingsPanel({ groups, status, error, onRetry, theme, selectedGroupId, onSelectGroup }) {
    const { t } = useTranslation();

    if (status === 'loading') {
        return (
            <div className="space-y-1 p-2">
                {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
        );
    }
    if (status === 'error') {
        return (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><HiOutlineSwatch className="h-6 w-6" aria-hidden /></span>
                <p className="text-[13px] font-semibold text-slate-800">{t('customizer_theme_unavailable', 'Theme settings are unavailable')}</p>
                <p className="text-xs leading-relaxed text-slate-500">{error || t('customizer_theme_unavailable_hint', 'Activate a theme first, or try again.')}</p>
                {onRetry ? <button type="button" onClick={onRetry} className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${FOCUS}`}><HiOutlineArrowPath className="h-4 w-4" aria-hidden />{t('action_retry', 'Retry')}</button> : null}
            </div>
        );
    }
    if (!groups?.length) {
        return <p className="px-6 py-14 text-center text-xs text-slate-400">{t('customizer_theme_no_settings', 'This theme has no settings.')}</p>;
    }

    return (
        <div className="p-2">
            {theme?.name ? (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
                    <HiOutlineSwatch className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{theme.name}</span>
                    <span className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold ${theme.isActive === false ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                        {theme.isActive === false ? t('editor_theme_inactive', 'Not active') : t('editor_theme_active', 'Active theme')}
                    </span>
                </div>
            ) : null}
            <ul className="space-y-0.5" role="list">
                {groups.map((group) => {
                    const Icon = groupIcon(group);
                    const selected = group.id === selectedGroupId;
                    const count = (group.fields || []).length;
                    return (
                        <li key={group.id}>
                            <button
                                type="button"
                                onClick={() => onSelectGroup(group.id)}
                                aria-current={selected ? 'true' : undefined}
                                className={`group flex w-full items-center gap-2.5 rounded-lg border px-2 py-2 text-start transition ${FOCUS} ${
                                    selected ? 'border-brand/30 bg-brand-light/70 text-brand-dark' : 'border-transparent text-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${selected ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-brand'}`}>
                                    <Icon className="h-4 w-4" aria-hidden />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className={`block truncate text-[13px] ${selected ? 'font-semibold' : 'font-medium'}`}>{group.label || group.id}</span>
                                    <span className={`block text-[11px] ${selected ? 'text-brand-dark/70' : 'text-slate-400'}`}>{t('editor_settings_count', { count, defaultValue: '{{count}} settings' })}</span>
                                </span>
                                <HiOutlineChevronRight className="h-4 w-4 shrink-0 text-slate-300 rtl:rotate-180" aria-hidden />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
