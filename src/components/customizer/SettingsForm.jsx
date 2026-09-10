import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowUturnLeft,
    HiOutlineChevronDown,
    HiOutlineComputerDesktop,
    HiOutlineDevicePhoneMobile,
    HiOutlineDeviceTablet,
    HiOutlineDocumentDuplicate,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineChevronUp,
} from 'react-icons/hi2';
import SearchableSelect from '../ui/SearchableSelect';
import Toggle from '../ui/Toggle';
import { INPUT_CLASS } from '../ui/FormField';
import StoreMediaPicker from '../store/StoreMediaPicker';
import LocaleTabs from '../store/LocaleTabs';
import { completeness, pickLocalized, setLocalized, toLocalized } from '../../lib/localized';
import EntityPicker from './EntityPicker';
import { defaultsFor, isTranslatable, normalizeOptions, toHex6, VIEWPORTS } from './customizerUtils';

const VIEWPORT_ICON = { desktop: HiOutlineComputerDesktop, tablet: HiOutlineDeviceTablet, mobile: HiOutlineDevicePhoneMobile };

/** Small pill row used by responsive range fields. */
function ViewportPills({ value, onChange, overrides }) {
    const { t } = useTranslation();
    return (
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {VIEWPORTS.map((vp) => {
                const Icon = VIEWPORT_ICON[vp];
                const active = vp === value;
                const has = vp !== 'desktop' && overrides?.[vp] !== undefined;
                return (
                    <button
                        key={vp}
                        type="button"
                        onClick={() => onChange(vp)}
                        title={t(`customizer_viewport_${vp}`, vp)}
                        className={`relative rounded-md p-1 transition ${active ? 'bg-brand text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {has ? <span className="absolute -top-0.5 -end-0.5 h-1.5 w-1.5 rounded-full bg-accent ring-1 ring-white" aria-hidden /> : null}
                    </button>
                );
            })}
        </div>
    );
}

/** One field control. `value` is the resolved value for the current viewport/locale context. */
function FieldControl({ field, value, onChange, locales, defaultLocale, editLocale, apiBase, depth }) {
    const { t } = useTranslation();
    const [fieldLocale, setFieldLocale] = useState(null);
    const [imageUrlMode, setImageUrlMode] = useState(false);

    if (isTranslatable(field)) {
        const loc = fieldLocale && locales.includes(fieldLocale) ? fieldLocale : editLocale;
        const lv = toLocalized(value, locales, defaultLocale);
        const common = {
            value: lv[loc] ?? '',
            onChange: (e) => onChange(setLocalized(lv, loc, e.target.value, locales, defaultLocale)),
            dir: loc === 'ar' ? 'rtl' : 'ltr',
            lang: loc,
            className: INPUT_CLASS,
            placeholder: field.placeholder || '',
        };
        return (
            <div className="space-y-1.5">
                {locales.length > 1 ? (
                    <LocaleTabs size="sm" locales={locales} value={loc} onChange={setFieldLocale} completeness={completeness({ [field.id]: lv }, locales)} />
                ) : null}
                {field.type === 'richtext'
                    ? <textarea rows={5} {...common} className={`${INPUT_CLASS} font-mono text-xs leading-relaxed`} />
                    : field.type === 'textarea'
                        ? <textarea rows={3} {...common} />
                        : field.type === 'url'
                            ? <input type="url" {...common} dir="ltr" placeholder="https://…" />
                            : <input type="text" {...common} />}
            </div>
        );
    }

    switch (field.type) {
        case 'toggle':
            return <Toggle checked={!!value} onChange={onChange} size="sm" label={field.label || field.id} description={field.hint} />;
        case 'textarea':
            return <textarea rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASS} />;
        case 'richtext':
            return <textarea rows={5} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={`${INPUT_CLASS} font-mono text-xs leading-relaxed`} />;
        case 'select': {
            const options = normalizeOptions(field.options);
            return <SearchableSelect value={value ?? ''} onChange={(e) => onChange(e.target.value)} options={options} className="w-full" />;
        }
        case 'segmented': {
            // Editor-only control (section style group): a few mutually exclusive options as pills.
            const options = normalizeOptions(field.options);
            const current = value ?? field.default ?? options[0]?.value ?? '';
            return (
                <div className="grid gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5" style={{ gridTemplateColumns: `repeat(${Math.max(1, options.length)}, minmax(0, 1fr))` }} role="radiogroup" aria-label={field.label || field.id}>
                    {options.map((o) => {
                        const active = o.value === current;
                        return (
                            <button key={o.value} type="button" role="radio" aria-checked={active} onClick={() => onChange(o.value)} className={`truncate rounded-md px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${active ? 'bg-white text-brand-dark shadow-xs ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                                {o.label}
                            </button>
                        );
                    })}
                </div>
            );
        }
        case 'color': {
            const hex = toHex6(value);
            return (
                <div className="flex items-center gap-2">
                    <label className="relative h-9 w-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 shadow-xs" style={{ backgroundColor: hex }}>
                        <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={field.label || field.id} />
                    </label>
                    <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="#000000" dir="ltr" className={`${INPUT_CLASS} font-mono`} />
                </div>
            );
        }
        case 'number':
            return <input type="number" min={field.min} max={field.max} step={field.step} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} className={INPUT_CLASS} dir="ltr" />;
        case 'range': {
            const min = field.min ?? 0;
            const max = field.max ?? 100;
            const step = field.step ?? 1;
            const num = value === '' || value == null || Number.isNaN(Number(value)) ? min : Number(value);
            return (
                <div className="flex items-center gap-3" dir="ltr">
                    <input type="range" min={min} max={max} step={step} value={num} onChange={(e) => onChange(Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer accent-brand" />
                    <input type="number" min={min} max={max} step={step} value={num} onChange={(e) => onChange(e.target.value === '' ? min : Number(e.target.value))} className="w-[4.5rem] rounded-lg border border-slate-200 px-2 py-1 text-center text-xs font-semibold text-slate-700" />
                </div>
            );
        }
        case 'url':
            return <input type="url" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="https://…" dir="ltr" className={INPUT_CLASS} />;
        case 'image':
            return (
                <div className="space-y-2">
                    <StoreMediaPicker apiBase={apiBase} value={value ?? ''} onChange={onChange} />
                    <button type="button" onClick={() => setImageUrlMode((v) => !v)} className="text-[11px] font-medium text-slate-500 hover:text-brand">
                        {imageUrlMode ? t('customizer_image_hide_url', 'Hide URL field') : t('customizer_image_use_url', 'Use an image URL instead')}
                    </button>
                    {imageUrlMode ? <input type="url" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="https://…" dir="ltr" className={INPUT_CLASS} /> : null}
                </div>
            );
        case 'product':
        case 'category':
        case 'collection':
            return <EntityPicker kind={field.type} value={value} onChange={onChange} />;
        case 'list':
            if (depth > 0) return <p className="text-xs text-slate-400">{t('customizer_nested_list_unsupported', 'Nested lists are not supported.')}</p>;
            return <ListField field={field} value={value} onChange={onChange} locales={locales} defaultLocale={defaultLocale} editLocale={editLocale} apiBase={apiBase} />;
        default:
            return <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASS} />;
    }
}

/** Repeater for `list` fields: collapsible item cards with add/remove/reorder and a `max` cap. */
function ListField({ field, value, onChange, locales, defaultLocale, editLocale, apiBase }) {
    const { t } = useTranslation();
    const rows = Array.isArray(value) ? value : [];
    const [openIndex, setOpenIndex] = useState(rows.length ? 0 : -1);
    const itemFields = (field.item || []).filter((f) => f.type !== 'list');
    const max = typeof field.max === 'number' ? field.max : Infinity;

    const titleOf = (row, i) => {
        const textField = itemFields.find((f) => ['text', 'textarea'].includes(f.type));
        const raw = textField ? row?.[textField.id] : null;
        const text = raw && typeof raw === 'object' ? pickLocalized(raw, editLocale, defaultLocale) : raw;
        return String(text || '').trim() || `${field.itemLabel || t('customizer_list_item', 'Item')} ${i + 1}`;
    };
    const update = (next) => onChange(next);
    const add = () => {
        if (rows.length >= max) return;
        update([...rows, defaultsFor(itemFields, locales, defaultLocale)]);
        setOpenIndex(rows.length);
    };
    const remove = (i) => { update(rows.filter((_, j) => j !== i)); setOpenIndex(-1); };
    const duplicate = (i) => {
        if (rows.length >= max) return;
        const next = [...rows];
        next.splice(i + 1, 0, structuredClone(rows[i]));
        update(next);
        setOpenIndex(i + 1);
    };
    const move = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= rows.length) return;
        const next = [...rows];
        [next[i], next[j]] = [next[j], next[i]];
        update(next);
        setOpenIndex(j);
    };

    return (
        <div className="space-y-2">
            {rows.map((row, i) => {
                const open = openIndex === i;
                return (
                    <div key={i} className={`rounded-xl border bg-white transition ${open ? 'border-brand/40 shadow-xs' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-1 px-2 py-1.5">
                            <button type="button" onClick={() => setOpenIndex(open ? -1 : i)} className="flex min-w-0 flex-1 items-center gap-2 text-start">
                                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">{i + 1}</span>
                                <span className="truncate text-xs font-medium text-slate-700">{titleOf(row, i)}</span>
                                {open ? <HiOutlineChevronUp className="ms-auto h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden /> : <HiOutlineChevronDown className="ms-auto h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />}
                            </button>
                            <div className="flex shrink-0 items-center text-slate-400">
                                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md p-1 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" aria-label={t('customizer_move_up', 'Move up')}><HiOutlineChevronUp className="h-3.5 w-3.5" aria-hidden /></button>
                                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="rounded-md p-1 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" aria-label={t('customizer_move_down', 'Move down')}><HiOutlineChevronDown className="h-3.5 w-3.5" aria-hidden /></button>
                                <button type="button" onClick={() => duplicate(i)} disabled={rows.length >= max} className="rounded-md p-1 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" aria-label={t('customizer_duplicate', 'Duplicate')}><HiOutlineDocumentDuplicate className="h-3.5 w-3.5" aria-hidden /></button>
                                <button type="button" onClick={() => remove(i)} className="rounded-md p-1 hover:bg-red-50 hover:text-red-600" aria-label={t('customizer_remove', 'Remove')}><HiOutlineTrash className="h-3.5 w-3.5" aria-hidden /></button>
                            </div>
                        </div>
                        {open ? (
                            <div className="border-t border-slate-100 px-3 py-3">
                                <SettingsForm
                                    fields={itemFields}
                                    values={row || {}}
                                    onChange={(nextRow) => update(rows.map((r, j) => (j === i ? nextRow : r)))}
                                    locales={locales}
                                    defaultLocale={defaultLocale}
                                    editLocale={editLocale}
                                    apiBase={apiBase}
                                    depth={1}
                                />
                            </div>
                        ) : null}
                    </div>
                );
            })}
            <button
                type="button"
                onClick={add}
                disabled={rows.length >= max}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand hover:bg-brand-light/40 hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
                <HiOutlinePlus className="h-4 w-4" aria-hidden />
                {t('customizer_list_add', 'Add item')}
                {Number.isFinite(max) ? <span className="text-[10px] font-medium text-slate-400">({rows.length}/{max})</span> : null}
            </button>
        </div>
    );
}

/**
 * Schema-driven settings form for one section, one list item or one theme-settings group.
 *
 * Props: `fields` (contract §1 SettingField[]), `values` (the settings object), `onChange(nextValues)`,
 * store `locales`/`defaultLocale`, `editLocale` (default language tab), `viewport` (global toggle;
 * responsive range fields default to it) and `apiBase` (media picker).
 *
 * Responsive range fields write the desktop value to `values[id]` and per-viewport overrides to
 * `values.__responsive[id][viewport]`, matching StorePageBuilderPage.
 */
export default function SettingsForm({ fields, values, onChange, locales, defaultLocale, editLocale, viewport = 'desktop', apiBase, depth = 0 }) {
    const { t } = useTranslation();
    const [fieldViewport, setFieldViewport] = useState({});
    const list = Array.isArray(fields) ? fields : [];
    const current = values && typeof values === 'object' ? values : {};

    if (list.length === 0) {
        return <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">{t('customizer_no_settings', 'This section has no settings.')}</p>;
    }

    const set = (id, next) => onChange({ ...current, [id]: next });

    return (
        <div className="space-y-4">
            {list.map((field) => {
                const responsive = depth === 0 && field.type === 'range' && field.responsive;
                const vp = responsive ? (fieldViewport[field.id] || viewport) : 'desktop';
                const overrides = current.__responsive?.[field.id];
                const hasOverride = responsive && vp !== 'desktop' && overrides?.[vp] !== undefined;
                const value = responsive && vp !== 'desktop' ? (overrides?.[vp] ?? current[field.id]) : current[field.id];
                const write = (next) => {
                    if (!responsive || vp === 'desktop') { set(field.id, next); return; }
                    onChange({ ...current, __responsive: { ...(current.__responsive || {}), [field.id]: { ...(overrides || {}), [vp]: next } } });
                };
                const clearOverride = () => {
                    const nextField = { ...(overrides || {}) };
                    delete nextField[vp];
                    onChange({ ...current, __responsive: { ...(current.__responsive || {}), [field.id]: nextField } });
                };
                const isToggle = field.type === 'toggle' && !isTranslatable(field);
                return (
                    <div key={field.id} className="space-y-1.5">
                        {!isToggle ? (
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-semibold text-slate-700">{field.label || field.id}</label>
                                {responsive ? (
                                    <div className="flex items-center gap-1">
                                        {hasOverride ? (
                                            <button type="button" onClick={clearOverride} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title={t('customizer_reset_override', 'Use desktop value')}>
                                                <HiOutlineArrowUturnLeft className="h-3.5 w-3.5" aria-hidden />
                                            </button>
                                        ) : null}
                                        <ViewportPills value={vp} onChange={(next) => setFieldViewport((p) => ({ ...p, [field.id]: next }))} overrides={overrides} />
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        <FieldControl
                            field={field}
                            value={value}
                            onChange={write}
                            locales={locales}
                            defaultLocale={defaultLocale}
                            editLocale={editLocale}
                            apiBase={apiBase}
                            depth={depth}
                        />
                        {field.hint && !isToggle ? <p className="text-[11px] leading-relaxed text-slate-400">{field.hint}</p> : null}
                    </div>
                );
            })}
        </div>
    );
}
