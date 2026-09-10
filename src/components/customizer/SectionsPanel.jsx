import { useMemo, useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowLeft,
    HiOutlineBars2,
    HiOutlineChevronDown,
    HiOutlineChevronRight,
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
import { blockIcon, categoryIcon, sectionIcon } from './sectionIcons';
import { blockLimits, blockSchemaFor, blockTitle, blockTypes, groupByCategory, hasBlocks, sectionBlocks, variantsOf } from './customizerUtils';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';
const ROW_ACTION = `rounded-md p-1 transition hover:bg-white hover:text-slate-700 disabled:opacity-30 ${FOCUS}`;

/** Human title for a section row: schema label, plus the first text setting as a subtitle. */
function sectionTitle(section, schema, locale, defaultLocale) {
    const label = schema?.label || section.type;
    const textField = (schema?.settings || []).find((f) => ['text'].includes(f.type));
    const raw = textField ? section.settings?.[textField.id] : null;
    const subtitle = raw && typeof raw === 'object' ? pickLocalized(raw, locale, defaultLocale) : raw;
    return { label, subtitle: typeof subtitle === 'string' ? subtitle.trim() : '' };
}

/** Row hover-actions shared by section and block rows. */
function RowActions({ index, count, hidden, onMove, onToggleVisible, onDuplicate, onRemove, canDuplicate = true, labels, alwaysVisible }) {
    const { t } = useTranslation();
    return (
        <div className={`flex shrink-0 items-center text-slate-400 transition ${alwaysVisible ? '' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className={ROW_ACTION} aria-label={t('customizer_move_up', 'Move up')} title={t('customizer_move_up', 'Move up')}><HiOutlineChevronUp className="h-3.5 w-3.5" aria-hidden /></button>
            <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} className={ROW_ACTION} aria-label={t('customizer_move_down', 'Move down')} title={t('customizer_move_down', 'Move down')}><HiOutlineChevronDown className="h-3.5 w-3.5" aria-hidden /></button>
            <button type="button" onClick={onToggleVisible} className={ROW_ACTION} aria-label={hidden ? labels.show : labels.hide} title={hidden ? labels.show : labels.hide}>
                {hidden ? <HiOutlineEyeSlash className="h-3.5 w-3.5" aria-hidden /> : <HiOutlineEye className="h-3.5 w-3.5" aria-hidden />}
            </button>
            <button type="button" onClick={onDuplicate} disabled={!canDuplicate} className={ROW_ACTION} aria-label={t('customizer_duplicate', 'Duplicate')} title={t('customizer_duplicate', 'Duplicate')}><HiOutlineDocumentDuplicate className="h-3.5 w-3.5" aria-hidden /></button>
            <button type="button" onClick={onRemove} className={`rounded-md p-1 transition hover:bg-red-50 hover:text-red-600 ${FOCUS}`} aria-label={labels.remove} title={labels.remove}><HiOutlineTrash className="h-3.5 w-3.5" aria-hidden /></button>
        </div>
    );
}

/** "Add block" row: one type → direct button; several → a small menu. Shows `n/max` and disables at the cap. */
function AddBlockRow({ schema, blocks, onAdd }) {
    const { t } = useTranslation();
    const types = blockTypes(schema);
    const { max } = blockLimits(schema);
    const count = blocks.length;
    const countOf = (type) => blocks.filter((b) => b.type === type).length;
    const full = count >= max;
    const countLabel = Number.isFinite(max) ? `${count}/${max}` : String(count);
    const cls = `flex w-full items-center gap-2 rounded-md border border-dashed px-2 py-1.5 text-[12px] font-semibold transition ${FOCUS} ${
        full ? 'cursor-not-allowed border-slate-200 text-slate-400' : 'border-brand/40 text-brand hover:border-brand hover:bg-brand-light/40'
    }`;
    const inner = (
        <>
            <HiOutlinePlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-start">{t('editor_add_block', 'Add block')}</span>
            <span className="shrink-0 text-[10px] font-medium text-slate-400" dir="ltr">{countLabel}</span>
        </>
    );
    const title = full ? t('editor_add_block_max', 'Block limit reached ({{max}})', { max }) : undefined;

    if (types.length <= 1 || full) {
        return (
            <button type="button" onClick={() => !full && types[0] && onAdd(types[0].type)} disabled={full} className={cls} title={title} aria-disabled={full}>
                {inner}
            </button>
        );
    }
    return (
        <Menu as="div" className="relative">
            <MenuButton className={cls}>{inner}</MenuButton>
            <MenuItems anchor="bottom start" className="z-50 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 outline-none [--anchor-gap:4px]">
                {types.map((bt) => {
                    const Icon = blockIcon(bt);
                    const limited = Number.isFinite(bt.limit) && countOf(bt.type) >= bt.limit;
                    return (
                        <MenuItem key={bt.type} disabled={limited}>
                            {({ focus }) => (
                                <button type="button" onClick={() => onAdd(bt.type)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-[13px] text-slate-700 ${focus ? 'bg-brand-light/60' : ''} disabled:opacity-40`} disabled={limited}>
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500"><Icon className="h-3.5 w-3.5" aria-hidden /></span>
                                    <span className="min-w-0 flex-1 truncate">{bt.label || bt.type}</span>
                                </button>
                            )}
                        </MenuItem>
                    );
                })}
            </MenuItems>
        </Menu>
    );
}

/**
 * Blocks nested under one expanded section (contract §7): icon + label rows, hover actions,
 * drag reorder WITHIN the section, ↑/↓ focus navigation (Alt+↑/↓ reorders) and an "Add block" row.
 */
function BlockRows({ section, schema, selectedBlockId, locale, defaultLocale, drag, setDrag, over, setOver, onSelectBlock, onAddBlock, onMoveBlock, onReorderBlock, onDuplicateBlock, onRemoveBlock, onToggleBlockHidden }) {
    const { t } = useTranslation();
    const blocks = sectionBlocks(section);
    const { max } = blockLimits(schema);
    const pick = (raw) => (raw && typeof raw === 'object' ? pickLocalized(raw, locale, defaultLocale) : raw);
    const isMine = (d) => d && d.kind === 'block' && d.sectionId === section.id;

    const onKeyDown = (e, i) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        const dir = e.key === 'ArrowUp' ? -1 : 1;
        e.preventDefault();
        e.stopPropagation();
        if (e.altKey) { onMoveBlock(i, dir); return; }
        const rows = e.currentTarget.closest('ul')?.querySelectorAll('[data-block-row]');
        rows?.[i + dir]?.focus();
    };

    return (
        <ul className="ms-6 mt-0.5 space-y-0.5 border-s border-slate-200 ps-2 pb-1" role="list" aria-label={t('editor_blocks', 'Blocks')}>
            {blocks.length === 0 ? (
                <li className="rounded-md bg-slate-50 px-2 py-2 text-center">
                    <p className="text-[11px] font-medium text-slate-500">{t('editor_blocks_empty', 'No blocks yet')}</p>
                    <p className="text-[10px] text-slate-400">{t('editor_blocks_empty_hint', 'Add a block to fill this section.')}</p>
                </li>
            ) : blocks.map((block, i) => {
                const bs = blockSchemaFor(schema, block.type);
                const Icon = blockIcon(bs || { type: block.type });
                const { label, subtitle } = blockTitle(block, bs || { label: block.type }, pick);
                const selected = block.id === selectedBlockId;
                const hidden = block.hidden === true;
                const isOver = isMine(over) && over.index === i && isMine(drag) && drag.index !== i;
                return (
                    <li
                        key={block.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); setDrag({ kind: 'block', sectionId: section.id, index: i }); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragOver={(e) => { if (!isMine(drag)) return; e.preventDefault(); e.stopPropagation(); if (!(isMine(over) && over.index === i)) setOver({ kind: 'block', sectionId: section.id, index: i }); }}
                        onDragLeave={() => setOver((cur) => (isMine(cur) && cur.index === i ? null : cur))}
                        onDrop={(e) => { if (!isMine(drag)) return; e.preventDefault(); e.stopPropagation(); if (drag.index !== i) onReorderBlock(drag.index, i); setDrag(null); setOver(null); }}
                        onDragEnd={(e) => { e.stopPropagation(); setDrag(null); setOver(null); }}
                        aria-current={selected ? 'true' : undefined}
                        className={`group relative flex items-center gap-1 rounded-md border ps-0.5 pe-1 py-1 transition ${
                            selected ? 'border-brand/30 bg-brand-light/70 text-brand-dark' : 'border-transparent text-slate-700 hover:bg-slate-50'
                        } ${hidden ? 'opacity-60' : ''} ${isOver ? 'ring-2 ring-accent/50' : ''} ${isMine(drag) && drag.index === i ? 'opacity-40' : ''}`}
                    >
                        <span className={`shrink-0 cursor-grab text-slate-300 transition active:cursor-grabbing ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} aria-hidden><HiOutlineBars2 className="h-3.5 w-3.5" /></span>
                        <button type="button" data-block-row onClick={() => onSelectBlock(block.id)} onKeyDown={(e) => onKeyDown(e, i)} className={`flex min-w-0 flex-1 items-center gap-2 rounded-md text-start ${FOCUS}`}>
                            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${selected ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-brand'}`}>
                                <Icon className="h-3.5 w-3.5" aria-hidden />
                            </span>
                            <span className="min-w-0">
                                <span className={`block truncate text-[12px] ${selected ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                                {subtitle ? <span className={`block truncate text-[10px] ${selected ? 'text-brand-dark/70' : 'text-slate-400'}`}>{subtitle}</span> : null}
                            </span>
                        </button>
                        <RowActions
                            index={i}
                            count={blocks.length}
                            hidden={hidden}
                            onMove={(dir) => onMoveBlock(i, dir)}
                            onToggleVisible={() => onToggleBlockHidden(i)}
                            onDuplicate={() => onDuplicateBlock(i)}
                            canDuplicate={blocks.length < max}
                            onRemove={() => onRemoveBlock(i)}
                            alwaysVisible={selected}
                            labels={{ show: t('editor_block_show', 'Show block'), hide: t('editor_block_hide', 'Hide block'), remove: t('editor_block_remove', 'Remove block') }}
                        />
                    </li>
                );
            })}
            <li>
                <AddBlockRow schema={schema} blocks={blocks} onAdd={onAddBlock} />
            </li>
        </ul>
    );
}

/**
 * Ordered section tree (Shopify-style rows): drag-and-drop reorder (HTML5), ↑/↓ buttons, hide /
 * duplicate / remove hover actions, and — for schemas with `blocks` — an expand chevron revealing
 * the section's blocks. The selected row stays highlighted while the inspector is open.
 */
export function SectionList({
    sections, schema, selectedId, selectedBlockId, expanded, onToggleExpanded, locale, defaultLocale,
    onSelect, onMove, onReorder, onDuplicate, onRemove, onToggleVisible, onAdd,
    onSelectBlock, onAddBlock, onMoveBlock, onReorderBlock, onDuplicateBlock, onRemoveBlock, onToggleBlockHidden,
}) {
    const { t } = useTranslation();
    const [drag, setDrag] = useState(null); // { kind: 'section', index } | { kind: 'block', sectionId, index }
    const [over, setOver] = useState(null);

    if (!sections.length) {
        return (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-light text-brand"><HiOutlineSquaresPlus className="h-7 w-7" aria-hidden /></span>
                <p className="text-[13px] font-semibold text-slate-800">{t('customizer_empty_title', 'No sections yet')}</p>
                <p className="text-xs leading-relaxed text-slate-500">{t('customizer_empty_body', 'Add your first section to start building this page.')}</p>
                <button type="button" onClick={onAdd} className={`mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-xs hover:bg-brand-dark ${FOCUS}`}>
                    <HiOutlinePlus className="h-4 w-4" aria-hidden />
                    {t('customizer_add_section', 'Add section')}
                </button>
            </div>
        );
    }

    const sectionDrag = drag?.kind === 'section';

    return (
        <ul className="space-y-0.5 p-2" role="list">
            {sections.map((section, i) => {
                const sc = schema?.[section.type];
                const Icon = sectionIcon(sc);
                const { label, subtitle } = sectionTitle(section, sc, locale, defaultLocale);
                const selected = section.id === selectedId;
                const hidden = section.is_visible === false;
                const withBlocks = hasBlocks(sc);
                const isOpen = withBlocks && !!expanded?.[section.id];
                const blockCount = withBlocks ? sectionBlocks(section).length : 0;
                const isOver = sectionDrag && over?.kind === 'section' && over.index === i && drag.index !== i;
                return (
                    <li
                        key={section.id}
                        draggable
                        onDragStart={(e) => { setDrag({ kind: 'section', index: i }); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragOver={(e) => { if (!sectionDrag) return; e.preventDefault(); if (!(over?.kind === 'section' && over.index === i)) setOver({ kind: 'section', index: i }); }}
                        onDragLeave={() => setOver((cur) => (cur?.kind === 'section' && cur.index === i ? null : cur))}
                        onDrop={(e) => { if (!sectionDrag) return; e.preventDefault(); if (drag.index !== i) onReorder(drag.index, i); setDrag(null); setOver(null); }}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        className={`${isOver ? 'ring-2 ring-accent/50' : ''} ${sectionDrag && drag.index === i ? 'opacity-40' : ''} rounded-lg`}
                    >
                        <div
                            aria-current={selected && !selectedBlockId ? 'true' : undefined}
                            className={`group relative flex items-center gap-1 rounded-lg border ps-1 pe-1.5 py-1.5 transition ${
                                selected ? 'border-brand/30 bg-brand-light/70 text-brand-dark' : 'border-transparent text-slate-800 hover:bg-slate-50'
                            } ${hidden ? 'opacity-60' : ''}`}
                        >
                            <span className={`shrink-0 cursor-grab text-slate-300 transition active:cursor-grabbing ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} aria-hidden><HiOutlineBars2 className="h-4 w-4" /></span>
                            {withBlocks ? (
                                <button
                                    type="button"
                                    onClick={() => onToggleExpanded(section.id)}
                                    aria-expanded={isOpen}
                                    aria-label={isOpen ? t('editor_collapse_blocks', 'Collapse blocks') : t('editor_expand_blocks', 'Expand blocks')}
                                    title={isOpen ? t('editor_collapse_blocks', 'Collapse blocks') : t('editor_expand_blocks', 'Expand blocks')}
                                    className={`shrink-0 rounded-md p-0.5 text-slate-400 transition hover:bg-white hover:text-slate-700 ${FOCUS}`}
                                >
                                    <HiOutlineChevronRight className={`h-3.5 w-3.5 transition-transform rtl:rotate-180 ${isOpen ? 'rotate-90 rtl:rotate-90' : ''}`} aria-hidden />
                                </button>
                            ) : <span className="w-[1.125rem] shrink-0" aria-hidden />}
                            <button type="button" onClick={() => onSelect(section.id)} className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-md text-start ${FOCUS}`}>
                                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${selected ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-brand'}`}>
                                    <Icon className="h-4 w-4" aria-hidden />
                                </span>
                                <span className="min-w-0">
                                    <span className={`block truncate text-[13px] ${selected ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                                    <span className={`block truncate text-[11px] ${selected ? 'text-brand-dark/70' : 'text-slate-400'}`}>
                                        {subtitle || section.type}
                                        {withBlocks ? <span className="ms-1.5 rounded-full bg-slate-200/70 px-1.5 py-px text-[10px] font-semibold text-slate-500" dir="ltr">{t('editor_blocks_count', '{{count}} blocks', { count: blockCount })}</span> : null}
                                    </span>
                                </span>
                            </button>
                            <RowActions
                                index={i}
                                count={sections.length}
                                hidden={hidden}
                                onMove={(dir) => onMove(i, dir)}
                                onToggleVisible={() => onToggleVisible(i)}
                                onDuplicate={() => onDuplicate(i)}
                                onRemove={() => onRemove(i)}
                                alwaysVisible={selected}
                                labels={{ show: t('customizer_show_section', 'Show section'), hide: t('customizer_hide_section', 'Hide section'), remove: t('customizer_remove', 'Remove') }}
                            />
                        </div>
                        {isOpen ? (
                            <BlockRows
                                section={section}
                                schema={sc}
                                selectedBlockId={selected ? selectedBlockId : null}
                                locale={locale}
                                defaultLocale={defaultLocale}
                                drag={drag}
                                setDrag={setDrag}
                                over={over}
                                setOver={setOver}
                                onSelectBlock={(blockId) => onSelectBlock(section.id, blockId)}
                                onAddBlock={(type) => onAddBlock(i, type)}
                                onMoveBlock={(bi, dir) => onMoveBlock(i, bi, dir)}
                                onReorderBlock={(from, to) => onReorderBlock(i, from, to)}
                                onDuplicateBlock={(bi) => onDuplicateBlock(i, bi)}
                                onRemoveBlock={(bi) => onRemoveBlock(i, bi)}
                                onToggleBlockHidden={(bi) => onToggleBlockHidden(i, bi)}
                            />
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}

/** "4 layouts · blocks" hint for the add-section picker (contract §7 capabilities). */
function capabilityHint(s, t) {
    const parts = [];
    const variants = variantsOf(s);
    if (variants) parts.push(t('editor_variants_count', '{{count}} layouts', { count: variants.options.length }));
    if (hasBlocks(s)) parts.push(t('editor_blocks_hint', 'blocks'));
    return parts.join(' · ');
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
            <div className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-200 px-2">
                <button type="button" onClick={onBack} className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 ${FOCUS}`} aria-label={t('customizer_back', 'Back')}>
                    <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </button>
                <p className="text-[13px] font-semibold text-slate-900">{t('customizer_add_section', 'Add section')}</p>
            </div>
            <div className="shrink-0 px-2 py-2">
                <div className="relative">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute inset-y-0 start-2.5 my-auto h-4 w-4 text-slate-400" aria-hidden />
                    <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('customizer_search_sections', 'Search sections…')} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 ps-8 pe-3 text-[13px] outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20" />
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
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
                            <div className="space-y-1">
                                {group.items.map((s) => {
                                    const Icon = sectionIcon(s);
                                    const hint = capabilityHint(s, t);
                                    return (
                                        <button key={s.type} type="button" onClick={() => onPick(s.type)} className={`group flex w-full items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2 text-start transition hover:border-brand/40 hover:bg-brand-light/40 ${FOCUS}`}>
                                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500 transition group-hover:bg-brand group-hover:text-white"><Icon className="h-4 w-4" aria-hidden /></span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="min-w-0 truncate text-[13px] font-medium text-slate-800">{s.label || s.type}</span>
                                                    {hint ? <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-500 group-hover:bg-white">{hint}</span> : null}
                                                </span>
                                                {s.description ? <span className="line-clamp-2 block text-[11px] leading-relaxed text-slate-400">{s.description}</span> : null}
                                            </span>
                                            <HiOutlinePlus className="mt-1.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand" aria-hidden />
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
