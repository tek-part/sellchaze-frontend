import { useEffect, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import DiscountTargetPicker from './DiscountTargetPicker';
import {
    HiOutlineArrowDown, HiOutlineArrowUp, HiOutlineBars2, HiOutlineLink, HiOutlineListBullet, HiOutlineTrash, HiOutlineXMark,
} from '../workspace/WorkspaceIcons';
import { BLOCK_TYPES, MAX_BLOCKS, MAX_PRODUCTS, blockLabel, moveBlock, newBlock, reorderBlock } from '../../features/store/emailCampaigns';

export const FIELD = 'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-red-400';
export const LABEL = 'mb-1 block text-sm font-medium text-slate-700';
export const CARD = 'min-w-0 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-5';
const ICON_BUTTON = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40';

export function FieldError({ id, message }) {
    return message ? <p id={id} className="mt-1.5 text-xs font-medium text-red-600">{message}</p> : null;
}

/** A small rich-text editor for the text block: bold, italic, lists and links (the server sanitizes). */
function EmailRichText({ id, value, onChange, label, ar, invalid, describedBy }) {
    const text = (a, e) => (ar ? a : e);
    const [link, setLink] = useState('');
    const [showLink, setShowLink] = useState(false);
    const editor = useEditor({
        extensions: [StarterKit.configure({ link: { openOnClick: false, autolink: true }, code: false, codeBlock: false, horizontalRule: false, heading: { levels: [2, 3] } })],
        content: value || '',
        editorProps: { attributes: { id, role: 'textbox', 'aria-label': label, 'aria-multiline': 'true', ...(invalid ? { 'aria-invalid': 'true' } : {}), ...(describedBy ? { 'aria-describedby': describedBy } : {}),
            class: 'min-h-24 rounded-b-xl border border-t-0 border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none focus:border-brand [&_a]:text-blue-700 [&_a]:underline [&_ol]:list-decimal [&_ol]:ps-5 [&_ul]:list-disc [&_ul]:ps-5' } },
        onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
    });
    useEditorState({ editor, selector: ({ transactionNumber }) => transactionNumber });
    useEffect(() => {
        if (editor && !editor.isDestroyed && !editor.isFocused && editor.getHTML() !== value) editor.commands.setContent(value || '', { emitUpdate: false });
    }, [editor, value]);
    if (!editor) return null;
    const tool = (key, a, e, run, content) => <button key={key} type="button" title={text(a, e)} aria-label={text(a, e)} aria-pressed={editor.isActive(key)}
        className="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm text-slate-700 hover:bg-slate-100 aria-pressed:bg-slate-200" onClick={run}>{content}</button>;
    const validLink = /^(https?:\/\/|mailto:)/i.test(link.trim());
    return <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label={text('تنسيق النص', 'Text formatting')}>
            {tool('bold', 'عريض', 'Bold', () => editor.chain().focus().toggleBold().run(), <b>B</b>)}
            {tool('italic', 'مائل', 'Italic', () => editor.chain().focus().toggleItalic().run(), <i>I</i>)}
            {tool('bulletList', 'قائمة نقطية', 'Bullet list', () => editor.chain().focus().toggleBulletList().run(), <HiOutlineListBullet aria-hidden />)}
            {tool('orderedList', 'قائمة مرقمة', 'Numbered list', () => editor.chain().focus().toggleOrderedList().run(), <span aria-hidden>1.</span>)}
            {tool('link', 'رابط', 'Link', () => { setLink(editor.getAttributes('link').href || ''); setShowLink((open) => !open); }, <HiOutlineLink aria-hidden />)}
            {tool('unlink', 'إزالة الرابط', 'Remove link', () => editor.chain().focus().extendMarkRange('link').unsetLink().run(), <HiOutlineXMark aria-hidden />)}
        </div>
        {showLink ? <div className="flex flex-wrap items-end gap-2 border-x border-slate-200 bg-slate-50 p-2">
            <label className="min-w-0 flex-1 text-xs font-medium text-slate-700">{text('عنوان الرابط', 'Link URL')}
                <input dir="ltr" className={FIELD} value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://" /></label>
            <button type="button" disabled={!validLink} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                onClick={() => { editor.chain().focus().extendMarkRange('link').setLink({ href: link.trim() }).run(); setShowLink(false); setLink(''); }}>{text('إدراج', 'Insert')}</button>
        </div> : null}
        <EditorContent editor={editor} />
    </div>;
}

function BlockFields({ block, index, update, errors, ar, apiBase, coupons, productNames, onProductNames }) {
    const text = (a, e) => (ar ? a : e);
    const id = (field) => `block-${block.id}-${field}`;
    const err = (field) => errors[`content.${index}.${field}`]?.[0];
    const input = (field, label, props = {}) => <div className="min-w-0">
        <label className={LABEL} htmlFor={id(field)}>{label}</label>
        <input id={id(field)} className={FIELD} value={block[field] ?? ''} onChange={(event) => update({ [field]: event.target.value })}
            aria-invalid={err(field) ? true : undefined} aria-describedby={err(field) ? `${id(field)}-error` : undefined} {...props} />
        <FieldError id={`${id(field)}-error`} message={err(field)} />
    </div>;
    const align = <div className="min-w-0">
        <label className={LABEL} htmlFor={id('align')}>{text('المحاذاة', 'Alignment')}</label>
        <select id={id('align')} className={FIELD} value={block.align ?? 'start'} onChange={(event) => update({ align: event.target.value })}>
            <option value="start">{text('بداية السطر', 'Start')}</option><option value="center">{text('الوسط', 'Center')}</option><option value="end">{text('نهاية السطر', 'End')}</option>
        </select>
    </div>;

    switch (block.type) {
        case 'heading': return <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            {input('text', text('نص العنوان', 'Heading text'), { maxLength: 200 })}
            <div className="min-w-0">
                <label className={LABEL} htmlFor={id('size')}>{text('الحجم', 'Size')}</label>
                <select id={id('size')} className={FIELD} value={block.size ?? 'large'} onChange={(event) => update({ size: event.target.value })}>
                    <option value="large">{text('كبير', 'Large')}</option><option value="medium">{text('متوسط', 'Medium')}</option>
                </select>
            </div>
            {align}
        </div>;
        case 'text': return <div className="space-y-3">
            <span className={LABEL} id={id('label')}>{text('النص', 'Text')}</span>
            <EmailRichText id={id('html')} value={block.html ?? ''} onChange={(html) => update({ html })} label={text('النص', 'Text')} ar={ar}
                invalid={Boolean(err('html'))} describedBy={err('html') ? `${id('html')}-error` : undefined} />
            <FieldError id={`${id('html')}-error`} message={err('html')} />
        </div>;
        case 'image': return <div className="grid gap-3 sm:grid-cols-2">
            {input('src', text('رابط الصورة (https)', 'Image URL (https)'), { dir: 'ltr', inputMode: 'url', placeholder: 'https://' })}
            {input('alt', text('وصف الصورة', 'Image description'), { maxLength: 200 })}
            <div className="sm:col-span-2">{input('url', text('رابط عند النقر (اختياري)', 'Link when clicked (optional)'), { dir: 'ltr', inputMode: 'url', placeholder: 'https://' })}</div>
        </div>;
        case 'button': return <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            {input('label', text('نص الزر', 'Button text'), { maxLength: 80 })}
            {input('url', text('رابط الزر', 'Button link'), { dir: 'ltr', inputMode: 'url', placeholder: 'https://' })}
            {align}
        </div>;
        case 'products': return <div className="min-w-0">
            <label className={LABEL} htmlFor={id('product_ids')}>{text(`المنتجات (حتى ${MAX_PRODUCTS})`, `Products (up to ${MAX_PRODUCTS})`)}</label>
            <DiscountTargetPicker apiBase={apiBase} kind="products" id={id('product_ids')} label={text('المنتجات', 'Products')} ar={ar}
                value={block.product_ids ?? []} onChange={(ids) => update({ product_ids: ids.slice(0, MAX_PRODUCTS) })}
                names={productNames} onNames={onProductNames} invalid={Boolean(err('product_ids'))} error={err('product_ids')} />
        </div>;
        case 'coupon': return <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
                <label className={LABEL} htmlFor={id('coupon_id')}>{text('كود الخصم', 'Discount code')}</label>
                <select id={id('coupon_id')} className={FIELD} value={block.coupon_id ?? ''} onChange={(event) => update({ coupon_id: event.target.value ? Number(event.target.value) : null })}
                    aria-invalid={err('coupon_id') ? true : undefined} aria-describedby={err('coupon_id') ? `${id('coupon_id')}-error` : undefined}>
                    <option value="">{coupons.length ? text('اختر كود خصم', 'Choose a discount code') : text('لا توجد أكواد خصم فعالة', 'No active discount codes')}</option>
                    {coupons.map((coupon) => <option key={coupon.id} value={coupon.id}>{coupon.code}{coupon.title ? ` — ${coupon.title}` : ''}</option>)}
                </select>
                <FieldError id={`${id('coupon_id')}-error`} message={err('coupon_id')} />
            </div>
            {input('text', text('نص مرافق (اختياري)', 'Supporting text (optional)'), { maxLength: 300 })}
        </div>;
        default: return <p className="text-sm text-slate-500">{text('خط فاصل بين أجزاء الرسالة.', 'A line separating parts of the email.')}</p>;
    }
}

/** Block list with drag-and-drop and up/down ordering. */
export function BlockList({ blocks, onChange, errors, ar, apiBase, coupons }) {
    const text = (a, e) => (ar ? a : e);
    const [dragging, setDragging] = useState(null);
    const [productNames, setProductNames] = useState({});
    const onProductNames = (_kind, names) => setProductNames((current) => ({ ...current, ...names }));
    const update = (index, patch) => onChange(blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)));
    const remove = (index) => onChange(blocks.filter((_, i) => i !== index));
    const add = (type) => onChange([...blocks, newBlock(type)]);

    return <div className="space-y-3">
        {errors.content ? <p className="text-sm font-medium text-red-600" role="alert">{errors.content[0]}</p> : null}
        <ol className="space-y-3" aria-label={text('محتوى الرسالة', 'Email content')}>
            {blocks.map((block, index) => <li key={block.id} data-block-type={block.type}
                onDragOver={(event) => { if (dragging !== null) event.preventDefault(); }}
                onDrop={(event) => { event.preventDefault(); if (dragging !== null) onChange(reorderBlock(blocks, dragging, index)); setDragging(null); }}
                className={`min-w-0 rounded-xl border bg-slate-50/60 p-3 ${dragging === index ? 'border-brand opacity-60' : 'border-slate-200'}`}>
                <div className="mb-3 flex items-center gap-2">
                    <span draggable onDragStart={(event) => { setDragging(index); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', block.id); }} onDragEnd={() => setDragging(null)}
                        className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-slate-500" title={text('اسحب لإعادة الترتيب', 'Drag to reorder')} aria-hidden>
                        <HiOutlineBars2 />
                    </span>
                    <strong className="min-w-0 flex-1 truncate text-sm text-slate-900">{index + 1}. {blockLabel(block.type, ar)}</strong>
                    <button type="button" className={ICON_BUTTON} disabled={index === 0} onClick={() => onChange(moveBlock(blocks, index, -1))} aria-label={text(`تحريك ${blockLabel(block.type, ar)} ${index + 1} لأعلى`, `Move ${blockLabel(block.type, ar)} ${index + 1} up`)}><HiOutlineArrowUp aria-hidden /></button>
                    <button type="button" className={ICON_BUTTON} disabled={index === blocks.length - 1} onClick={() => onChange(moveBlock(blocks, index, 1))} aria-label={text(`تحريك ${blockLabel(block.type, ar)} ${index + 1} لأسفل`, `Move ${blockLabel(block.type, ar)} ${index + 1} down`)}><HiOutlineArrowDown aria-hidden /></button>
                    <button type="button" className={`${ICON_BUTTON} hover:text-red-600`} onClick={() => remove(index)} aria-label={text(`حذف ${blockLabel(block.type, ar)} ${index + 1}`, `Remove ${blockLabel(block.type, ar)} ${index + 1}`)}><HiOutlineTrash aria-hidden /></button>
                </div>
                <BlockFields block={block} index={index} update={(patch) => update(index, patch)} errors={errors} ar={ar} apiBase={apiBase} coupons={coupons}
                    productNames={productNames} onProductNames={onProductNames} />
            </li>)}
        </ol>
        <div className="rounded-xl border border-dashed border-slate-300 p-3">
            <p className="mb-2 text-sm font-medium text-slate-700" id="add-block-label">{text('إضافة محتوى', 'Add content')}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="add-block-label">
                {BLOCK_TYPES.map((type) => <button key={type} type="button" disabled={blocks.length >= MAX_BLOCKS} onClick={() => add(type)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40">+ {blockLabel(type, ar)}</button>)}
            </div>
        </div>
    </div>;
}

/** Who receives the campaign. Every option is limited to active e-mail newsletter subscribers. */
export function AudiencePicker({ audience, onChange, tags, count, counting, ar, errors }) {
    const text = (a, e) => (ar ? a : e);
    const [tagInput, setTagInput] = useState('');
    const filters = audience.type === 'segment' ? audience.filters ?? {} : {};
    const setFilter = (key, value) => onChange({ type: 'segment', filters: { ...filters, [key]: value } });
    const selectedTags = audience.type === 'tags' ? audience.tags ?? [] : [];
    const toggleTag = (tag, on) => onChange({ type: 'tags', tags: on ? [...new Set([...selectedTags, tag])] : selectedTags.filter((item) => item !== tag) });
    const segmentField = (key, label, type = 'number') => <div className="min-w-0">
        <label className={LABEL} htmlFor={`segment-${key}`}>{label}</label>
        <input id={`segment-${key}`} type={type} min={type === 'number' ? 0 : undefined} dir="ltr" className={FIELD} value={filters[key] ?? ''} onChange={(event) => setFilter(key, event.target.value)} />
    </div>;
    const choice = (type, label, hint) => <label className={`flex min-w-0 cursor-pointer gap-3 rounded-xl border p-3 ${audience.type === type ? 'border-brand bg-brand/5' : 'border-slate-200'}`}>
        <input type="radio" name="audience-type" className="mt-1" checked={audience.type === type}
            onChange={() => onChange(type === 'all' ? { type: 'all' } : type === 'tags' ? { type: 'tags', tags: [] } : { type: 'segment', filters: {} })} />
        <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900">{label}</span><span className="block text-xs text-slate-500">{hint}</span></span>
    </label>;

    return <div className="space-y-4">
        <fieldset className="grid gap-2 sm:grid-cols-3">
            <legend className="sr-only">{text('الجمهور', 'Audience')}</legend>
            {choice('all', text('كل المشتركين', 'All subscribers'), text('كل من اشترك في النشرة البريدية', 'Everyone subscribed to your newsletter'))}
            {choice('tags', text('حسب الوسوم', 'By customer tags'), text('المشتركون الذين يحملون أحد الوسوم', 'Subscribers carrying any of the tags'))}
            {choice('segment', text('شريحة عملاء', 'Customer segment'), text('حسب الطلبات والإنفاق والتواريخ', 'By orders, spend and dates'))}
        </fieldset>
        {audience.type === 'tags' ? <div className="space-y-2">
            {tags.length ? <div className="flex flex-wrap gap-2" role="group" aria-label={text('وسوم العملاء', 'Customer tags')}>
                {tags.map((row) => <label key={row.tag} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm">
                    <input type="checkbox" checked={selectedTags.includes(row.tag)} onChange={(event) => toggleTag(row.tag, event.target.checked)} />{row.tag} <span className="text-xs text-slate-500">({row.count})</span>
                </label>)}
            </div> : null}
            <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                    <label className={LABEL} htmlFor="audience-tag">{text('أضف وسمًا', 'Add a tag')}</label>
                    <input id="audience-tag" className={FIELD} value={tagInput} maxLength={40} onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (tagInput.trim()) { toggleTag(tagInput.trim(), true); setTagInput(''); } } }} />
                </div>
                <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" disabled={!tagInput.trim()} onClick={() => { toggleTag(tagInput.trim(), true); setTagInput(''); }}>{text('إضافة', 'Add')}</button>
            </div>
            {selectedTags.length ? <p className="text-sm text-slate-600">{text('الوسوم المختارة:', 'Selected tags:')} {selectedTags.join('، ')}</p> : null}
        </div> : null}
        {audience.type === 'segment' ? <div className="grid gap-3 sm:grid-cols-2">
            {segmentField('orders_min', text('عدد الطلبات من', 'Orders from'))}
            {segmentField('orders_max', text('عدد الطلبات إلى', 'Orders to'))}
            {segmentField('spent_min', text('إجمالي الإنفاق من', 'Amount spent from'))}
            {segmentField('spent_max', text('إجمالي الإنفاق إلى', 'Amount spent to'))}
            {segmentField('last_order_from', text('آخر طلب من تاريخ', 'Last order from'), 'date')}
            {segmentField('last_order_to', text('آخر طلب حتى تاريخ', 'Last order until'), 'date')}
            {segmentField('first_order_from', text('أول طلب من تاريخ', 'First order from'), 'date')}
            <div className="min-w-0">
                <label className={LABEL} htmlFor="segment-account">{text('الحساب', 'Account')}</label>
                <select id="segment-account" className={FIELD} value={filters.account ?? ''} onChange={(event) => setFilter('account', event.target.value)}>
                    <option value="">{text('الكل', 'Any')}</option><option value="registered">{text('مسجّل', 'Registered')}</option><option value="guest">{text('زائر', 'Guest')}</option>
                </select>
            </div>
        </div> : null}
        {errors.audience ? <p className="text-sm font-medium text-red-600" role="alert">{errors.audience[0]}</p> : null}
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700" role="status" aria-live="polite" data-audience-count={count ?? ''}>
            {counting || count === null || count === undefined ? text('جارٍ حساب المستلمين…', 'Counting recipients…')
                : text(`${new Intl.NumberFormat('ar-EG').format(count)} مشترك سيستلم هذه الحملة`, `${new Intl.NumberFormat('en').format(count)} ${count === 1 ? 'subscriber' : 'subscribers'} will receive this campaign`)}
            <span className="block text-xs text-slate-500">{text('يُرسل فقط للمشتركين في النشرة البريدية، ولا يُرسل لمن ألغى اشتراكه.', 'Only newsletter subscribers are emailed; anyone who unsubscribed is excluded.')}</span>
        </p>
    </div>;
}
