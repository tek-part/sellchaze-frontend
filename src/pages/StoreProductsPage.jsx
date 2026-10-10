import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { useDebounced } from '../hooks/useDebounced';

export default function StoreProductsPage() {
    const { apiBase, uiBase } = useStoreScope();
    const { permissions = [], store } = useOutletContext();
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [query, setQuery] = useState('');
    const search = useDebounced(query, 300);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(`${apiBase}/catalog/products`, { params: { search, status, page, per_page: 20 } })
            .then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setError(e.response?.data?.message || e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, search, status, page, reload]);
    const money = (value) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: store?.currency || 'EGP' }).format(Number(value));
    return <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{text('منتجات المتجر', 'Store products')}</h1><p className="mt-1 text-sm text-slate-500">{text('الأسعار والصور وخيارات الشراء التي تظهر لعملائك.', 'Prices, images and buying options shown to your customers.')}</p></div>{permissions.includes('products-create') ? <Link className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white" to={`${uiBase}/products/new`}>{text('إضافة منتج', 'Add product')}</Link> : null}</header>
        <div className="flex flex-wrap gap-3"><input className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2" aria-label={text('بحث المنتجات', 'Search products')} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={text('ابحث بالاسم أو الرابط', 'Search name or slug')} /><select className="rounded-lg border border-slate-200 bg-white px-3 py-2" aria-label={text('حالة النشر', 'Publication status')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">{text('كل المنتجات', 'All products')}</option><option value="active">{text('منشور', 'Published')}</option><option value="draft">{text('مسودة', 'Draft')}</option></select></div>
        {error ? <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}<button className="ms-3 underline" onClick={() => setReload(reload + 1)}>{text('إعادة المحاولة', 'Retry')}</button></div> : null}
        {loading ? <p role="status">{text('جارٍ تحميل المنتجات…', 'Loading products…')}</p> : !error ? <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{[text('المنتج', 'Product'), text('السعر', 'Price'), text('الخيارات / المخزون', 'Options / stock'), text('الحالة', 'Status'), ''].map((title, index) => <th className="p-4 text-start" key={index}>{title}</th>)}</tr></thead><tbody>{result?.data.map((product) => <tr className="border-t border-slate-100" key={product.id}><td className="p-4"><div className="flex min-w-48 items-center gap-3">{product.image_url ? <img className="h-12 w-12 rounded-lg object-cover" src={product.image_url} alt="" /> : <span className="h-12 w-12 rounded-lg bg-slate-100" />}<div><b>{product.name}</b><p className="text-xs text-slate-500">{product.sku || product.slug}</p></div></div></td><td className="whitespace-nowrap p-4">{money(product.price)}</td><td className="p-4">{product.variants?.length ? `${product.variants.length} ${text('خيارات', 'options')}` : product.track_inventory ? `${product.stock} ${text('متاح', 'available')}` : text('دون تتبع', 'Untracked')}</td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{product.is_active ? text('منشور', 'Published') : text('مسودة', 'Draft')}</span></td><td className="p-4"><Link className="font-semibold text-emerald-700 underline" to={`${uiBase}/products/${product.id}/edit`}>{permissions.includes('products-edit') ? text('تعديل', 'Edit') : text('عرض', 'View')}</Link></td></tr>)}</tbody></table>{!result?.data.length ? <p className="p-8 text-center text-slate-500">{text('لا توجد منتجات مطابقة.', 'No matching products.')}</p> : null}</div> : null}
        {result?.meta ? <div className="flex items-center justify-between"><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>{text('السابق', 'Previous')}</button><span>{result.meta.current_page} / {result.meta.last_page} · {result.meta.total} {text('منتج', 'products')}</span><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={loading || page >= result.meta.last_page} onClick={() => setPage(page + 1)}>{text('التالي', 'Next')}</button></div> : null}
    </div>;
}
