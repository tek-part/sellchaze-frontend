import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowLeft,
    HiOutlineBars2,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineDocumentDuplicate,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineMagnifyingGlass,
    HiOutlinePlus,
    HiOutlineSquaresPlus,
    HiOutlineTrash,
} from 'react-icons/hi2';
import { pickLocalized } from '../../lib/localized';
import { categoryIcon, sectionIcon } from './sectionIcons';
import { groupByCategory } from './customizerUtils';

/** Human title for a section row: schema label, plus the first text setting as a subtitle. */
function sectionTitle(section, schema, locale, defaultLocale) {
    const label = schema?.label || section.type;
    const textField = (schema?.settings || []).find((f) => ['text'].includes(f.type));
    const raw = textField ? section.settings?.[textField.id] : null;
    const subtitle = raw && typeof raw === 'object' ? pickLocalized(raw, locale, defaultLocale) : raw;
    return { label, subtitle: typeof subtitle === 'string' ? subtitle.trim() : '' };
}

/**
 * Ordered section list with hover actions, drag-and-drop reorder (HTML5) and ↑/↓ buttons.
 */
export function SectionList({ sections, schema, selectedId, locale, defaultLocale, onSelect, onMove, onReorder, onDuplicate, onRemove, onToggleVisible, onAdd }) {
    const { t } = useTranslation();
    const [dragIndex, setDragIndex] = useState(null);
    const [overIndex, setOverIndex] = useState(null);

    if (!sections.length) {
        return (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-light text-brand"><HiOutlineSquaresPlus className="h-7 w-7" aria-hidden /></span>
                <p className="text-sm font-semibold text-slate-800">{t('customizer_empty_title', 'No sections yet')}</p>
                <p className="text-xs leading-relaxed text-slate-500">{t('customizer_empty_body', 'Add your first section to start building this page.')}</p>
                <button type="button" onClick={onAdd} className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark">
                    <HiOutlinePlus className="h-4 w-4" aria-hidden />
                    {t('customizer_add_section', 'Add section')}
                </button>
            </div>
        );
    }

    return (
        <ul className="space-y-1.5 p-3" role="list">
            {sections.map((section, i) => {
                const sc = schema?.[section.type];
                const Icon = sectionIcon(sc);
                const { label, subtitle } = sectionTitle(section, sc, locale, defaultLocale);
                const selected = section.id === selectedId;
                const hidden = section.is_visible === false;
                const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
                return (
                    <li
                        key={section.id}
                        draggable
                        onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragOver={(e) => { e.preventDefault(); if (overIndex !== i) setOverIndex(i); }}
                        onDragLeave={() => setOverIndex((cur) => (cur === i ? null : cur))}
                        onDrop={(e) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== i) onReorder(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
                        onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                        className={`group relative flex items-center gap-2 rounded-xl border px-2 py-2 transition ${
                            selected ? 'border-brand bg-brand-light/50 ring-2 ring-brand/15' : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
                        } ${hidden ? 'opacity-60' : ''} ${isOver ? 'ring-2 ring-accent/50' : ''} ${dragIndex === i ? 'opacity-40' : ''}`}
                    >
                        <span className="cursor-grab text-slate-300 group-hover:text-slate-400 active:cursor-grabbing" aria-hidden><HiOutlineBars2 className="h-4 w-4" /></span>
                        <button type="button" onClick={() => onSelect(section.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-start">
                            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${selected ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-light group-hover:text-brand'}`}>
                                <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-slate-800">{label}</span>
                                {subtitle ? <span className="block truncate text-[11px] text-slate-400">{subtitle}</span> : <span className="block truncate text-[11px] text-slate-400">{section.type}</span>}
                            </span>
                        </button>
                        <div className={`flex shrink-0 items-center text-slate-400 transition ${selected ? '' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                            <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} className="rounded-md p-1 hover:bg-white hover:text-slate-700 disabled:opacity-30" aria-label={t('customizer_move_up', 'Move up')}><HiOutlineChevronUp className="h-3.5 w-3.5" aria-hidden /></button>
                            <button type="button" onClick={() => onMove(i, 1)} disabled={i === sections.length - 1} className="rounded-md p-1 hover:bg-white hover:text-slate-700 disabled:opacity-30" aria-label={t('customizer_move_down', 'Move down')}><HiOutlineChevronDown className="h-3.5 w-3.5" aria-hidden /></button>
                            <button type="button" onClick={() => onToggleVisible(i)} className="rounded-md p-1 hover:bg-white hover:text-slate-700" aria-label={hidden ? t('customizer_show_section', 'Show section') : t('customizer_hide_section', 'Hide section')} title={hidden ? t('customizer_show_section', 'Show section') : t('customizer_hide_section', 'Hide section')}>
                                {hidden ? <HiOutlineEyeSlash className="h-3.5 w-3.5" aria-hidden /> : <HiOutlineEye className="h-3.5 w-3.5" aria-hidden />}
                            </button>
                            <button type="button" onClick={() => onDuplicate(i)} className="rounded-md p-1 hover:bg-white hover:text-slate-700" aria-label={t('customizer_duplicate', 'Duplicate')} title={t('customizer_duplicate', 'Duplicate')}><HiOutlineDocumentDuplicate className="h-3.5 w-3.5" aria-hidden /></button>
                            <button type="button" onClick={() => onRemove(i)} className="rounded-md p-1 hover:bg-red-50 hover:text-red-600" aria-label={t('customizer_remove', 'Remove')} title={t('customizer_remove', 'Remove')}><HiOutlineTrash className="h-3.5 w-3.5" aria-hidden /></button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

/** Add-section picker grouped by category with a search box. */
export function SectionPicker({ schema, onPick, onBack }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const groups = useMemo(() => groupByCategory(schema), [schema]);
    const q = query.trim().toLowerCase();
    const filtered = groups
        .map((g) => ({ ...g, items: g.items.filter((s) => !q || `${s.label || ''} ${s.description || ''} ${s.type}`.toLowerCase().includes(q)) }))
        .filter((g) => g.items.length > 0);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                <button type="button" onClick={onBack} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label={t('customizer_back', 'Back')}>
                    <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </button>
                <p className="text-sm font-semibold text-slate-900">{t('customizer_add_section', 'Add section')}</p>
            </div>
            <div className="px-3 py-2">
                <div className="relative">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute inset-y-0 start-2.5 my-auto h-4 w-4 text-slate-400" aria-hidden />
                    <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('customizer_search_sections', 'Search sections…')} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 ps-8 pe-3 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20" />
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                {filtered.length === 0 ? (
                    <p className="py-10 text-center text-xs text-slate-400">{Object.keys(schema || {}).length ? t('no_results', 'No results') : t('customizer_library_empty', 'The active theme exposes no sections.')}</p>
                ) : filtered.map((group) => {
                    const GroupIcon = categoryIcon(group.category);
                    return (
                        <div key={group.category} className="mb-4">
                            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                <GroupIcon className="h-3.5 w-3.5" aria-hidden />
                                {t(`customizer_category_${group.category}`, group.category)}
                            </p>
                            <div className="space-y-1.5">
                                {group.items.map((s) => {
                                    const Icon = sectionIcon(s);
                                    return (
                                        <button key={s.type} type="button" onClick={() => onPick(s.type)} className="group flex w-full items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white p-2.5 text-start transition hover:border-brand hover:bg-brand-light/40 hover:shadow-xs">
                                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-brand group-hover:text-white"><Icon className="h-[18px] w-[18px]" aria-hidden /></span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-slate-800">{s.label || s.type}</span>
                                                {s.description ? <span className="line-clamp-2 block text-[11px] leading-relaxed text-slate-400">{s.description}</span> : null}
                                            </span>
                                            <HiOutlinePlus className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand" aria-hidden />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
