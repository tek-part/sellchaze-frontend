import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlineArrowDownTray, HiOutlineCube, HiOutlinePencilSquare, HiOutlineEye } from '../components/workspace/WorkspaceIcons';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { useDebounced } from '../hooks/useDebounced';
import { fetchAllPages } from '../utils/fetchAllPages';
import { catalogExportRow } from '../lib/store-catalog-export';

function CatalogImage({ url }) {
    const [failed, setFailed] = useState(false);
    return url && !failed ? <img src={url} alt="" onError={() => setFailed(true)} /> : <span className="ws-catalog-image"><HiOutlineCube aria-hidden /></span>;
}

export default function StoreProductsPage() {
    const { apiBase, uiBase } = useStoreScope();
    const { permissions = [], store } = useOutletContext();
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [query, setQuery] = useState('');
    const search = useDebounced(query, 300);
    const [status, setStatus] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [perPage, setPerPage] = useState(20);
    const [page, setPage] = useState(1);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [exportError, setExportError] = useState('');
    const [exporting, setExporting] = useState(false);
    const [selected, setSelected] = useState(() => new Map());
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);
    const canCategories = permissions.includes('categories-list');
    useEffect(() => {
        if (!canCategories) return;
        let active = true;
        fetchAllPages(`${apiBase}/catalog/categories`).then((rows) => { if (active) setCategories(rows); }).catch(() => { if (active) setCategories([]); });
        return () => { active = false; };
    }, [apiBase, canCategories]);
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(`${apiBase}/catalog/products`, { params: { search, status, category_id: categoryId, page, per_page: perPage } })
            .then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setError(e.response?.data?.message || e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, search, status, categoryId, page, perPage, reload]);
    const money = (value) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: store?.currency || 'EGP' }).format(Number(value));
    const pageProducts = result?.data || [];
    const allSelected = pageProducts.length > 0 && pageProducts.every((product) => selected.has(product.id));
    const someSelected = pageProducts.some((product) => selected.has(product.id));
    const toggleProduct = (product, checked) => setSelected((current) => { const next = new Map(current); if (checked) next.set(product.id, product); else next.delete(product.id); return next; });
    const togglePage = (checked) => setSelected((current) => { const next = new Map(current); pageProducts.forEach((product) => { if (checked) next.set(product.id, product); else next.delete(product.id); }); return next; });
    const exportCatalog = async (format) => {
        setExporting(true); setExportError('');
        try {
            if (!selected.size && result?.meta?.total > 10000) throw new Error(text('ضيّق الفلاتر لتصدير 10,000 منتج أو أقل في الملف الواحد.', 'Narrow your filters to export 10,000 products or fewer per file.'));
            const products = selected.size ? [...selected.values()] : await fetchAllPages(`${apiBase}/catalog/products`, { search, status, category_id: categoryId });
            if (!selected.size && products.length !== result?.meta?.total) throw new Error(text('تغيرت القائمة أثناء التصدير. حدّث المنتجات وحاول مرة أخرى.', 'The list changed during export. Refresh the products and try again.'));
            const rows = products.map(catalogExportRow);
            const filename = `store-products-${new Date().toISOString().slice(0, 10)}`;
            if (format === 'excel') {
                const { exportRowsToExcel } = await import('../utils/exportExcel');
                await exportRowsToExcel([
                    ['id', text('المعرف', 'ID')], ['name', text('المنتج', 'Product')], ['sku', 'SKU'], ['slug', text('الرابط', 'Slug')],
                    ['category', text('القسم', 'Category')], ['price', text('السعر', 'Price')], ['published', text('منشور', 'Published')],
                    ['stock', text('المخزون المتاح', 'Available stock')], ['variant_count', text('عدد الخيارات', 'Variant count')],
                ].map(([key, header]) => ({ key, header })), rows, filename);
            } else {
                const url = URL.createObjectURL(new Blob([JSON.stringify({ currency: store?.currency || 'EGP', products: rows }, null, 2)], { type: 'application/json' }));
                const link = document.createElement('a'); link.href = url; link.download = `${filename}.json`; link.click(); URL.revokeObjectURL(url);
            }
        } catch (e) { setExportError(e.message || text('تعذر تصدير المنتجات.', 'Products could not be exported.')); }
        finally { setExporting(false); }
    };
    return <section className="ws-catalog-page">
        <header className="ws-catalog-heading"><div><h1>{text('المنتجات', 'Products')}</h1><p>{text('أدر منتجات متجرك وأسعارها وخيارات الشراء والمخزون في مكان واحد.', 'Manage your store products, prices, buying options and stock in one place.')}</p></div><span className="ws-catalog-count">{result?.meta?.total ?? '—'} {text('منتج', 'products')}</span></header>
        <div className="ws-catalog-toolbar">
            <div className="ws-catalog-filters">
                <label className="ws-catalog-search"><HiOutlineMagnifyingGlass aria-hidden /><input aria-label={text('بحث المنتجات', 'Search products')} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); setSelected(new Map()); }} placeholder={text('ابحث باسم المنتج أو الرابط', 'Search product name or slug')} /></label>
                <select aria-label={text('حالة النشر', 'Publication status')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); setSelected(new Map()); }}><option value="">{text('كل الحالات', 'All statuses')}</option><option value="active">{text('منشور', 'Published')}</option><option value="draft">{text('مسودة', 'Draft')}</option></select>
                {categories.length > 0 ? <select aria-label={text('قسم المنتج', 'Product category')} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); setSelected(new Map()); }}><option value="">{text('كل الأقسام', 'All categories')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select> : null}
            </div>
            <div className="ws-catalog-actions">
                <button type="button" className="ws-secondary-button" disabled={loading || !!error || exporting} onClick={() => void exportCatalog('json')}><HiOutlineArrowDownTray aria-hidden />{text('تصدير JSON', 'Export JSON')}</button>
                <button type="button" className="ws-secondary-button" disabled={loading || !!error || exporting} onClick={() => void exportCatalog('excel')}><HiOutlineArrowDownTray aria-hidden />{text('تصدير Excel', 'Export Excel')}</button>
                {permissions.includes('products-create') ? <Link className="ws-primary-button" to={`${uiBase}/products/new`}><HiOutlinePlus aria-hidden />{text('إضافة منتج', 'Add product')}</Link> : null}
            </div>
        </div>
        {selected.size > 0 ? <div className="ws-catalog-selection"><span>{selected.size} {text('منتج محدد · التصدير يشمل المنتجات المحددة فقط', 'selected · exports include only selected products')}</span><button type="button" className="ws-secondary-button" onClick={() => setSelected(new Map())}>{text('إلغاء التحديد', 'Clear selection')}</button></div> : null}
        {exporting ? <p className="ws-note" role="status">{text('جارٍ تجهيز ملف المنتجات…', 'Preparing your product export…')}</p> : null}
        {exportError ? <p role="alert" className="ws-catalog-error">{exportError}</p> : null}
        {error ? <div role="alert" className="ws-catalog-error">{error}<button type="button" className="ws-secondary-button" onClick={() => setReload((value) => value + 1)}>{text('إعادة المحاولة', 'Retry')}</button></div> : <>
            <div className="ws-catalog-table" aria-busy={loading}>
                {loading ? <p role="status" className="ws-catalog-loading">{text('جارٍ تحميل المنتجات…', 'Loading products…')}</p> : null}
                <table><thead><tr><th className="ws-catalog-check"><input type="checkbox" aria-label={text('اختيار كل منتجات الصفحة', 'Select all products on this page')} disabled={loading || !pageProducts.length} checked={allSelected} ref={(input) => { if (input) input.indeterminate = someSelected && !allSelected; }} onChange={(e) => togglePage(e.target.checked)} /></th>{[text('المنتج', 'Product'), text('السعر', 'Price'), text('الخيارات / المخزون', 'Options / stock'), text('الحالة', 'Status'), text('إجراءات', 'Actions')].map((title) => <th key={title}>{title}</th>)}</tr></thead>
                    <tbody>{!loading && result?.data?.map((product) => <tr key={product.id}>
                        <td className="ws-catalog-check"><input type="checkbox" aria-label={`${text('اختيار', 'Select')} ${product.name}`} checked={selected.has(product.id)} onChange={(e) => toggleProduct(product, e.target.checked)} /></td>
                        <td><div className="ws-catalog-product"><CatalogImage key={product.image_url || 'empty'} url={product.image_url} /><div><Link to={`${uiBase}/products/${product.id}/edit`}>{product.name}</Link><small>{product.sku || product.slug}</small></div></div></td>
                        <td className="ws-catalog-money">{money(product.price)}</td>
                        <td>{product.variants?.length ? `${product.variants.length} ${text('خيارات', 'options')}` : product.track_inventory ? `${product.stock} ${text('متاح', 'available')}` : text('دون تتبع', 'Untracked')}</td>
                        <td><span className={`ws-catalog-status ${product.is_active ? 'ws-catalog-published' : ''}`}>{product.is_active ? text('منشور', 'Published') : text('مسودة', 'Draft')}</span></td>
                        <td><Link className="ws-icon-button" title={permissions.includes('products-edit') ? text('تعديل', 'Edit') : text('عرض', 'View')} aria-label={`${permissions.includes('products-edit') ? text('تعديل', 'Edit') : text('عرض', 'View')} ${product.name}`} to={`${uiBase}/products/${product.id}/edit`}>{permissions.includes('products-edit') ? <HiOutlinePencilSquare aria-hidden /> : <HiOutlineEye aria-hidden />}</Link></td>
                    </tr>)}</tbody></table>
                {!loading && !result?.data?.length ? <div className="ws-catalog-empty"><HiOutlineCube aria-hidden /><strong>{text('لا توجد منتجات مطابقة', 'No matching products')}</strong><p>{text('غيّر البحث أو الفلاتر، أو أضف أول منتج إلى متجرك.', 'Change your search or filters, or add your first store product.')}</p></div> : null}
            </div>
            {result?.meta ? <footer className="ws-catalog-pagination"><label>{text('عدد الصفوف', 'Rows per page')}<select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>{[20, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><span>{result.meta.current_page} / {result.meta.last_page} · {result.meta.total} {text('منتج', 'products')}</span><div><button type="button" className="ws-secondary-button" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}>{text('السابق', 'Previous')}</button><button type="button" className="ws-secondary-button" disabled={loading || page >= result.meta.last_page} onClick={() => setPage((value) => value + 1)}>{text('التالي', 'Next')}</button></div></footer> : null}
        </>}
    </section>;
}
