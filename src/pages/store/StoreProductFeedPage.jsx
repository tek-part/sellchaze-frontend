import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import useStoreContext from '../../hooks/useStoreContext';
import { HiOutlinePlayCircle } from '../../components/workspace/WorkspaceIcons';
import './merchant-catalog.css';

export const FEED_CHANNELS = [{ id: 'google', label: 'Google' }, { id: 'meta', label: 'Meta' }, { id: 'snapchat', label: 'Snapchat' }, { id: 'tiktok', label: 'TikTok' }];
export function feedError(error) { return Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message; }
export async function downloadProductFeed(apiBase, channel) {
    const [{ data }, response] = await Promise.all([api.get(`${apiBase}/product-feed`, { params: { channel } }), api.get(`${apiBase}/product-feed/download`, { params: { channel }, responseType: 'blob' })]);
    const url = URL.createObjectURL(response.data); const link = document.createElement('a');
    link.href = url; link.download = `products-${channel}.${channel === 'google' ? 'tsv' : 'csv'}`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return data.data;
}
export function FeedResult({ result, ar }) {
    const [copied, setCopied] = useState(false);
    return <div className="ws-feed-result"><p role="status">{ar ? 'تم إنشاء ملف المنتجات. استخدم الرابط التالي للتحديث التلقائي في منصة الإعلانات.' : 'Product feed created. Use this URL for scheduled updates in your advertising platform.'}</p><div><input aria-label={ar ? 'رابط ملف المنتجات' : 'Product feed URL'} value={result.url || ''} readOnly dir="ltr" /><button type="button" className="ws-secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(result.url); setCopied(true); } catch { setCopied(false); } }}>{copied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ الرابط' : 'Copy URL')}</button></div><p className="ws-note">{ar ? 'يشمل الملف المنتجات المتاحة للنشر والصور والصيغ المدعومة. أكمل الوصف والصورة والعلامة التجارية أو الباركود الصحيح ليظهر المنتج في جميع القنوات.' : 'Feeds include public products with supported images and formats. Complete product descriptions, images and brand or valid GTIN for all channels.'}</p></div>;
}
export default function StoreProductFeedPage() {
    const context = useStoreContext();
    return <FeedEditor key={context.apiBase} context={context} />;
}
function FeedEditor({ context: { apiBase, uiBase, access } }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar');
    const [channel, setChannel] = useState('meta'); const [busy, setBusy] = useState(false); const [result, setResult] = useState(null); const [error, setError] = useState(''); const working = useRef(false);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    return <div className="ws-product-feed" dir={ar ? 'rtl' : 'ltr'}><header className="ws-catalog-header"><div><h1>Product Feed</h1><p>{ar ? 'يمكنك تصدير المنتجات الي منصات التسويق الاجتماعي بسهولة' : 'Export your products to social advertising platforms'}</p></div><a href="https://support.google.com/merchants/answer/12631822" target="_blank" rel="noopener noreferrer"><HiOutlinePlayCircle aria-hidden />{ar ? 'انشاء Product Feed' : 'Create a Product Feed'}</a></header>
        <form className="ws-product-feed-form" onSubmit={async (event) => { event.preventDefault(); if (working.current) return; working.current = true; setBusy(true); setError(''); setResult(null); try { setResult(await downloadProductFeed(apiBase, channel)); } catch (failure) { setError(feedError(failure)); } finally { working.current = false; setBusy(false); } }}><label className="ws-feed-channel"><span>Channel</span><select aria-label="Channel" value={channel} disabled={busy} onChange={(event) => { setChannel(event.target.value); setResult(null); }}>{FEED_CHANNELS.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select></label><button className="ws-feed-create" type="submit" disabled={busy}>{busy ? (ar ? 'جارٍ التصدير…' : 'Exporting…') : (ar ? 'انشاء Product Feed' : 'Create Product Feed')}</button></form>
        {error ? <p className="ws-catalog-error" role="alert">{error}</p> : null}{result ? <FeedResult key={result.channel} result={result} ar={ar} /> : null}
    </div>;
}
