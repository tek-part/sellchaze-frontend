import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { useDebounced } from '../../hooks/useDebounced';
import { HiOutlineCheck, HiOutlineXMark } from '../workspace/WorkspaceIcons';

const rowName = (row) => {
    const name = row?.name ?? row?.title ?? '';
    if (name && typeof name === 'object') return name.en || name.ar || Object.values(name).find(Boolean) || `#${row.id}`;
    return String(name || `#${row?.id ?? ''}`);
};

/**
 * Searchable multi-select for the store's products or categories (the same Headless UI combobox
 * as the orders product filter, with chips). `value` is a list of ids; `names` caches labels so
 * the parent can describe the selection, and `onNames` reports labels it learns.
 */
export default function DiscountTargetPicker({ apiBase, kind, value, onChange, names = {}, onNames, ar, id, label, error, invalid }) {
    const [query, setQuery] = useState('');
    const search = useDebounced(query, 250);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const endpoint = `${apiBase}/catalog/${kind}`;

    useEffect(() => {
        let active = true; setLoading(true); setLoadError('');
        api.get(endpoint, { params: { per_page: 20, ...(search.trim() ? { search: search.trim() } : {}) } })
            .then(({ data }) => {
                if (!active) return;
                const rows = Array.isArray(data?.data) ? data.data : [];
                setOptions(rows.map((row) => ({ id: Number(row.id), name: rowName(row) })));
                onNames?.(kind, Object.fromEntries(rows.map((row) => [String(row.id), rowName(row)])));
            })
            .catch(() => { if (active) setLoadError(kind === 'categories' ? (ar ? 'تعذر تحميل الأقسام' : 'Could not load categories') : (ar ? 'تعذر تحميل المنتجات' : 'Could not load products')); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // onNames is a stable setter from the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint, search, ar, kind]);

    // Resolve labels of preselected ids the search has not returned (best effort, edit mode).
    const missing = useMemo(() => value.filter((item) => !names[String(item)]).slice(0, 20), [value, names]);
    const missingKey = missing.join(',');
    useEffect(() => {
        if (!missing.length) return undefined;
        let active = true;
        Promise.all(missing.map((item) => api.get(`${endpoint}/${item}`).then(({ data }) => [String(item), rowName(data?.data ?? data)]).catch(() => null)))
            .then((pairs) => { if (active) onNames?.(kind, Object.fromEntries(pairs.filter(Boolean))); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint, missingKey]);

    const selected = value.map((item) => ({ id: item, name: names[String(item)] || `#${item}` }));
    const placeholder = kind === 'categories' ? (ar ? 'ابحث عن قسم' : 'Search categories') : (ar ? 'ابحث عن منتج' : 'Search products');

    return (
        <div className="min-w-0">
            <Combobox immediate multiple by="id" value={selected} onChange={(items) => { onChange(items.map((item) => Number(item.id))); setQuery(''); }} onClose={() => setQuery('')}>
                <ComboboxInput id={id} aria-label={label} aria-invalid={invalid ? 'true' : undefined} aria-describedby={error ? `${id}-error` : undefined}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${invalid ? 'border-red-300' : 'border-slate-200'}`}
                    value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} autoComplete="off" />
                <ComboboxOptions anchor="bottom start" modal={false} className="z-50 max-h-64 w-[var(--input-width)] overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg [--anchor-gap:4px] empty:invisible">
                    {options.map((option) => (
                        <ComboboxOption key={option.id} value={option} className="group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-slate-700 data-focus:bg-slate-100">
                            <HiOutlineCheck aria-hidden className="h-4 w-4 shrink-0 text-brand opacity-0 group-data-selected:opacity-100" />
                            <span className="truncate">{option.name}</span>
                        </ComboboxOption>
                    ))}
                    {loading ? <p role="status" className="px-3 py-2 text-slate-600">{ar ? 'جارٍ التحميل…' : 'Loading…'}</p>
                        : loadError ? <p role="status" className="px-3 py-2 text-red-700">{loadError}</p>
                            : !options.length ? <p role="status" className="px-3 py-2 text-slate-600">{ar ? 'لا توجد نتائج' : 'No results'}</p> : null}
                </ComboboxOptions>
            </Combobox>
            {selected.length ? (
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={label}>
                    {selected.map((item) => (
                        <li key={item.id} className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 ps-2.5 pe-1 text-xs font-medium text-slate-700">
                            <span className="truncate">{item.name}</span>
                            <button type="button" className="grid h-5 w-5 place-items-center rounded-full text-slate-600 hover:bg-slate-200" aria-label={`${ar ? 'إزالة' : 'Remove'} ${item.name}`}
                                onClick={() => onChange(value.filter((other) => other !== item.id))}>
                                <HiOutlineXMark aria-hidden className="h-3.5 w-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
            {error ? <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
        </div>
    );
}
