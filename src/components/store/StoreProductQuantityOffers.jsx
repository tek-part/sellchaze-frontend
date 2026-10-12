import { useEffect, useState } from 'react';
import api from '../../api/client';

const input = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50';
const button = 'rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40';

export default function StoreProductQuantityOffers(props) {
    return <OfferEditor key={props.path} {...props} />;
}

function OfferEditor({ path, productPrice, currency, ar, canEdit }) {
    const text = (a, e) => ar ? a : e;
    const [offers, setOffers] = useState([]); const [version, setVersion] = useState(null);
    const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const [reload, setReload] = useState(0);
    const endpoint = `${path}/quantity-offers`;
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(endpoint).then(({ data }) => { if (active) { setOffers(data.data); setVersion(data.version); setSaved(false); } })
            .catch(() => { if (active) setError('load'); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [endpoint, reload]);
    const changed = (id, field, value) => { setSaved(false); setOffers((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row)); };
    const copy = (id, field, locale, value) => { setSaved(false); setOffers((rows) => rows.map((row) => row.id === id ? { ...row, [field]: { ...row[field], [locale]: value } } : row)); };
    const add = () => {
        const quantities = new Set(offers.map((row) => Number(row.quantity))); let quantity = 1; while (quantities.has(quantity)) quantity++;
        setOffers((rows) => [...rows, { id: crypto.randomUUID(), quantity, unit_price: productPrice, enabled: true, free_shipping: false, title: { ar: '', en: '' }, subtitle: { ar: '', en: '' } }]); setSaved(false);
    };
    const valid = offers.length <= 10 && new Set(offers.map((row) => Number(row.quantity))).size === offers.length && offers.every((row) => Number.isInteger(Number(row.quantity)) && Number(row.quantity) >= 1 && Number(row.quantity) <= 999 && /^\d+(?:\.\d{1,2})?$/.test(String(row.unit_price)) && Number(row.unit_price) <= Number(productPrice));
    async function save(event) {
        event.preventDefault(); if (!canEdit || busy || !valid || !version) return;
        setBusy(true); setError(''); setSaved(false);
        try { const { data } = await api.put(endpoint, { version, offers: offers.map((row) => ({ ...row, quantity: Number(row.quantity) })) }); setOffers(data.data); setVersion(data.version); setSaved(true); }
        catch (e) { setError(e.response?.status === 409 ? 'changed' : 'save'); }
        finally { setBusy(false); }
    }
    return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5" aria-label={text('عروض الكمية', 'Quantity offers')}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">{text('عروض الكمية', 'Quantity offers')} · {currency}</h2><button type="button" className={button} disabled={busy || loading} onClick={() => setReload((value) => value + 1)}>{text('إعادة تحميل العروض', 'Reload offers')}</button></div>
        <p className="text-sm text-slate-500">{text('حدد عدد القطع وسعر القطعة لكل عرض. يظهر العرض في صفحة المنتج، وتحتفظ السلة بالحزم كاملة.', 'Set the number of pieces and price per piece for each offer. Offers appear on the product page, and the cart keeps complete packages.')}</p>
        <p className="text-sm text-slate-500">{text('سعر العرض ثابت لكل الخيارات المتاحة؛ لن يُستخدم مع خيار سعره الأصلي أقل من سعر العرض. خيار الشحن المجاني يشمل الطلب عند اختيار العرض.', 'The offer price applies to eligible product options; options with a lower regular price cannot use it. Free shipping covers the order when this offer is selected.')}</p>
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error === 'load' ? text('تعذر تحميل العروض. أعد المحاولة.', 'Could not load offers. Try again.') : error === 'changed' ? text('تغيّرت العروض. أعد تحميلها ثم احفظ تعديلك.', 'Offers changed. Reload them before saving your changes.') : text('تعذر حفظ العروض. راجع الكميات والأسعار وحاول مرة أخرى.', 'Could not save offers. Check quantities and prices, then try again.')}</p> : null}
        {saved ? <p role="status" className="text-sm text-emerald-700">{text('تم حفظ عروض الكمية.', 'Quantity offers saved.')}</p> : null}
        {loading ? <p role="status">{text('جارٍ تحميل العروض…', 'Loading offers…')}</p> : <form onSubmit={save}>
            <fieldset disabled={!canEdit || busy || !version} className="space-y-4">
                {!offers.length ? <p className="rounded-lg bg-slate-50 p-4 text-sm">{text('لا توجد عروض لهذا المنتج. يُباع بالسعر العادي.', 'This product has no quantity offers. Its regular price applies.')}</p> : null}
                {offers.map((row, index) => <div key={row.id} className="space-y-4 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{text(`العرض ${index + 1}`, `Offer ${index + 1}`)}</h3><button type="button" className={button} aria-label={text(`إزالة العرض ${index + 1}`, `Remove offer ${index + 1}`)} onClick={() => { setOffers((rows) => rows.filter((item) => item.id !== row.id)); setSaved(false); }}>{text('إزالة', 'Remove')}</button></div>
                    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">{text(`عدد القطع في العرض ${index + 1}`, `Pieces in offer ${index + 1}`)}<input className={input} type="number" required min="1" max="999" step="1" value={row.quantity} onChange={(e) => changed(row.id, 'quantity', e.target.value)} /></label><label className="text-sm">{text(`سعر القطعة في العرض ${index + 1}`, `Unit price in offer ${index + 1}`)}<input className={input} type="number" required min="0" max={productPrice} step="0.01" value={row.unit_price} onChange={(e) => changed(row.id, 'unit_price', e.target.value)} /></label></div>
                    <div className="flex flex-wrap gap-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={row.enabled} onChange={(e) => changed(row.id, 'enabled', e.target.checked)} />{text('تفعيل العرض', 'Enable offer')}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={row.free_shipping} onChange={(e) => changed(row.id, 'free_shipping', e.target.checked)} />{text('شحن الطلب مجانًا مع العرض', 'Free order shipping with this offer')}</label></div>
                    <details><summary className="cursor-pointer text-sm font-semibold">{text('نصوص العرض بالعربية والإنجليزية', 'Arabic and English offer copy')}</summary><div className="mt-3 grid gap-4 sm:grid-cols-2">{['ar', 'en'].map((locale) => <div key={locale} className="space-y-3" dir={locale === 'ar' ? 'rtl' : 'ltr'}><label className="block text-sm">{text(`عنوان العرض ${index + 1} (${locale})`, `Offer ${index + 1} title (${locale})`)}<input className={input} maxLength={160} value={row.title?.[locale] || ''} onChange={(e) => copy(row.id, 'title', locale, e.target.value)} /></label><label className="block text-sm">{text(`وصف العرض ${index + 1} (${locale})`, `Offer ${index + 1} description (${locale})`)}<input className={input} maxLength={300} value={row.subtitle?.[locale] || ''} onChange={(e) => copy(row.id, 'subtitle', locale, e.target.value)} /></label></div>)}</div></details>
                </div>)}
                <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={offers.length >= 10} onClick={add}>{text('إضافة عرض كمية', 'Add quantity offer')}</button><button type="submit" className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={!valid}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ عروض الكمية', 'Save quantity offers')}</button></div>
                {!valid ? <p className="text-sm text-amber-700">{text('استخدم كميات مختلفة من 1 إلى 999، وسعرًا لا يزيد عن سعر المنتج وبحد أقصى منزلتين عشريتين.', 'Use distinct quantities from 1 to999 and prices no higher than the product price, with at most two decimal places.')}</p> : null}
            </fieldset>
        </form>}
    </section>;
}
