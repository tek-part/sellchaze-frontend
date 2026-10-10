import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Toggle from '../components/ui/Toggle';
import ProductRichText from '../components/store/ProductRichText';
import useStoreContext from '../hooks/useStoreContext';
import { useDirty } from '../hooks/useStoreSettings';
import { sanitizeHtml } from '../shared/utils/sanitizeHtml';
import '../apps/storefront/ui-blocks/ui-blocks.css';

const positions = [
    ['before_header', 'أعلى الهيدر', 'Above the header'], ['after_header', 'أسفل الهيدر', 'Below the header'],
    ['before_product_gallery', 'أعلى معرض المنتج', 'Above the product gallery'], ['after_product_gallery', 'أسفل معرض المنتج', 'Below the product gallery'],
    ['before_checkout', 'أعلى نموذج الشراء', 'Above the checkout form'], ['after_checkout', 'أسفل نموذج الشراء', 'Below the checkout form'],
    ['before_footer', 'أعلى الفوتر', 'Above the footer'], ['after_footer', 'أسفل الفوتر', 'Below the footer'],
];
const field = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900';
const message = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

export default function StoreUiBlocksPage() {
    const context = useStoreContext();
    if (!context.access?.canStorePages) return <Navigate to={`${context.uiBase}/overview`} replace />;
    return <Editor key={context.apiBase} apiBase={context.apiBase} />;
}

function Editor({ apiBase }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [locale, setLocale] = useState(ar ? 'ar' : 'en');
    const [settings, setSettings] = useState(null); const [initial, setInitial] = useState(null);
    const [attempt, setAttempt] = useState(0); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false); const [conflict, setConflict] = useState(false); const working = useRef(false);
    const dirty = useDirty(initial, settings);
    useEffect(() => {
        let active = true;
        api.get(`${apiBase}/ui-blocks`).then(({ data }) => { if (active) { setSettings(data.data); setInitial(data.data); setConflict(false); } })
            .catch((e) => { if (active) setError(message(e)); });
        return () => { active = false; };
    }, [apiBase, attempt]);
    const update = (next) => { setSettings(next); setError(''); setSaved(false); };
    const updateBlock = (slot, next) => update({ ...settings, blocks: { ...settings.blocks, [slot]: { ...settings.blocks[slot], ...next } } });
    async function save(event) {
        event.preventDefault(); if (working.current || conflict || !dirty) return;
        working.current = true; setBusy(true); setError(''); setSaved(false);
        try { const { data } = await api.put(`${apiBase}/ui-blocks`, settings); setSettings(data.data); setInitial(data.data); setSaved(true); }
        catch (e) { setError(message(e)); if (e.response?.status === 409) setConflict(true); }
        finally { working.current = false; setBusy(false); }
    }
    const reload = () => { setSettings(null); setError(''); setSaved(false); setAttempt((n) => n + 1); };
    return <div className="space-y-5">
        <PageHeader title={text('بلوكات واجهة المتجر', 'Store UI blocks')} subtitle={text('أضف محتوى مخصصًا حول أجزاء المتجر. يُحفظ لكل موضع نص بالعربية والإنجليزية.', 'Add custom content around your storefront. Each position keeps Arabic and English content.')} />
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p> : null}
        {conflict ? <p role="alert">{text('تغيّرت إعدادات البلوكات. حمّل النسخة الحالية قبل الحفظ؛ سيستبدل ذلك تعديلات المسودة المفتوحة.', 'Block settings changed. Reload before saving; this replaces the open draft edits.')}</p> : null}
        {conflict || (!settings && error) ? <button type="button" disabled={busy} className={field} onClick={reload}>{text('تحميل النسخة الحالية', 'Reload current version')}</button> : null}
        {!settings ? (!error ? <p role="status">{text('جارٍ تحميل البلوكات…', 'Loading blocks…')}</p> : null) : <form onSubmit={save} className="space-y-5">
            {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{text('تم حفظ البلوكات.', 'Blocks saved.')}</p> : null}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <Toggle checked={settings.enabled} disabled={busy} onChange={(enabled) => update({ ...settings, enabled })} label={text('تفعيل البلوكات', 'Enable blocks')} />
                <label>{text('لغة المحتوى والمعاينة', 'Content and preview language')}<select className={field} value={locale} disabled={busy} onChange={(e) => setLocale(e.target.value)}><option value="ar">العربية</option><option value="en">English</option></select></label>
                <p className="w-full text-sm text-slate-500 dark:text-slate-300">{text('التعطيل يخفي جميع البلوكات ويحفظ محتواها. البلوكات الفارغة لا تضيف مساحة للمتجر.', 'Disabling hides all blocks and keeps their content. Empty blocks add no space to the store.')}</p>
            </div>
            {positions.map(([slot, arabic, english]) => { const block = settings.blocks[slot]; const label = text(arabic, english); return <section key={slot} aria-label={label} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="font-semibold">{label}</h2>
                <Toggle checked={block.editor === 'html'} disabled={busy} onChange={(html) => updateBlock(slot, { editor: html ? 'html' : 'rich' })} label={text('تفعيل محرر HTML', 'Use HTML editor')} />
                {block.editor === 'html' ? <label className="block">{text('مصدر HTML', 'HTML source')}<textarea className={`${field} font-mono text-sm`} dir="ltr" rows={8} maxLength={20000} disabled={busy} value={block.content[locale]} onChange={(e) => updateBlock(slot, { content: { ...block.content, [locale]: e.target.value } })} /></label> : <ProductRichText key={`${slot}-${locale}`} pageContent ar={ar} label={label} value={block.content[locale]} disabled={busy} onChange={(html) => updateBlock(slot, { content: { ...block.content, [locale]: html } })} />}
                <details><summary className="cursor-pointer text-sm">{text('معاينة هذا البلوك', 'Preview this block')}</summary><div className="sf-ui-block sf-prose mt-3" dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content[locale], { formatting: true }) }} /></details>
            </section>; })}
            <p className="text-sm text-slate-500 dark:text-slate-300">{text('يُقبل المحتوى المنسق وروابط الصور والفيديو المباشرة. تُزال السكربتات والتنسيقات غير المدعومة عند الحفظ.', 'Formatted content and direct image/video URLs are supported. Scripts and unsupported formatting are removed on save.')}</p>
            <button type="submit" disabled={busy || conflict || !dirty} className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white disabled:opacity-40">{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ البلوكات', 'Save blocks')}</button>
        </form>}
    </div>;
}
