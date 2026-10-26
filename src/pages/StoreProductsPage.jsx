import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react';
import RssIcon from '@hugeicons/core-free-icons/RssIcon';
import { HiOutlinePlusCircle, HiOutlineArrowDownTray, HiOutlineCloudArrowUp, HiOutlineCube, HiOutlinePencilSquare, HiOutlineEye, HiOutlineDocumentDuplicate, HiOutlineTrash, HiOutlinePlayCircle, HiOutlineCheckCircle, HiOutlineArchiveBox, HiOutlineCurrencyDollar, HiOutlineTableCells } from '../components/workspace/WorkspaceIcons';
import CatalogBulkEditDialog from '../components/store/CatalogBulkEditDialog';
import CatalogImportDialog, { saveCatalogFile } from '../components/store/CatalogImportDialog';
import CatalogPriceChangeDialog from '../components/store/CatalogPriceChangeDialog';
import CatalogSheetDialog from '../components/store/CatalogSheetDialog';
import { IndexFilters, IndexTable, downloadCsv, useIndexQuery, useIndexTable } from '../components/data-table';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { fetchAllPages } from '../utils/fetchAllPages';
import './store/product-list.css';

function CatalogImage({ url }) {
    const [failed, setFailed] = useState(false);
    return <span className="ws-dt-thumb">{url && !failed ? <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} /> : <HiOutlineCube aria-hidden />}</span>;
}
const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const DEFAULTS = { sort: null, perPage: 25 };

export default function StoreProductsPage() {
    const { apiBase, uiBase } = useStoreScope();
    const { permissions = [], store, access } = useOutletContext();
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [categories, setCategories] = useState([]);
    const [actionError, setActionError] = useState(''); const [busy, setBusy] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [tool, setTool] = useState(null);
    const [importFormat, setImportFormat] = useState(''); const [confirm, setConfirm] = useState(null);
    const [guide, setGuide] = useState(''); const [notice, setNotice] = useState('');
    const scope = useRef(apiBase); scope.current = apiBase;
    const mounted = useRef(true); const inFlight = useRef(false);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 7000); return () => clearTimeout(timer); }, [notice]);
    const canCategories = permissions.includes('categories-list');
    useEffect(() => {
        let active = true; setCategories([]);
        if (canCategories) fetchAllPages(`${apiBase}/catalog/categories`).then((rows) => { if (active) setCategories(rows); }).catch(() => {});
        return () => { active = false; };
    }, [apiBase, canCategories]);

    const money = (value) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: store?.currency || 'EGP', maximumFractionDigits: 2 }).format(Number(value));
    const date = (value) => value ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—';
    const storefrontUrl = store?.storefront_url || store?.public_url;
    const inventory = (product) => {
        if (product.variants?.length) {
            const tracked = product.variants.filter((variant) => variant.track_inventory);
            const total = tracked.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock ?? 0)), 0);
            return { label: tracked.length ? text(`${total} متاح لـ ${product.variants.length} خيارات`, `${total} in stock for ${product.variants.length} variants`) : text(`${product.variants.length} خيارات`, `${product.variants.length} variants`), tone: tracked.length && total <= 0 ? 'critical' : '' };
        }
        if (!product.track_inventory) return { label: text('غير متتبع', 'Not tracked'), tone: '' };
        const stock = Number(product.stock ?? 0);
        return { label: text(`${stock} متاح`, `${stock} in stock`), tone: stock <= 0 ? 'critical' : stock <= 5 ? 'warning' : '' };
    };

    const filters = useMemo(() => [
        { key: 'status', label: text('الحالة', 'Status'), type: 'select', options: [{ value: 'active', label: text('نشط', 'Active') }, { value: 'draft', label: text('مسودة', 'Draft') }] },
        { key: 'stock', label: text('المخزون', 'Inventory'), type: 'select', options: [{ value: 'in_stock', label: text('متوفر', 'In stock') }, { value: 'low', label: text('مخزون منخفض', 'Low stock') }, { value: 'out_of_stock', label: text('نفد المخزون', 'Out of stock') }, { value: 'untracked', label: text('غير متتبع', 'Not tracked') }] },
        { key: 'type', label: text('النوع', 'Type'), type: 'select', options: [{ value: 'physical', label: text('منتج ملموس', 'Physical') }, { value: 'digital', label: text('منتج رقمي', 'Digital') }] },
        ...(categories.length ? [{ key: 'category', param: 'category_id', label: text('القسم', 'Category'), type: 'select', options: categories.map((category) => ({ value: String(category.id), label: category.name })) }] : []),
        { key: 'price', label: text('السعر', 'Price'), type: 'range' },
        { key: 'created', label: text('تاريخ الإضافة', 'Date added'), type: 'date-range' },
        { key: 'sku', label: 'SKU', type: 'text' },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, categories]);
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        { id: 'active', label: text('نشط', 'Active'), state: { filters: { status: 'active' } } },
        { id: 'draft', label: text('مسودة', 'Draft'), state: { filters: { status: 'draft' } } },
        { id: 'low', label: text('مخزون منخفض', 'Low stock'), state: { filters: { stock: 'low' } } },
        { id: 'out', label: text('نفد المخزون', 'Out of stock'), state: { filters: { stock: 'out_of_stock' } } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const columns = useMemo(() => [
        { key: 'product', header: text('المنتج', 'Product'), hideable: false, primary: true, sortKey: 'name', csv: (p) => p.name,
            render: (p) => <div className="ws-dt-cell-media"><CatalogImage key={p.image_url || 'empty'} url={p.image_url} /><div><Link className="ws-dt-title" to={`${uiBase}/products/${p.id}/edit`}>{p.name}</Link>{p.sku ? <span className="ws-dt-sub" dir="ltr">{p.sku}</span> : null}</div></div> },
        { key: 'status', header: text('الحالة', 'Status'), csv: (p) => (p.is_active ? 'active' : 'draft'),
            render: (p) => <span className={`ws-dt-badge ${p.is_active ? 'is-success' : ''}`}>{p.is_active ? text('نشط', 'Active') : text('مسودة', 'Draft')}</span> },
        { key: 'inventory', header: text('المخزون', 'Inventory'), sortKey: 'stock_quantity', csv: (p) => inventory(p).label,
            render: (p) => { const value = inventory(p); return <span className={value.tone === 'critical' ? 'ws-dt-badge is-critical' : value.tone === 'warning' ? 'ws-dt-badge is-warning' : ''}>{value.label}</span>; } },
        { key: 'category', header: text('القسم', 'Category'), csv: (p) => p.category?.name ?? '', render: (p) => p.category?.name ?? <span className="ws-dt-sub">—</span> },
        { key: 'type', header: text('النوع', 'Type'), defaultHidden: true, csv: (p) => (['codes', 'link'].includes(p.digital_type) ? 'digital' : 'physical'),
            render: (p) => (['codes', 'link'].includes(p.digital_type) ? text('رقمي', 'Digital') : text('ملموس', 'Physical')) },
        { key: 'price', header: text('السعر', 'Price'), sortKey: 'price', align: 'end', csv: (p) => p.price,
            render: (p) => <span className="ws-dt-num">{money(p.price)}{Number(p.compare_price) > Number(p.price) ? <del className="ws-dt-sub">{money(p.compare_price)}</del> : null}</span> },
        { key: 'sku', header: 'SKU', defaultHidden: true, csv: (p) => p.sku ?? '', render: (p) => <span dir="ltr">{p.sku || '—'}</span> },
        { key: 'created', header: text('تاريخ الإضافة', 'Date added'), sortKey: 'created_at', csv: (p) => p.created_at ?? '', render: (p) => <span className="ws-dt-num">{date(p.created_at)}</span> },
        { key: 'updated', header: text('آخر تعديل', 'Last updated'), sortKey: 'updated_at', defaultHidden: true, csv: (p) => p.updated_at ?? '', render: (p) => <span className="ws-dt-num">{date(p.updated_at)}</span> },
        { key: 'actions', header: <span className="sr-only">{text('إجراءات', 'Actions')}</span>, hideable: false, align: 'end',
            render: (p) => <div className="ws-dt-row-actions">
                {storefrontUrl && p.is_active ? <a className="ws-dt-icon" href={`${storefrontUrl.replace(/\/$/, '')}/products/${encodeURIComponent(p.slug)}`} target="_blank" rel="noopener noreferrer" aria-label={`${text('مشاهدة', 'View')} ${p.name}`} title={text('مشاهدة في المتجر', 'View in store')}><HiOutlineEye aria-hidden /></a> : null}
                {permissions.includes('products-create') ? <button type="button" className="ws-dt-icon" disabled={busy || !p.transfer_version} title={text('استنساخ المنتج', 'Duplicate product')} aria-label={`${text('استنساخ', 'Duplicate')} ${p.name}`} onClick={() => { setActionError(''); setConfirm({ kind: 'duplicate', product: p, key: crypto.randomUUID() }); }}><HiOutlineDocumentDuplicate aria-hidden /></button> : null}
            </div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase, storefrontUrl, permissions, busy, store?.currency]);

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:products`, filters, columns, views, defaults: DEFAULTS });
    const { data: rows, meta, loading, error, reload } = useIndexQuery({ url: `${apiBase}/catalog/products`, params: table.apiParams, formatError: errorText });
    const { clearSelection } = table;
    useEffect(() => { clearSelection(); setBulkOpen(false); setTool(null); setImportFormat(''); setConfirm(null); setNotice(''); setActionError(''); setBusy(false); }, [apiBase, clearSelection]);

    const selectedRows = [...table.selected.values()];
    const targets = () => selectedRows.map((product) => ({ id: product.id, version: product.transfer_version }));
    const versioned = (list) => list.length > 0 && list.every((product) => product.transfer_version) && !loading && !busy;
    const refreshSelection = () => { setBulkOpen(false); table.clearSelection(); reload(); };
    const run = async (work) => {
        if (inFlight.current) return;
        const originalScope = apiBase; inFlight.current = true; setBusy(true); setActionError('');
        try { await work(() => mounted.current && scope.current === originalScope); }
        catch (e) { if (mounted.current && scope.current === originalScope) setActionError(errorText(e)); }
        finally { inFlight.current = false; if (mounted.current && scope.current === originalScope) setBusy(false); }
    };
    const exportCatalog = () => run(async (current) => {
        const { data } = await api.post(`${apiBase}/catalog/products/export`, { products: targets() });
        if (!current()) return;
        saveCatalogFile(new Blob([JSON.stringify(data)], { type: 'application/json' }), `store-products-${new Date().toISOString().slice(0, 10)}.json`);
        setNotice(text('تم تصدير المنتجات وخياراتها والمخزون المتاح. المنتجات الرقمية مسودات دون روابط التسليم أو الأكواد. أضف روابط التسليم قبل الاستيراد واشحن الأكواد قبل النشر.', 'Products, options and available inventory exported. Digital products are drafts without delivery links or codes. Add delivery links before importing and replenish codes before publishing.'));
    });
    const setStatus = (activeStatus) => run(async (current) => {
        const { data } = await api.put(`${apiBase}/catalog/products/bulk`, { products: selectedRows.map((product) => ({ id: product.id, version: product.edit_version })), changes: { is_active: activeStatus } });
        if (!current()) return;
        setNotice(activeStatus ? text(`تم تفعيل ${data.meta.updated} منتج.`, `${data.meta.updated} products set to active.`) : text(`تم تحويل ${data.meta.updated} منتج إلى مسودة.`, `${data.meta.updated} products set to draft.`));
        refreshSelection();
    });
    const applyAction = () => run(async (current) => {
        const { data } = await api.post(`${apiBase}/catalog/products/${confirm.kind === 'delete' ? 'bulk-delete' : `${confirm.product.id}/duplicate`}`, confirm.kind === 'delete' ? { products: confirm.targets, idempotency_key: confirm.key } : { version: confirm.product.transfer_version, idempotency_key: confirm.key });
        if (!current()) return;
        setNotice(confirm.kind === 'delete' ? text(`تم حذف ${data.meta.deleted} منتج.`, `${data.meta.deleted} products deleted.`) : text('تم إنشاء نسخة مسودة دون مخزون. راجعها قبل النشر.', 'A draft copy with zero stock was created. Review it before publishing.'));
        setConfirm(null); refreshSelection();
    });
    const bulkActions = [
        ...(permissions.includes('products-edit') ? [
            { key: 'edit', label: text('تعديل', 'Edit'), icon: HiOutlinePencilSquare, disabled: (list) => list.length > 100 || !list.every((p) => p.edit_version) || busy, onAction: () => setBulkOpen(true) },
            { key: 'activate', label: text('تفعيل', 'Set active'), icon: HiOutlineCheckCircle, disabled: (list) => list.length > 100 || !list.every((p) => p.edit_version) || busy, onAction: () => void setStatus(true) },
            { key: 'draft', label: text('تحويل لمسودة', 'Set as draft'), icon: HiOutlineArchiveBox, disabled: (list) => list.length > 100 || !list.every((p) => p.edit_version) || busy, onAction: () => void setStatus(false) },
        ] : []),
        ...(permissions.includes('products-edit') ? [{ key: 'prices', label: text('تعديل الأسعار', 'Change prices'), icon: HiOutlineCurrencyDollar, disabled: (list) => !list.length || busy, onAction: (list) => setTool({ kind: 'prices', selected: list ?? selectedRows }) }] : []),
        { key: 'sheet', label: text('تصدير Excel / CSV', 'Export Excel / CSV'), icon: HiOutlineTableCells, disabled: (list) => !list.length || busy, onAction: (list) => setTool({ kind: 'sheet', selected: list ?? selectedRows }) },
        { key: 'export', label: text('تصدير JSON', 'Export JSON'), icon: HiOutlineArrowDownTray, disabled: (list) => !versioned(list), onAction: () => void exportCatalog() },
        ...(permissions.includes('products-delete') ? [{ key: 'delete', label: text('حذف', 'Delete'), icon: HiOutlineTrash, tone: 'danger', disabled: (list) => !versioned(list), onAction: () => { setActionError(''); setConfirm({ kind: 'delete', targets: targets(), key: crypto.randomUUID() }); } }] : []),
    ];

    return <section className="ws-catalog-page ws-product-list">
        <header className="ws-products-heading"><div className="ws-products-intro"><h1>{text('المنتجات', 'Products')}</h1><p>{text('أضف منتجات متجرك ونظّم بياناتها وخياراتها، وقدّم تجربة شراء واضحة تساعد عملاءك على إتمام الطلب.', 'Add store products and tailor the buying experience to improve sales and conversion.')}</p><div className="ws-products-help"><button type="button" onClick={() => setGuide('simple')}><HiOutlinePlayCircle aria-hidden />{text('كيفية إنشاء منتج بسيط', 'How to create a simple product')}</button><button type="button" onClick={() => setGuide('options')}><HiOutlinePlayCircle aria-hidden />{text('كيفية إنشاء منتج متعدد الخواص', 'How to create a product with options')}</button></div></div>
            <div className="ws-products-actions">{access?.canStoreSettings ? <Link className="ws-secondary-button" to={`${uiBase}/product-feed`}><HugeiconsIcon icon={RssIcon} size={16} strokeWidth={1.5} aria-hidden />Product Feed</Link> : null}{permissions.includes('products-edit') ? <button type="button" className="ws-secondary-button" onClick={() => setTool({ kind: 'prices', selected: [] })}><HiOutlineCurrencyDollar aria-hidden />{text('تعديل الأسعار بالجملة', 'Bulk price change')}</button> : null}<button type="button" className="ws-secondary-button" onClick={() => setTool({ kind: 'sheet', selected: [] })}><HiOutlineTableCells aria-hidden />{text('ملف Excel / CSV', 'Excel / CSV sheet')}</button>{permissions.includes('products-create') ? <><button type="button" className="ws-secondary-button" onClick={() => setImportFormat('json')}><HiOutlineCloudArrowUp aria-hidden />{text('استيراد من ملف JSON', 'Import JSON')}</button><button type="button" className="ws-secondary-button" onClick={() => setImportFormat('xlsx')}><HiOutlineCloudArrowUp aria-hidden />{text('استيراد من ملف Excel', 'Import Excel')}</button><Link className="ws-primary-button" to={`${uiBase}/products/new`}><HiOutlinePlusCircle aria-hidden />{text('إضافة منتج', 'Add product')}</Link></> : null}</div>
        </header>
        {notice ? <p role="status" className="ws-catalog-notice">{notice}</p> : null}
        {actionError && !confirm ? <p role="alert" className="ws-catalog-error">{actionError}</p> : null}
        {importFormat ? <CatalogImportDialog key={`${apiBase}:${importFormat}`} apiBase={apiBase} format={importFormat} onClose={() => setImportFormat('')} onImported={(count) => { setImportFormat(''); refreshSelection(); setNotice(text(`تم استيراد ${count} منتج.`, `${count} products imported.`)); }} /> : null}
        {tool?.kind === 'prices' ? <CatalogPriceChangeDialog key={apiBase} apiBase={apiBase} categories={categories} selected={tool.selected} currency={store?.currency} onClose={() => setTool(null)} onApplied={() => reload()} /> : null}
        {tool?.kind === 'sheet' ? <CatalogSheetDialog key={apiBase} apiBase={apiBase} categories={categories} selected={tool.selected} permissions={permissions} onClose={() => setTool(null)} onImported={(result) => { setTool(null); refreshSelection(); setNotice(text(`تم استيراد الملف: ${result.created} منتج جديد و${result.updated} منتج محدّث.`, `Sheet imported: ${result.created} new and ${result.updated} updated products.`)); }} /> : null}
        {bulkOpen ? <CatalogBulkEditDialog key={apiBase} apiBase={apiBase} products={selectedRows} categories={categories} onClose={() => setBulkOpen(false)} onRefresh={refreshSelection} onSaved={(count) => { refreshSelection(); setNotice(text(`تم تعديل ${count} منتج.`, `${count} products updated.`)); }} /> : null}
        {guide ? <Dialog open onClose={() => setGuide('')} className="ws-dialog-layer"><DialogBackdrop transition className="ws-backdrop" /><div className="ws-confirm-position"><DialogPanel transition className="ws-confirm-dialog ws-product-guide"><DialogTitle>{guide === 'simple' ? text('إنشاء منتج بسيط', 'Create a simple product') : text('إنشاء منتج متعدد الخواص', 'Create a product with options')}</DialogTitle><ol><li>{text('أضف اسم المنتج ووصفًا واضحًا وصورًا مناسبة.', 'Add the product name, a clear description and suitable images.')}</li><li>{text('حدد السعر وسعر المقارنة والتصنيفات وحالة النشر.', 'Set the price, comparison price, categories and publication status.')}</li>{guide === 'options' ? <li>{text('احفظ المنتج ثم افتح قسم الخيارات لإضافة المقاسات والألوان، وتوليد التركيبات، وتحديد سعر ومخزون كل خيار.', 'Save the product, then open Options to add sizes and colors, generate combinations and set each option’s price and stock.')}</li> : <li>{text('احفظ المنتج ثم حدّد المخزون من قسم المخزون.', 'Save the product, then set inventory in the Stock section.')}</li>}<li>{text('راجع المعاينة وإعدادات محركات البحث والتخصيص قبل نشر المنتج.', 'Review the preview, SEO and personalization settings before publishing.')}</li></ol><div className="ws-confirm-actions"><button type="button" className="ws-secondary-button" onClick={() => setGuide('')}>{text('إغلاق', 'Close')}</button>{permissions.includes('products-create') ? <Link className="ws-primary-button" to={`${uiBase}/products/new`}>{text('إضافة منتج', 'Add product')}</Link> : null}</div></DialogPanel></div></Dialog> : null}
        {confirm ? <Dialog open onClose={() => { if (!busy) { setConfirm(null); setActionError(''); } }} className="ws-dialog-layer"><DialogBackdrop transition className="ws-backdrop" /><div className="ws-confirm-position"><DialogPanel transition className="ws-confirm-dialog"><DialogTitle>{confirm.kind === 'delete' ? text('حذف المنتجات المحددة', 'Delete selected products') : text('استنساخ المنتج', 'Duplicate product')}</DialogTitle><p>{confirm.kind === 'delete' ? text(`سيتم حذف ${confirm.targets.length} منتج نهائيًا. لا يمكن التراجع عن هذه العملية، ولن تُحذف المنتجات ذات الحجوزات المفتوحة.`, `${confirm.targets.length} products will be permanently deleted. This cannot be undone; products with open reservations cannot be deleted.`) : text('سيتم إنشاء نسخة مسودة بالصور والوصف والخيارات، دون مخزون أو حجوزات. راجع بياناتها قبل النشر.', 'Create a draft with images, description and options, with no inventory or reservations. Review it before publishing.')}</p>{actionError ? <p role="alert" className="ws-catalog-error">{actionError}</p> : null}<div className="ws-confirm-actions"><button type="button" className="ws-secondary-button" disabled={busy} onClick={() => { setConfirm(null); setActionError(''); }}>{text('إلغاء', 'Cancel')}</button><button type="button" className={confirm.kind === 'delete' ? 'ws-danger-button' : 'ws-primary-button'} disabled={busy} onClick={() => void applyAction()}>{busy ? text('جارٍ التنفيذ…', 'Processing…') : confirm.kind === 'delete' ? text('حذف نهائي', 'Delete permanently') : text('إنشاء نسخة', 'Create copy')}</button></div></DialogPanel></div></Dialog> : null}
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('ابحث بالاسم أو SKU', 'Search by name or SKU')} exportDisabled={!rows.length}
                onExport={() => downloadCsv(`products-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, selectedRows.length ? selectedRows : rows)} />
            <IndexTable table={table} rows={rows} loading={loading} error={error} onRetry={reload} meta={meta}
                label={text('المنتجات', 'Products')} bulkActions={bulkActions} maxSelection={200} rowHref={(p) => `${uiBase}/products/${p.id}/edit`}
                emptyState={{ icon: HiOutlineCube, title: text('أضف أول منتج لمتجرك', 'Add your first product'), description: text('ابدأ بإضافة منتج أو استيراد كتالوج كامل من ملف Excel.', 'Start by adding a product or importing a full catalog from Excel.'),
                    action: permissions.includes('products-create') ? <Link className="ws-dt-button ws-dt-button-primary" to={`${uiBase}/products/new`}>{text('إضافة منتج', 'Add product')}</Link> : null }} />
        </div>
    </section>;
}
