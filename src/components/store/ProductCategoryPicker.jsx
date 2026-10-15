import { useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronDown, HiOutlineXMark } from '../workspace/WorkspaceIcons';

export default function ProductCategoryPicker({ categories, value = [], onChange, disabled }) {
    const { i18n } = useTranslation();
    const text = (a, e) => i18n.language.startsWith('ar') ? a : e;
    const [query, setQuery] = useState('');
    return <div className="text-sm"><span>{text('التصنيفات', 'Categories')}</span><Popover className="relative mt-1">
        <PopoverButton disabled={disabled} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-start text-sm" aria-label={text('اختيار تصنيفات المنتج', 'Choose product categories')}><span>{value.length ? text(`${value.length} تصنيف محدد`, `${value.length} selected categories`) : text('دون تصنيف', 'No category')}</span><HiOutlineChevronDown aria-hidden className="size-4" /></PopoverButton>
        <PopoverPanel className="absolute z-30 mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 shadow-lg"><input type="search" aria-label={text('بحث التصنيفات', 'Search categories')} placeholder={text('بحث التصنيفات', 'Search categories')} className="mb-2 w-full rounded border border-slate-200 px-2 py-1.5" value={query} onChange={(e) => setQuery(e.target.value)} /><div className="max-h-56 overflow-auto">{categories.filter((category) => category.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map((category) => <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-slate-50"><input type="checkbox" checked={value.includes(category.id)} disabled={!value.includes(category.id) && value.length >= 20} onChange={(e) => onChange(e.target.checked ? [...value, category.id] : value.filter((id) => id !== category.id))} /><span>{category.name}</span></label>)}</div></PopoverPanel>
    </Popover><div className="mt-2 flex flex-wrap gap-2">{value.map((id) => <span key={id} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs">{categories.find((category) => category.id === id)?.name || `#${id}`}<button type="button" disabled={disabled} aria-label={`${text('إزالة التصنيف', 'Remove category')} ${categories.find((category) => category.id === id)?.name || id}`} onClick={() => onChange(value.filter((item) => item !== id))}><HiOutlineXMark aria-hidden className="size-3.5" /></button></span>)}</div></div>;
}
