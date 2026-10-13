import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useEffect, useState } from 'react';
import api from '../../../api/client';
import { useDebounced } from '../../../hooks/useDebounced';
import { HiOutlineChevronDown, HiOutlineChevronRight, HiOutlineXMark } from '../../workspace/WorkspaceIcons';
import Field from './ManualOrderField';
import { manualLineKey } from './manual-order';

function matchesSelection(line, product, variant) {
    return line.product.id === product.id && (line.variant?.id ?? null) === (variant?.id ?? null);
}
function hasSelection(selected, product, variant = null) {
    return [...selected.values()].some(line => matchesSelection(line, product, variant));
}

function VariantChoices({ product, apiBase, selected, onToggle, ar }) {
    const [page, setPage] = useState(1);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let active = true;
        setLoading(true); setError('');
        api.get(`${apiBase}/orders/manual/products/${product.id}/variants`, { params: { page } }).then(({ data }) => { if (active) setResult(data); }).catch(e => { if (active) setError(e.response?.data?.message || e.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, product.id, page]);
    return <div className="ws-manual-variants" aria-busy={loading}>
        {error ? <p role="alert">{error}</p> : null}
        {loading ? <p role="status">{ar ? 'جارٍ تحميل المتغيرات…' : 'Loading variants…'}</p> : result?.data.length ? result.data.map(variant => <label key={variant.id}>
            <input type="checkbox" checked={hasSelection(selected, product, variant)} onChange={event => onToggle(product, variant, event.target.checked)} disabled={!hasSelection(selected, product, variant) && selected.size >= 100} />
            <span><strong>{Object.entries(variant.options || {}).map(([key, value]) => `${key}: ${value}`).join(' · ') || variant.name}</strong><small>{ar ? 'السعر' : 'Price'}: {variant.price}</small></span>
        </label>) : <p>{ar ? 'لا توجد متغيرات متاحة.' : 'No variants are available.'}</p>}
        {result?.meta.last_page > 1 ? <div className="ws-manual-variant-pages"><button type="button" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>{ar ? 'السابق' : 'Previous'}</button><span>{page} / {result.meta.last_page}</span><button type="button" disabled={loading || page >= result.meta.last_page} onClick={() => setPage(value => value + 1)}>{ar ? 'التالي' : 'Next'}</button></div> : null}
    </div>;
}

export default function ManualProductPicker({ apiBase, items, ar, theme, onClose, onApply }) {
    const text = (a, e) => ar ? a : e;
    const [selected, setSelected] = useState(() => new Map(items.map(line => [line.key, line])));
    const [name, setName] = useState(''); const [sku, setSku] = useState('');
    const searchName = useDebounced(name, 300); const searchSku = useDebounced(sku, 300);
    const [page, setPage] = useState(1); const [perPage, setPerPage] = useState(25);
    const [expanded, setExpanded] = useState(() => new Set()); const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true); const [error, setError] = useState('');
    useEffect(() => { setPage(1); }, [searchName, searchSku, perPage]);
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(`${apiBase}/orders/manual/products`, { params: { name: searchName, sku: searchSku, page, per_page: perPage } }).then(({ data }) => { if (active) setResult(data); }).catch(e => { if (active) setError(e.response?.data?.message || e.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, searchName, searchSku, page, perPage]);
    function toggle(product, variant, checked) {
        const key = manualLineKey(product.id, variant?.id);
        setSelected(current => {
            const next = new Map(current);
            if (!checked) { for (const [entryKey, line] of next) if (matchesSelection(line, product, variant)) next.delete(entryKey); }
            else if (!hasSelection(next, product, variant) && next.size < 100) next.set(key, { key, product, variant, unitPrice: variant?.price ?? product.price, priceEdited: false, quantity: '1', personalization: {} });
            return next;
        });
    }
    const pending = loading || name !== searchName || sku !== searchSku;
    const rows = result?.data || [];
    return <Dialog open onClose={onClose} className="ws-manual-picker" dir={ar ? 'rtl' : 'ltr'} data-workspace-theme={theme}>
        <DialogBackdrop transition className="ws-orders-backdrop ws-manual-picker-backdrop" />
        <div className="ws-manual-picker-position"><DialogPanel transition className="ws-manual-picker-panel">
            <header><DialogTitle>{text('اختر المنتجات', 'Choose products')}</DialogTitle><button type="button" onClick={onClose} aria-label={text('إغلاق اختيار المنتجات', 'Close product selection')}><HiOutlineXMark aria-hidden /></button></header>
            <div className="ws-manual-picker-content"><div className="ws-manual-picker-search"><Field label={text('ابحث باسم المنتج', 'Search by product name')} value={name} maxLength={200} onChange={setName} /><Field label={text('ابحث بال SKU', 'Search by SKU')} value={sku} maxLength={200} onChange={setSku} /></div>
                {error ? <p role="alert">{error}</p> : null}
                <div className="ws-manual-picker-table" aria-busy={pending}><table><thead><tr><th><span className="sr-only">{text('اختيار', 'Select')}</span></th><th>{text('الصورة', 'Image')}</th><th>{text('الاسم', 'Name')}</th><th>{text('السعر', 'Price')}</th><th>{text('تاريخ الإنشاء', 'Created')}</th></tr></thead><tbody>{rows.map(product => <ProductRow key={product.id} product={product} apiBase={apiBase} selected={selected} toggle={toggle} ar={ar} expanded={expanded.has(product.id)} onExpand={() => setExpanded(current => { const next = new Set(current); if (next.has(product.id)) next.delete(product.id); else next.add(product.id); return next; })} />)}{!rows.length ? <tr><td colSpan={5}>{pending ? text('جارٍ تحميل المنتجات…', 'Loading products…') : text('لا توجد منتجات بهذه الفلاتر.', 'No products match these filters.')}</td></tr> : null}</tbody></table></div>
                <div className="ws-orders-pagination"><label>{text('الصفوف لكل صفحة:', 'Rows per page:')}<select value={perPage} onChange={event => setPerPage(Number(event.target.value))}>{[10, 25, 50, 100].map(value => <option key={value} value={value}>{value}</option>)}</select></label><span>{result?.meta.total ? (page - 1) * perPage + 1 : 0}-{Math.min(page * perPage, result?.meta.total || 0)} {text('من', 'of')} {result?.meta.total || 0}</span><button type="button" disabled={pending || page <= 1} aria-label={text('صفحة المنتجات السابقة', 'Previous product page')} onClick={() => setPage(value => value - 1)}><HiOutlineChevronRight className={ar ? '' : 'rotate-180'} /></button><button type="button" disabled={pending || page >= (result?.meta.last_page || 1)} aria-label={text('صفحة المنتجات التالية', 'Next product page')} onClick={() => setPage(value => value + 1)}><HiOutlineChevronRight className={ar ? 'rotate-180' : ''} /></button></div>
            </div>
            <footer><button type="button" onClick={() => onApply([...selected.values()])}>{text('اضافة المنتجات', 'Add products')}</button></footer>
        </DialogPanel></div>
    </Dialog>;
}

function ProductRow({ product, apiBase, selected, toggle, ar, expanded, onExpand }) {
    const chosen = hasSelection(selected, product);
    return <><tr><td>{product.variants_count ? <button type="button" aria-expanded={expanded} onClick={onExpand} aria-label={`${ar ? 'عرض متغيرات' : 'Show variants for'} ${product.name}`}><HiOutlineChevronDown className={expanded ? 'rotate-180' : ''} /></button> : <input type="checkbox" checked={chosen} disabled={!chosen && selected.size >= 100} aria-label={`${ar ? 'اختيار' : 'Select'} ${product.name}`} onChange={event => toggle(product, null, event.target.checked)} />}</td><td>{product.image_url ? <img src={product.image_url} alt="" /> : null}</td><td>{product.name}</td><td>{product.price}</td><td>{product.created_at ? new Date(product.created_at).toLocaleDateString('en-US') : '—'}</td></tr>{expanded ? <tr><td colSpan={5}><VariantChoices product={product} apiBase={apiBase} selected={selected} onToggle={toggle} ar={ar} /></td></tr> : null}</>;
}
