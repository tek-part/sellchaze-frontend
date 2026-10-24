import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { useEffect, useState } from 'react';
import api from '../../../api/client';
import { useDebounced } from '../../../hooks/useDebounced';

export default function OrderProductFilter({ apiBase, value, onChange, ar }) {
    const [query, setQuery] = useState(''); const search = useDebounced(query, 250); const [options, setOptions] = useState([]); const [chosen, setChosen] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
    useEffect(() => { let active = true; setLoading(true); setError(''); api.get(`${apiBase}/orders/filter-products`, { params: { search } }).then(({ data }) => { if (active) setOptions(data.data || []); }).catch(() => { if (active) setError(ar ? 'تعذر تحميل المنتجات' : 'Could not load products'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [apiBase, search, ar]);
    return <Combobox value={value ? chosen || { id: value, name: String(value) } : null} onChange={option => { setChosen(option); onChange(option ? String(option.id) : '', option); setQuery(''); }}>
        <ComboboxInput aria-label={ar ? 'المنتج' : 'Product'} displayValue={option => option?.name || ''} onChange={event => { setQuery(event.target.value); if (!event.target.value) { setChosen(null); onChange(''); } }} placeholder={ar ? 'ابحث عن منتج' : 'Search products'} />
        <ComboboxOptions anchor="bottom start" className="ws-orders-product-options">{options.map(option => <ComboboxOption key={option.id} value={option}>{option.name}</ComboboxOption>)}{loading ? <p role="status">{ar ? 'جارٍ التحميل…' : 'Loading…'}</p> : error ? <p role="status">{error}</p> : !options.length ? <p role="status">{ar ? 'لا توجد نتائج' : 'No results'}</p> : null}</ComboboxOptions>
    </Combobox>;
}
