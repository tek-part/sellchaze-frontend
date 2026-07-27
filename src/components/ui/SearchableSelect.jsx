import { useMemo, useState, useRef, useLayoutEffect, Children, isValidElement } from 'react';
import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronUpDown, HiOutlineCheck, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

/** Max dropdown height (matches max-h-72 = 18rem). Used to decide flip direction. */
const DROPDOWN_MAX_PX = 288;

/**
 * When the list opens, decide whether it should drop UP (not enough room below the
 * trigger, and more room above) or DOWN. Runs synchronously before paint so the
 * panel renders in the right place without a flicker.
 */
function FlipWatcher({ open, anchorRef, onResolve }) {
    useLayoutEffect(() => {
        if (!open || !anchorRef.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        onResolve(spaceBelow < DROPDOWN_MAX_PX && spaceAbove > spaceBelow);
    }, [open, anchorRef, onResolve]);
    return null;
}

/**
 * Select2-style dropdown: a native-<select> drop-in that adds a search box to the
 * dropdown when it holds more than `searchThreshold` options (default 10).
 *
 * Drop-in contract (so migrating `<select>` is mostly a tag rename):
 *   - Accepts `<option>` (and `<optgroup>`) children, OR an `options` prop
 *     ([{ value, label, disabled }]).
 *   - `value` is compared as a string, exactly like a native <select>.
 *   - `onChange` receives a native-like event: `{ target: { value, name } }`,
 *     so existing handlers `(e) => setX(e.target.value)` keep working unchanged.
 *
 * Built on Headless UI's Combobox (already a dependency) — accessible, keyboard
 * navigable, RTL-aware, and portal-anchored so it never clips inside tables/modals.
 */

// Flatten <option>/<optgroup> children into a plain [{ value, label, disabled }].
function optionsFromChildren(children) {
    const out = [];
    Children.forEach(children, (child) => {
        if (!isValidElement(child)) return;
        // <optgroup>: flatten its options (group label is dropped — Combobox is flat).
        if (child.type === 'optgroup' || child.props?.label !== undefined && child.props?.children && child.type !== 'option') {
            out.push(...optionsFromChildren(child.props.children));
            return;
        }
        if (child.type === 'option') {
            const label = typeof child.props.children === 'string'
                ? child.props.children
                : Children.toArray(child.props.children).join('');
            out.push({
                value: child.props.value ?? '',
                label,
                disabled: !!child.props.disabled,
            });
        }
    });
    return out;
}

export default function SearchableSelect({
    value,
    onChange,
    options,
    children,
    name,
    id,
    placeholder,
    disabled = false,
    required = false,
    searchThreshold = 10,
    className = '',
    buttonClassName = '',
    'aria-label': ariaLabel,
}) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');

    const allItems = useMemo(() => {
        const raw = options ?? optionsFromChildren(children);
        return raw.map((o) => ({
            value: String(o.value ?? ''),
            label: o.label ?? String(o.value ?? ''),
            disabled: !!o.disabled,
        }));
    }, [options, children]);

    // An empty-value option (e.g. "— Select —") acts as the placeholder, not a row.
    const emptyOption = allItems.find((o) => o.value === '');
    const items = useMemo(() => allItems.filter((o) => o.value !== ''), [allItems]);
    const resolvedPlaceholder = placeholder ?? emptyOption?.label ?? t('select_placeholder', '— Select —');

    const currentValue = value === undefined || value === null ? '' : String(value);
    const selected = items.find((o) => o.value === currentValue) ?? null;
    const showSearch = items.length > searchThreshold;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((o) => o.label.toLowerCase().includes(q));
    }, [items, query]);

    const emit = (next) => {
        onChange?.({ target: { value: next ?? '', name: name ?? '' } });
    };

    const buttonRef = useRef(null);
    const [dropUp, setDropUp] = useState(false);

    const baseButton =
        'flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-start text-sm text-slate-900 outline-hidden transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

    return (
        <Combobox
            value={currentValue}
            onChange={(next) => {
                setQuery('');
                emit(next);
            }}
            disabled={disabled}
            immediate
            as="div"
            className={`relative ${className || 'w-full'}`}
        >
            {({ open }) => (
              <>
                <FlipWatcher open={open} anchorRef={buttonRef} onResolve={setDropUp} />

                {/* Trigger — looks like the old <select>; shows the selected label. */}
                <ComboboxButton
                    ref={buttonRef}
                    id={id}
                    name={name}
                    aria-label={ariaLabel}
                    aria-required={required || undefined}
                    className={`${baseButton} ${buttonClassName}`}
                >
                    <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>
                        {selected ? selected.label : resolvedPlaceholder}
                    </span>
                    <HiOutlineChevronUpDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                </ComboboxButton>

                <ComboboxOptions
                    transition
                    className={`absolute start-0 z-50 max-h-72 w-full min-w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 outline-hidden empty:invisible data-[closed]:opacity-0 transition duration-100 ease-out ${
                        dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
                    }`}
                >
                {showSearch ? (
                    <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b border-slate-100 bg-white px-2 py-2">
                        <div className="relative">
                            <HiOutlineMagnifyingGlass className="pointer-events-none absolute inset-y-0 start-2 my-auto h-4 w-4 text-slate-400" aria-hidden />
                            <ComboboxInput
                                autoFocus
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 ps-8 pe-3 py-1.5 text-sm text-slate-900 outline-hidden focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                                placeholder={t('search', 'Search…')}
                                displayValue={() => query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </div>
                ) : null}

                {filtered.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-400">{t('no_results', 'No results')}</div>
                ) : (
                    filtered.map((opt) => (
                        <ComboboxOption
                            key={opt.value}
                            value={opt.value}
                            disabled={opt.disabled}
                            className={({ focus, disabled: isDisabled }) =>
                                `flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                                    focus ? 'bg-brand text-white' : 'text-slate-700'
                                } ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}`
                            }
                        >
                            {({ focus, selected: isSel }) => (
                                <>
                                    <span className="truncate">{opt.label}</span>
                                    {isSel ? (
                                        <HiOutlineCheck className={`h-4 w-4 shrink-0 ${focus ? 'text-white' : 'text-brand'}`} aria-hidden />
                                    ) : null}
                                </>
                            )}
                        </ComboboxOption>
                    ))
                )}
                </ComboboxOptions>
              </>
            )}
        </Combobox>
    );
}
