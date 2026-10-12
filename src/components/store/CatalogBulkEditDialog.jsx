import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

export default function CatalogBulkEditDialog({ apiBase, products, categories, onClose, onSaved, onRefresh }) {
    const { i18n } = useTranslation();
    const text = (a, e) => i18n.language.startsWith('ar') ? a : e;
    const [price, setPrice] = useState('');
    const [status, setStatus] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [stale, setStale] = useState(false);
    const changed = price !== '' || status !== '' || categoryId !== '';
    const submit = async (event) => {
        event.preventDefault();
        if (!changed || busy || stale) return;
        setBusy(true); setError('');
        const changes = {};
        if (price !== '') changes.price = price;
        if (status !== '') changes.is_active = status === 'active';
        if (categoryId !== '') changes.category_id = categoryId === 'none' ? null : Number(categoryId);
        try {
            const { data } = await api.put(`${apiBase}/catalog/products/bulk`, {
                products: products.map((product) => ({ id: product.id, version: product.edit_version })), changes,
            });
            onSaved(data.meta.updated);
        } catch (e) {
            if (e.response?.status === 422 && e.response.data?.errors?.products) {
                setStale(true);
                setError(text('تغيّر أحد المنتجات المحددة أو لم يعد متاحًا. لم يُحفظ أي تعديل. حدّث القائمة وراجع اختيارك.', 'A selected product changed or is unavailable. No edits were saved. Refresh the list and review your selection.'));
            } else {
                setError(e.response?.data?.message || text('تعذر حفظ التعديل. حاول مرة أخرى.', 'Your changes could not be saved. Please try again.'));
            }
        } finally { setBusy(false); }
    };
    return <Dialog open onClose={() => { if (!busy) onClose(); }} className="ws-dialog-layer">
        <DialogBackdrop transition className="ws-backdrop" />
        <div className="ws-confirm-position"><DialogPanel transition className="ws-confirm-dialog ws-catalog-bulk-dialog">
            <DialogTitle>{text('تعديل المنتجات المحددة', 'Edit selected products')}</DialogTitle>
            <p>{products.length} {text('منتج محدد. تُطبق القيم التي تغيّرها على جميع المنتجات المحددة.', 'selected products. Changed values apply to every selected product.')}</p>
            <form onSubmit={(event) => void submit(event)} aria-busy={busy}>
                <fieldset disabled={busy || stale} className="ws-catalog-bulk-fields">
                    <label>{text('السعر الأساسي', 'Base price')}<input type="number" step="0.01" min="0" max="999999999.99" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={text('دون تغيير', 'Keep unchanged')} /></label>
                    <label>{text('حالة النشر', 'Publication status')}<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{text('دون تغيير', 'Keep unchanged')}</option><option value="active">{text('منشور', 'Published')}</option><option value="draft">{text('مسودة', 'Draft')}</option></select></label>
                    {categories.length > 0 ? <label>{text('القسم', 'Category')}<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">{text('دون تغيير', 'Keep unchanged')}</option><option value="none">{text('دون قسم', 'No category')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label> : null}
                </fieldset>
                <p className="ws-note">{text('أسعار الخيارات والمخزون والحجوزات تبقى كما هي.', 'Option prices, inventory and reservations stay as they are.')}</p>
                {error ? <p role="alert" className="ws-catalog-error">{error}</p> : null}
                <div className="ws-confirm-actions"><button type="button" disabled={busy} className="ws-secondary-button" onClick={onClose}>{text('إلغاء', 'Cancel')}</button>{stale ? <button type="button" className="ws-primary-button" onClick={onRefresh}>{text('تحديث القائمة', 'Refresh list')}</button> : <button type="submit" disabled={busy || !changed} className="ws-primary-button">{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ التعديل', 'Save changes')}</button>}</div>
            </form>
        </DialogPanel></div>
    </Dialog>;
}
