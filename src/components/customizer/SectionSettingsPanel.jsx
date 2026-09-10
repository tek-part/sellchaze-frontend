import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowLeft,
    HiOutlineCheckCircle,
    HiOutlineChevronDown,
    HiOutlineDocumentDuplicate,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlinePaintBrush,
    HiOutlineTrash,
    HiOutlineXMark,
} from 'react-icons/hi2';
import { pickLocalized } from '../../lib/localized';
import { blockIcon, sectionIcon, variantIcon } from './sectionIcons';
import SettingsForm from './SettingsForm';
import {
    applyStyleValues, blockSchemaFor, blockTitle, editableSectionFields, sectionBlocks, showsStyle, styleFields, styleValuesFor, variantsOf,
} from './customizerUtils';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

/** Visual grid of display variants (contract §7 `variants`): icon + label + description, writes `settings[field]`. */
function VariantPicker({ variants, value, onChange }) {
    const { t } = useTranslation();
    const current = value ?? variants.options[0]?.value;
    const cols = variants.options.length >= 4 ? 'grid-cols-2' : variants.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2';
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700">{t('editor_variant_label', 'Layout')}</p>
            <div className={`grid ${cols} gap-1.5`} role="radiogroup" aria-label={t('editor_variant_label', 'Layout')}>
                {variants.options.map((o) => {
                    const Icon = variantIcon(o);
                    const active = o.value === current;
                    return (
                        <button
                            key={o.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onChange(o.value)}
                            title={o.description || o.label}
                            className={`relative flex flex-col items-start gap-1 rounded-xl border p-2.5 text-start transition ${FOCUS} ${
                                active ? 'border-brand bg-brand-light/50 text-brand-dark shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:bg-slate-50'
                            }`}
                        >
                            {active ? <HiOutlineCheckCircle className="absolute end-1.5 top-1.5 h-4 w-4 text-brand" aria-hidden /> : null}
                            <span className={`grid h-7 w-7 place-items-center rounded-md ${active ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {Icon ? <Icon className="h-4 w-4" aria-hidden /> : <span className="text-[11px] font-bold uppercase">{String(o.label || o.value).slice(0, 2)}</span>}
                            </span>
                            <span className="block w-full truncate text-[12px] font-semibold">{o.label}</span>
                            {o.description ? <span className="line-clamp-2 block text-[10px] leading-snug text-slate-400">{o.description}</span> : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** Collapsible "Section style" group over `__style` / `__responsive` (contract §7). */
function SectionStyleGroup({ settings, onChange, locales, defaultLocale, editLocale, viewport, apiBase }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const values = useMemo(() => styleValuesFor(settings), [settings]);
    const fields = useMemo(() => styleFields(t, values), [t, values]);
    const touched = !!settings?.__style && Object.keys(settings.__style).length > 0;
    return (
        <section className={`rounded-xl border transition ${open ? 'border-brand/30 bg-white shadow-xs' : 'border-slate-200 bg-slate-50/60'}`}>
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start ${FOCUS}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${open ? 'bg-brand text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}><HiOutlinePaintBrush className="h-3.5 w-3.5" aria-hidden /></span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-800">{t('editor_section_style', 'Section style')}</span>
                    <span className="block truncate text-[10px] text-slate-400">{t('editor_section_style_hint', 'Spacing, background, width and visibility')}</span>
                </span>
                {touched && !open ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden /> : null}
                <HiOutlineChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {open ? (
                <div className="border-t border-slate-100 px-3 py-3">
                    <SettingsForm
                        fields={fields}
                        values={values}
                        onChange={(next) => onChange(applyStyleValues(settings, next))}
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
}

/** Inspector body for one block: header (icon + label, back to section), hide/remove, the block type's form. */
function BlockInspector({ section, schema, block, blockIndex, onBack, onChange, onToggleHidden, onRemove, locales, defaultLocale, editLocale, apiBase }) {
    const { t } = useTranslation();
    const bs = blockSchemaFor(schema, block.type);
    const Icon = blockIcon(bs || { type: block.type });
    const { label, subtitle } = blockTitle(block, bs || { label: block.type }, (raw) => (raw && typeof raw === 'object' ? pickLocalized(raw, editLocale, defaultLocale) : raw));
    const hidden = block.hidden === true;
    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-slate-200 bg-white px-2">
                <button type="button" onClick={onBack} className={`shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 ${FOCUS}`} aria-label={t('editor_back_to_section', 'Back to section')} title={t('editor_back_to_section', 'Back to section')}>
                    <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </button>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand text-white"><Icon className="h-4 w-4" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-900">{label}</p>
                    <p className="truncate text-[11px] text-slate-400">{subtitle || `${schema?.label || section.type} · ${t('editor_block_position', 'Block {{n}}', { n: blockIndex + 1 })}`}</p>
                </div>
            </div>
            {hidden ? <p className="mx-3 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">{t('editor_block_hidden_hint', 'This block is hidden from visitors.')}</p> : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {bs ? (
                    <SettingsForm
                        fields={(bs.settings || []).filter((f) => f && f.type !== 'blocks')}
                        values={block.settings || {}}
                        onChange={onChange}
                        locales={locales}
                        defaultLocale={defaultLocale}
                        editLocale={editLocale}
                        apiBase={apiBase}
                    />
                ) : (
                    <p className="rounded-xl bg-amber-50 px-3 py-4 text-center text-xs text-amber-800">{t('editor_block_unknown_type', 'This block type is no longer offered by the theme.')}</p>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-1 border-t border-slate-200 bg-white px-2 py-2">
                <button type="button" onClick={onToggleHidden} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${FOCUS}`}>
                    {hidden ? <HiOutlineEye className="h-4 w-4" aria-hidden /> : <HiOutlineEyeSlash className="h-4 w-4" aria-hidden />}
                    {hidden ? t('editor_block_show', 'Show block') : t('editor_block_hide', 'Hide block')}
                </button>
                <button type="button" onClick={onRemove} className={`ms-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 ${FOCUS}`}>
                    <HiOutlineTrash className="h-4 w-4" aria-hidden />
                    {t('editor_block_remove', 'Remove block')}
                </button>
            </div>
        </div>
    );
}

/**
 * Inspector body for the selected section: sticky header (icon + name + description), the visual
 * variant picker, the schema-driven form (legacy list fields that became blocks are hidden), the
 * collapsible "Section style" group and a sticky footer with "Hide section" / "Remove section".
 * When `selectedBlockId` names one of the section's blocks, the block inspector is shown instead.
 */
export default function SectionSettingsPanel({
    section, schema, onClose, onChange, onDuplicate, onRemove, onToggleVisible,
    selectedBlockId, onSelectBlock, onBlockChange, onBlockToggleHidden, onBlockRemove,
    locales, defaultLocale, editLocale, viewport, apiBase,
}) {
    const { t } = useTranslation();
    const variants = useMemo(() => variantsOf(schema), [schema]);
    const fields = useMemo(() => editableSectionFields(schema), [schema]);
    if (!section) return null;
    const Icon = sectionIcon(schema);
    const hidden = section.is_visible === false;
    const readOnly = !!section.reusable_section_id;
    const settings = section.settings || {};

    const blocks = sectionBlocks(section);
    const blockIndex = selectedBlockId ? blocks.findIndex((b) => b.id === selectedBlockId) : -1;
    if (blockIndex >= 0 && !readOnly) {
        return (
            <BlockInspector
                section={section}
                schema={schema}
                block={blocks[blockIndex]}
                blockIndex={blockIndex}
                onBack={() => onSelectBlock?.(null)}
                onChange={(next) => onBlockChange?.(blockIndex, next)}
                onToggleHidden={() => onBlockToggleHidden?.(blockIndex)}
                onRemove={() => onBlockRemove?.(blockIndex)}
                locales={locales}
                defaultLocale={defaultLocale}
                editLocale={editLocale}
                apiBase={apiBase}
            />
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand text-white"><Icon className="h-4 w-4" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-900">{schema?.label || section.type}</p>
                    {schema?.description ? <p className="truncate text-[11px] text-slate-400">{schema.description}</p> : null}
                </div>
                {onClose ? (
                    <button type="button" onClick={onClose} className={`shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 ${FOCUS}`} aria-label={t('close', 'Close')} title={t('close', 'Close')}>
                        <HiOutlineXMark className="h-4 w-4" aria-hidden />
                    </button>
                ) : null}
            </div>
            {hidden ? <p className="mx-3 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">{t('customizer_hidden_hint', 'This section is hidden from visitors.')}</p> : null}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
                {readOnly ? (
                    <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">{t('customizer_reusable_hint', 'This is a reusable section; edit it from the Pages area.')}</p>
                ) : (
                    <>
                        {variants ? (
                            <VariantPicker variants={variants} value={settings[variants.field]} onChange={(value) => onChange({ ...settings, [variants.field]: value })} />
                        ) : null}
                        {fields.length || (!variants && !showsStyle(schema)) ? (
                            <SettingsForm
                                fields={fields}
                                values={settings}
                                onChange={onChange}
                                locales={locales}
                                defaultLocale={defaultLocale}
                                editLocale={editLocale}
                                viewport={viewport}
                                apiBase={apiBase}
                            />
                        ) : null}
                        {showsStyle(schema) ? (
                            <SectionStyleGroup
                                settings={settings}
                                onChange={onChange}
                                locales={locales}
                                defaultLocale={defaultLocale}
                                editLocale={editLocale}
                                viewport={viewport}
                                apiBase={apiBase}
                            />
                        ) : null}
                    </>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-1 border-t border-slate-200 bg-white px-2 py-2">
                <button type="button" onClick={onToggleVisible} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${FOCUS}`}>
                    {hidden ? <HiOutlineEye className="h-4 w-4" aria-hidden /> : <HiOutlineEyeSlash className="h-4 w-4" aria-hidden />}
                    {hidden ? t('customizer_show_section', 'Show section') : t('customizer_hide_section', 'Hide section')}
                </button>
                <button type="button" onClick={onDuplicate} className={`rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 ${FOCUS}`} title={t('customizer_duplicate', 'Duplicate')} aria-label={t('customizer_duplicate', 'Duplicate')}>
                    <HiOutlineDocumentDuplicate className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={onRemove} className={`ms-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 ${FOCUS}`}>
                    <HiOutlineTrash className="h-4 w-4" aria-hidden />
                    {t('editor_remove_section', 'Remove section')}
                </button>
            </div>
        </div>
    );
}
