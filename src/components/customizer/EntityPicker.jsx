import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineCube, HiOutlineSquares2X2 } from 'react-icons/hi2';
import api from '../../api/client';
import { INPUT_CLASS } from '../ui/FormField';
import { useDebounced } from '../../hooks/useDebounced';

/** Dashboard endpoints that back the `product` / `category` field types (contract §1). */
const SOURCES = {
    product: { endpoint: '/products', Icon: HiOutlineCube },
    category: { endpoint: '/categories', Icon: HiOutlineSquares2X2 },
};

const rowLabel = (row) => {
    const name = row?.name ?? row?.title ?? '';
    if (name && typeof name === 'object') return name.en || name.ar || Object.values(name).find(Boolean) || `#${row.id}`;
    return String(name || `#${row?.id ?? ''}`);
};

/**
 * Async search picker for product/category references. Stores the referenced id as a string.
 * `collection` (no dashboard endpoint yet) renders as a plain id/slug input.
 */
export default function EntityPicker({ kind, value, onChange, placeholder }) {
    const { t } = useTranslation();
    const source = SOURCES[kind];
    const [query, setQuery] = useState('');
    const debounced = useDebounced(query, 300);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState('');
    const root = useRef(null);

    const current = value == null ? '' : String(value);

    // Search whenever the panel is open.
    useEffect(() => {
        if (!source || !open) return undefined;
        let active = true;
        setLoading(true);
        api.get(source.endpoint, { params: { per_page: 12, ...(debounced.trim() ? { search: debounced.trim() } : {}) } })
            .then(({ data }) => { if (active) setRows(Array.isArray(data?.data) ? data.data : []); })
            .catch(() => { if (active) setRows([]); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [source, open, debounced]);

    // Resolve the label of a preselected id once (best effort).
    useEffect(() => {
        if (!source || !current || label) return undefined;
        let active = true;
        api.get(`${source.endpoint}/${encodeURIComponent(current)}`)
            .then(({ data }) => { if (active) setLabel(rowLabel(data?.data ?? data)); })
            .catch(() => undefined);
        return () => { active = false; };
    }, [source, current, label]);

    // Close on outside click.
    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    if (!source) {
        return (
            <input
                type="text"
                value={current}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || t('customizer_collection_placeholder', 'Collection id or slug')}
                className={INPUT_CLASS}
                dir="ltr"
            />
        );
    }

    const { Icon } = source;

    return (
        <div ref={root} className="relative">
            {current ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-slate-800">{label || `#${current}`}</span>
                    <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-brand hover:underline">{t('customizer_change', 'Change')}</button>
                    <button type="button" onClick={() => { onChange(''); setLabel(''); }} className="rounded-md p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label={t('customizer_clear', 'Clear')}>
                        <HiOutlineXMark className="h-4 w-4" aria-hidden />
                    </button>
                </div>
            ) : null}
            {!current || open ? (
                <div className={`relative ${current ? 'mt-2' : ''}`}>
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-slate-400" aria-hidden />
                    <input
                        type="text"
                        value={query}
                        onFocus={() => setOpen(true)}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                        placeholder={placeholder || (kind === 'product' ? t('customizer_search_products', 'Search products…') : t('customizer_search_categories', 'Search categories…'))}
                        className={`${INPUT_CLASS} ps-9`}
                    />
                </div>
            ) : null}
            {open ? (
                <div className="absolute start-0 end-0 z-30 mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5">
                    {loading ? (
                        <p className="px-3 py-2 text-xs text-slate-400">{t('customizer_searching', 'Searching…')}</p>
                    ) : rows.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-slate-400">{t('no_results', 'No results')}</p>
                    ) : rows.map((row) => (
                        <button
                            key={row.id}
                            type="button"
                            onClick={() => { onChange(String(row.id)); setLabel(rowLabel(row)); setOpen(false); setQuery(''); }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-brand-light/60 ${String(row.id) === current ? 'bg-brand-light/40 text-brand-dark' : 'text-slate-700'}`}
                        >
                            {row.image_url || row.thumbnail_url || row.image ? (
                                <img src={row.image_url || row.thumbnail_url || row.image} alt="" className="h-7 w-7 shrink-0 rounded-md border border-slate-200 object-cover" />
                            ) : (
                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-400"><Icon className="h-4 w-4" aria-hidden /></span>
                            )}
                            <span className="min-w-0 flex-1 truncate">{rowLabel(row)}</span>
                            <span className="shrink-0 font-mono text-[10px] text-slate-400">#{row.id}</span>
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
