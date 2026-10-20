import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import Heading01Icon from '@hugeicons/core-free-icons/Heading01Icon';
import api from '../../api/client';
import { productAiParts } from '../../lib/product-ai-draft';
import { HiOutlineSparkles, HiOutlineXMark, HiOutlineDocumentText, HiOutlineRocketLaunch, HiOutlineQuestionMarkCircle, HiOutlineChatBubbleBottomCenterText } from '../workspace/WorkspaceIcons';
import './product-ai-dialog.css';

const ProductNameIcon = props => <HugeiconsIcon icon={Heading01Icon} size={24} strokeWidth={1.5} {...props} />;
const icons = [ProductNameIcon, HiOutlineDocumentText, HiOutlineRocketLaunch, HiOutlineQuestionMarkCircle, HiOutlineChatBubbleBottomCenterText];
const titles = { name: ['اسم المنتج', 'Product name'], description: ['وصف المنتج', 'Product description'], features: ['المميزات', 'Features'], faqs: ['الأسئلة الشائعة', 'FAQs'], reviews: ['المراجعات', 'Reviews'] };
const plain = html => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function ProductAiDialog({ path, ar, locale: initialLocale, locales, initialDescription, onApply, onClose }) {
    const text = (a, e) => ar ? a : e;
    const [locale, setLocale] = useState(initialLocale);
    const [parts, setParts] = useState([...productAiParts]);
    const [counts, setCounts] = useState({ features: 3, faqs: 3, reviews: 3 });
    const [brief, setBrief] = useState({ language: initialLocale === 'ar' ? 'العربية' : 'English', dialect: '', country: '', description: plain(initialDescription).slice(0, 6000), review_source: '' });
    const [available, setAvailable] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
    const [result, setResult] = useState(null); const request = useRef(null); const active = useRef(true); const inFlight = useRef(false);
    useEffect(() => {
        active.current = true; const controller = new AbortController();
        api.get(path, { signal: controller.signal }).then(({ data }) => { if (active.current) setAvailable(data.available === true); }).catch(() => { if (active.current && !controller.signal.aborted) { setAvailable(false); setError(ar ? 'تعذّر التحقق من خدمة التوليد. أغلق النافذة وحاول مجددًا.' : 'Could not check generation availability. Close this dialog and try again.'); } });
        return () => { active.current = false; controller.abort(); request.current?.abort(); };
    }, [path, ar]);
    const updateBrief = (key, value) => setBrief(current => ({ ...current, [key]: value }));
    const label = part => titles[part][ar ? 0 : 1];
    async function generate(event) {
        event.preventDefault(); if (inFlight.current || !available || !parts.length) return;
        inFlight.current = true; setBusy(true); setError(''); const controller = new AbortController(); request.current = controller;
        try {
            const { data } = await api.post(path, { ...brief, locale, parts, counts }, { signal: controller.signal, timeout: 75000 });
            if (!active.current || controller.signal.aborted) return;
            if (data.locale !== locale || !data.data || !Array.isArray(data.parts)) throw new Error('invalid_response');
            setResult({ copy: data.data, parts: data.parts, locale: data.locale });
        } catch (error) {
            if (!active.current || controller.signal.aborted) return;
            const status = error.response?.status;
            setError(status === 429 ? text('تم بلوغ حد التوليد أو يوجد طلب جارٍ لهذا المتجر. حاول لاحقًا.', 'The generation limit was reached or another request is running for this store. Try later.') : status === 503 ? text('خدمة إنشاء محتوى المنتج غير مفعّلة حاليًا. يمكنك متابعة التحرير يدويًا.', 'Product content generation is not configured yet. You can continue editing manually.') : status === 422 ? text('راجع الوصف والاختيارات. تعذّر إنشاء محتوى من هذه البيانات.', 'Check the brief and selected parts. Content could not be generated from these details.') : text('لم يكتمل إنشاء المحتوى. لم يتغيّر المنتج؛ يمكنك المحاولة مجددًا.', 'Content generation did not finish. Your product was not changed; you can try again.'));
        } finally { if (active.current && !controller.signal.aborted) { inFlight.current = false; setBusy(false); } }
    }
    function apply() {
        try { onApply(result); onClose(); }
        catch { setError(text('المحتوى يتجاوز الحد المسموح للوصف. قلّل النص قبل تطبيقه.', 'The content exceeds the description limit. Shorten it before applying.')); }
    }
    const editCopy = (key, value) => setResult(current => ({ ...current, copy: { ...current.copy, [key]: value } }));
    return <Dialog open onClose={onClose} dir={ar ? 'rtl' : 'ltr'} className="pe-ai-modal"><DialogBackdrop className="pe-ai-backdrop" /><div className="pe-ai-position"><DialogPanel className="pe-ai-dialog"><button type="button" className="pe-ai-close" onClick={onClose} aria-label={text('إغلاق', 'Close')}><HiOutlineXMark aria-hidden /></button>
        <div className="pe-ai-body">
            <div className="pe-ai-hero" aria-hidden="true"><span><HiOutlineSparkles /></span>{[12, 25, 38, 65, 78, 90].map((position, i) => <i key={position} style={{ insetInlineStart: `${position}%`, top: `${18 + i % 3 * 27}%` }}><HiOutlineSparkles /></i>)}</div>
            <DialogTitle className="pe-ai-title">{result ? text('مراجعة المحتوى المقترح', 'Review generated content') : text('إنشاء منتج بمساعدة الـ AI', 'Create a product with AI')}</DialogTitle>
            <p className="pe-ai-intro">{result ? text('راجع النص وعدّله ثم طبّقه على المسودة. يُحفظ فقط عند حفظ المنتج.', 'Review and edit the text, then apply it to your draft. It is saved only when you save the product.') : text('أنشئ اسم المنتج ووصفه ومميزاته والأسئلة الشائعة بناءً على بيانات منتجك.', 'Create a product name, description, features and FAQs from your product details.')}</p>
            {error ? <p role="alert" className="pe-ai-error">{error}</p> : null}
            {!result && available === false && !error ? <p role="status" className="pe-ai-note">{text('خدمة إنشاء محتوى المنتج غير مفعّلة حاليًا. يمكنك متابعة التحرير يدويًا.', 'Product content generation is not configured yet. You can continue editing manually.')}</p> : null}
            {result ? <div className="pe-ai-review" key="review">
                <p className="pe-ai-target">{text('لغة المحتوى', 'Content locale')}: <b>{result.locale.toUpperCase()}</b></p>
                {result.parts.includes('name') ? <label>{label('name')}<input maxLength={255} value={result.copy.name || ''} onChange={event => editCopy('name', event.target.value)} /></label> : null}
                {result.parts.includes('description') ? <label>{label('description')}<textarea rows={6} maxLength={4000} value={result.copy.description.join('\n\n')} onChange={event => editCopy('description', event.target.value.split(/\n\s*\n/))} /></label> : null}
                {['features', 'faqs', 'reviews'].filter(part => result.parts.includes(part)).map(part => <section key={part}><h3>{label(part)}</h3>{part === 'reviews' ? <p className="pe-ai-note">{text('ملخصات لتعليقات قدّمتها، وليست مراجعات موثقة أو تقييمات جديدة.', 'Summaries of feedback you supplied, not verified reviews or new ratings.')}</p> : null}{result.copy[part].length ? result.copy[part].map((item, index) => <div className="pe-ai-review-item" key={index}>{part === 'faqs' ? <><label>{text('السؤال', 'Question')} {index + 1}<input maxLength={160} value={item.question} onChange={event => editCopy(part, result.copy[part].map((value, i) => i === index ? { ...value, question: event.target.value } : value))} /></label><label>{text('الإجابة', 'Answer')} {index + 1}<textarea rows={2} maxLength={500} value={item.answer} onChange={event => editCopy(part, result.copy[part].map((value, i) => i === index ? { ...value, answer: event.target.value } : value))} /></label></> : <label>{label(part)} {index + 1}<textarea rows={2} maxLength={part === 'features' ? 240 : 450} value={item} onChange={event => editCopy(part, result.copy[part].map((value, i) => i === index ? event.target.value : value))} /></label>}</div>) : <p className="pe-ai-note">{text('المعلومات المقدّمة لا تكفي لإنشاء هذا الجزء.', 'The supplied details were insufficient for this part.')}</p>}</section>)}
                <footer className="pe-ai-actions"><button type="button" onClick={() => { setResult(null); setError(''); }}>{text('رجوع', 'Back')}</button><button type="button" className="pe-ai-primary" onClick={apply} disabled={result.parts.includes('name') && !result.copy.name?.trim()}>{text('تطبيق على المسودة', 'Apply to draft')}</button></footer>
            </div> : <form onSubmit={generate} className="pe-ai-form" key="brief">
                <fieldset disabled={busy}><legend>{text('اختر الأجزاء التي تريد إضافتها لمنتجك', 'Choose the parts to add to your product')}</legend><div className="pe-ai-parts">{productAiParts.map((part, index) => { const Icon = icons[index]; return <label className={parts.includes(part) ? 'is-selected' : ''} key={part}><Icon aria-hidden /><span>{label(part)}</span><input type="checkbox" checked={parts.includes(part)} onChange={event => setParts(current => event.target.checked ? [...current, part] : current.filter(value => value !== part))} /></label>; })}</div></fieldset>
                <fieldset className="pe-ai-counts" disabled={busy}>{['reviews', 'faqs', 'features'].map(part => <label key={part}>{text('عدد ', 'Number of ')}{label(part)}<input type="number" min={0} max={10} step={1} required disabled={!parts.includes(part)} value={counts[part]} onChange={event => setCounts(current => ({ ...current, [part]: event.target.value === '' ? '' : Number(event.target.value) }))} /></label>)}</fieldset>
                <fieldset className="pe-ai-fields" disabled={busy}><label>{text('اللغة', 'Language')}<input required maxLength={80} value={brief.language} onChange={event => updateBrief('language', event.target.value)} /><small>{text('مثال: العربية، الإنجليزية', 'For example: Arabic, English')}</small></label><label>{text('اللهجة', 'Dialect')}<input maxLength={120} value={brief.dialect} onChange={event => updateBrief('dialect', event.target.value)} /><small>{text('مثال: المصرية، السعودية، العربية الفصحى', 'For example: Egyptian, Saudi, formal Arabic')}</small></label><label>{text('الدولة', 'Country')}<input maxLength={120} value={brief.country} onChange={event => updateBrief('country', event.target.value)} /><small>{text('مثال: مصر، السعودية، بريطانيا', 'For example: Egypt, Saudi Arabia, UK')}</small></label></fieldset>
                <label>{text('وصف المنتج', 'Product brief')} *<textarea aria-label={text('وصف المنتج *', 'Product brief *')} required minLength={20} maxLength={6000} rows={5} value={brief.description} disabled={busy} onChange={event => updateBrief('description', event.target.value)} /><small>{text('اكتب وصفًا قصيرًا بالمعلومات الفعلية للمنتج لإنشاء المحتوى بناءً عليه.', 'Enter a short description with factual product details to base the content on.')}</small></label>
                {parts.includes('reviews') ? <details className="pe-ai-feedback"><summary>{text('تعليقات العملاء الأصلية لتلخيصها', 'Original customer feedback to summarize')}</summary><label>{text('نص التعليقات', 'Feedback text')}<textarea rows={3} maxLength={4000} value={brief.review_source} disabled={busy} onChange={event => updateBrief('review_source', event.target.value)} /><small>{text('أضف تعليقات حقيقية دون بيانات شخصية. إذا تركتها فارغة لن تُنشأ مراجعات.', 'Supply real feedback without personal details. Leaving this blank generates no reviews.')}</small></label></details> : null}
                <label className="pe-ai-target">{text('لغة المحتوى التي سيُطبق عليها النص', 'Content locale to apply the text to')}<select value={locale} disabled={busy} onChange={event => { setLocale(event.target.value); updateBrief('language', event.target.value === 'ar' ? 'العربية' : 'English'); }}>{locales.map(value => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></label>
                <footer className="pe-ai-actions"><span role="status">{busy ? text('جارٍ إنشاء المحتوى…', 'Generating content…') : text('لن يُحفظ المنتج أو يُنشر تلقائيًا.', 'The product will not be saved or published automatically.')}</span><button type="submit" className="pe-ai-primary" disabled={busy || !available || !parts.length}><HiOutlineSparkles aria-hidden />{text('إنشاء', 'Generate')}</button></footer>
            </form>}
        </div>
    </DialogPanel></div></Dialog>;
}
