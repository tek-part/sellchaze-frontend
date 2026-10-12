import { useEffect, useId, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import useStoreContext from '../../hooks/useStoreContext';
import { buildReferralUrl } from '../../shared/marketing/referral';
import './merchant-catalog.css';
import './campaign-builder.css';
import './referral-builder.css';

function ArrowIcon() { return <svg aria-hidden viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" /></svg>; }
function ClearIcon() { return <svg aria-hidden viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>; }
function CreateIcon() { return <svg aria-hidden viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3m3-10H5V5h10z" /></svg>; }

export default function StoreReferralBuilderPage() {
    const context = useStoreContext();
    return <ReferralBuilder key={context.apiBase} context={context} />;
}
function ReferralBuilder({ context: { apiBase, uiBase, access } }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const listId = useId(); const input = useRef(null);
    const [query, setQuery] = useState(''); const [product, setProduct] = useState(null); const [code, setCode] = useState('');
    const [open, setOpen] = useState(false); const [options, setOptions] = useState([]); const [origin, setOrigin] = useState('');
    const [page, setPage] = useState(1); const [lastPage, setLastPage] = useState(1); const [active, setActive] = useState(-1);
    const [loading, setLoading] = useState(false); const [loadError, setLoadError] = useState(''); const [retry, setRetry] = useState(0);
    const [result, setResult] = useState(''); const [copied, setCopied] = useState(false); const [copyError, setCopyError] = useState('');
    const resetResult = () => { setResult(''); setCopied(false); setCopyError(''); };
    useEffect(() => {
        if (!open || !access.canStoreSettings) return undefined;
        const controller = new AbortController(); let current = true;
        setLoading(true); setLoadError(''); setOptions([]); setActive(-1);
        const timer = window.setTimeout(async () => {
            try {
                const { data } = await api.get(`${apiBase}/referral-products`, { params: { q: product ? '' : query, page }, signal: controller.signal });
                if (!current) return;
                setOptions(data.data); setOrigin(data.storefront_url || ''); setLastPage(data.meta.last_page);
            } catch (failure) { if (current && !controller.signal.aborted) setLoadError(failure.response?.data?.message || failure.message); }
            finally { if (current) setLoading(false); }
        }, 200);
        return () => { current = false; window.clearTimeout(timer); controller.abort(); };
    }, [open, apiBase, query, product, page, retry, access.canStoreSettings]);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const generated = product ? buildReferralUrl(origin, product.id, code) : undefined;
    const selectProduct = (row) => { setProduct(row); setQuery(row.name); setOpen(false); setPage(1); resetResult(); input.current?.focus(); };
    return <div className="ws-utm-builder ws-referral-builder" dir={ar ? 'rtl' : 'ltr'}><header className="ws-catalog-header"><div><h1>{text('إنشاء روابط الإحالة', 'Create referral links')}</h1><p>{text('قم بإنشاء روابط إحالة مخصصة لمنتجاتك لتتبع المبيعات والعمولات', 'Create product referral links to track sales and commissions')}</p></div></header>
        <form className="ws-referral-form" onSubmit={(event) => { event.preventDefault(); if (generated) { setResult(generated); setCopied(false); setCopyError(''); } }}>
            <div className="ws-referral-group ws-referral-product"><div className={`ws-campaign-field ws-referral-combobox ${product || query ? 'has-value' : ''}`}><span aria-hidden>{text('اختر المنتج', 'Choose product')} *</span><input ref={input} role="combobox" aria-label={text('اختر المنتج', 'Choose product')} aria-required="true" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined} value={query} onFocus={() => setOpen(true)} onBlur={(event) => { if (!event.currentTarget.parentElement.parentElement.contains(event.relatedTarget)) setOpen(false); }} onChange={(event) => { setQuery(event.target.value); setProduct(null); setPage(1); setOpen(true); resetResult(); }} onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive((old) => options.length ? old < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1) : (old + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length : -1); }
                else if (event.key === 'Enter' && open && options[active]) { event.preventDefault(); selectProduct(options[active]); }
                else if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
            }} />{product || query ? <button type="button" className="ws-referral-clear" aria-label={text('إفراغ المدخلات', 'Clear product')} onMouseDown={(event) => event.preventDefault()} onClick={() => { setProduct(null); setQuery(''); setPage(1); resetResult(); input.current?.focus(); }}><ClearIcon /></button> : null}<button type="button" className="ws-referral-open" aria-label={open ? text('اغلاق', 'Close products') : text('فتح المنتجات', 'Open products')} onMouseDown={(event) => event.preventDefault()} onClick={() => setOpen((old) => !old)}><ArrowIcon /></button></div><p className="ws-campaign-note" aria-hidden>{'​'}</p>
                {open ? <div className="ws-referral-options" id={listId} role="listbox" aria-label={text('اختر المنتج', 'Choose product')}>{loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : loadError ? <div role="alert"><p>{loadError}</p><button type="button" onClick={() => setRetry((old) => old + 1)}>{text('إعادة المحاولة', 'Try again')}</button></div> : <>{options.length ? options.map((row, index) => <button key={row.id} id={`${listId}-${index}`} type="button" role="option" aria-selected={product?.id === row.id} data-active={active === index || undefined} onMouseDown={(event) => event.preventDefault()} onClick={() => selectProduct(row)}>{row.name}</button>) : <p>{text('لا توجد منتجات', 'No products')}</p>}{lastPage > 1 ? <div className="ws-referral-pagination"><button type="button" disabled={page <= 1} onClick={() => setPage((old) => old - 1)}>{text('السابق', 'Previous')}</button><span>{page}/{lastPage}</span><button type="button" disabled={page >= lastPage} onClick={() => setPage((old) => old + 1)}>{text('التالي', 'Next')}</button></div> : null}</>}</div> : null}
            </div>
            <div className="ws-referral-group"><label className={`ws-campaign-field ${code ? 'has-value' : ''}`}><span>{text('كود الإحالة', 'Referral code')} *</span><input aria-label={text('كود الإحالة', 'Referral code')} required maxLength={100} value={code} onChange={(event) => { setCode(event.target.value); resetResult(); }} /></label><p className="ws-campaign-note">{text('أدخل كود الإحالة الخاص بالمسوق (مثل: ref1, affiliate_1)', 'Enter the marketer referral code (e.g. ref1, affiliate_1)')}</p></div>
            <button type="submit" className="ws-referral-create" disabled={!generated}><CreateIcon />{text('إنشاء الرابط', 'Create link')}</button>
            {code && !buildReferralUrl(origin || 'https://example.com', product?.id || 1, code) ? <p role="alert">{text('استخدم الحروف أو الأرقام أو _ أو - أو . للكود.', 'Use letters, numbers, _, - or . in the code.')}</p> : null}
            <div className="ws-campaign-result">{result ? <button type="button" dir="ltr" aria-label={text('نسخ رابط الإحالة', 'Copy referral link')} onClick={async () => { try { await navigator.clipboard.writeText(result); setCopied(true); setCopyError(''); } catch { setCopyError(text('تعذر النسخ. حدد الرابط وانسخه يدويًا.', 'Copy failed. Select and copy the link manually.')); } }}>{result}</button> : null}</div>{copied ? <p role="status">{text('تم نسخ الرابط', 'Link copied')}</p> : null}{copyError ? <p role="alert">{copyError}</p> : null}
        </form>
    </div>;
}
