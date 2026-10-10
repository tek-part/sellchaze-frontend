import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import { Extension, Mark, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { sanitizeHtml } from '../../shared/utils/sanitizeHtml';
import { richTextColor } from '../../shared/utils/richTextFormatting';
import './product-rich-text.css';

const mediaNode = (tag) => Node.create({
    name: tag, group: 'block', atom: true, draggable: true,
    addAttributes: () => ({ src: { default: null }, alt: { default: null }, title: { default: null } }),
    parseHTML: () => [{ tag: `${tag}[src]` }],
    renderHTML: ({ HTMLAttributes }) => [tag, { ...HTMLAttributes, ...(tag === 'video' ? { controls: '', playsinline: '', preload: 'metadata' } : { loading: 'lazy' }) }],
});
const extensions = [StarterKit.configure({ link: { openOnClick: false } }), mediaNode('img'), mediaNode('video')];
const pageTextStyle = Mark.create({
    name: 'pageTextStyle',
    addAttributes: () => ({ color: { default: null, parseHTML: (el) => richTextColor(el.style.color) }, backgroundColor: { default: null, parseHTML: (el) => richTextColor(el.style.backgroundColor) } }),
    parseHTML: () => [{ tag: 'span[style]' }],
    renderHTML: ({ HTMLAttributes }) => ['span', { style: [HTMLAttributes.color ? `color:${HTMLAttributes.color}` : '', HTMLAttributes.backgroundColor ? `background-color:${HTMLAttributes.backgroundColor}` : ''].filter(Boolean).join(';') }, 0],
});
const pageAlignment = Extension.create({
    name: 'pageAlignment',
    addGlobalAttributes: () => [{ types: ['paragraph', 'heading', 'blockquote', 'listItem'], attributes: { textAlign: {
        default: null, parseHTML: (el) => ['left', 'right', 'center', 'justify', 'start', 'end'].includes(el.style.textAlign) ? el.style.textAlign : null,
        renderHTML: (attrs) => attrs.textAlign ? { style: `text-align:${attrs.textAlign}` } : {},
    }, pageColor: { default: null, parseHTML: (el) => richTextColor(el.style.color), renderHTML: (attrs) => attrs.pageColor ? { style: `color:${attrs.pageColor}` } : {} },
    pageBackground: { default: null, parseHTML: (el) => richTextColor(el.style.backgroundColor), renderHTML: (attrs) => attrs.pageBackground ? { style: `background-color:${attrs.pageBackground}` } : {} },
    } }],
});

export default function ProductRichText({ value, onChange, label, locale, disabled = false, ar, media = [], pageContent = false }) {
    const text = (a, e) => ar ? a : e;
    const activeExtensions = useMemo(() => pageContent ? [...extensions, pageTextStyle, pageAlignment] : extensions, [pageContent]);
    const [source, setSource] = useState(false); const [expanded, setExpanded] = useState(false);
    const [link, setLink] = useState(''); const [showLink, setShowLink] = useState(false);
    const [mediaKind, setMediaKind] = useState(''); const [mediaUrl, setMediaUrl] = useState(''); const [mediaAlt, setMediaAlt] = useState('');
    const editor = useEditor({ extensions: activeExtensions, content: sanitizeHtml(value, { formatting: pageContent }), editable: !disabled,
        editorProps: { attributes: { role: 'textbox', 'aria-label': label, 'aria-multiline': 'true', dir: locale === 'ar' ? 'rtl' : 'ltr' } },
        onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
    });
    useEffect(() => { editor?.setEditable(!disabled, false); }, [editor, disabled]);
    useEffect(() => {
        if (editor && editor.schema && !editor.isDestroyed && !source && editor.getHTML() !== value && !editor.isFocused) editor.commands.setContent(sanitizeHtml(value, { formatting: pageContent }), { emitUpdate: false });
    }, [editor, source, value, pageContent]);
    if (!editor || !editor.schema || editor.isDestroyed) return null;
    const command = (name) => editor.chain().focus()[name]().run();
    const tools = [['bold', 'عريض', 'Bold', 'toggleBold'], ['italic', 'مائل', 'Italic', 'toggleItalic'], ['underline', 'تسطير', 'Underline', 'toggleUnderline'], ['strike', 'شطب', 'Strike', 'toggleStrike'], ['bulletList', 'قائمة نقطية', 'Bullet list', 'toggleBulletList'], ['orderedList', 'قائمة مرقمة', 'Numbered list', 'toggleOrderedList'], ['blockquote', 'اقتباس', 'Quote', 'toggleBlockquote']];
    const content = <div className={`product-rich-text ${expanded ? 'product-rich-text--expanded' : ''}`} onKeyDown={(event) => { if (event.key === 'Escape') setExpanded(false); }}>
        <div className="product-rich-text__heading"><span>{label}</span><button type="button" onClick={() => setExpanded(!expanded)}>{expanded ? text('تصغير المحرر', 'Collapse editor') : text('توسيع المحرر', 'Expand editor')}</button></div>
        <div className="product-rich-text__toolbar" role="group" aria-label={pageContent ? text('تنسيق محتوى الصفحة', 'Page content formatting') : text('تنسيق وصف المنتج', 'Product description formatting')}>
            <select aria-label={text('مستوى العنوان', 'Heading level')} disabled={disabled || source} value={[1, 2, 3, 4, 5, 6].find((level) => editor.isActive('heading', { level })) || ''} onChange={(e) => e.target.value ? editor.chain().focus().setHeading({ level: Number(e.target.value) }).run() : editor.chain().focus().setParagraph().run()}><option value="">{text('نص عادي', 'Paragraph')}</option>{[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>H{level}</option>)}</select>
            {tools.map(([mark, a, e, action]) => <button key={mark} type="button" disabled={disabled || source} aria-pressed={editor.isActive(mark)} onClick={() => command(action)}>{text(a, e)}</button>)}
            <button type="button" disabled={disabled || source} onClick={() => setShowLink(!showLink)}>{text('رابط', 'Link')}</button>
            <button type="button" disabled={disabled || source} onClick={() => editor.chain().focus().unsetLink().run()}>{text('إزالة الرابط', 'Unlink')}</button>
            {pageContent ? <>{['img', 'video'].map((kind) => <button key={kind} type="button" disabled={disabled || source} onClick={() => { setMediaKind(mediaKind === kind ? '' : kind); setMediaUrl(''); setMediaAlt(''); }}>{kind === 'img' ? text('صورة', 'Image') : text('فيديو', 'Video')}</button>)}</> : null}
            {pageContent ? <>
                <label>{text('محاذاة النص', 'Text alignment')}<select aria-label={text('محاذاة النص', 'Text alignment')} disabled={disabled || source} value={editor.getAttributes('paragraph').textAlign || editor.getAttributes('heading').textAlign || ''} onChange={(e) => editor.chain().focus().updateAttributes('paragraph', { textAlign: e.target.value || null }).updateAttributes('heading', { textAlign: e.target.value || null }).run()}><option value="">{text('افتراضي', 'Default')}</option>{['start', 'center', 'end', 'justify'].map((align, i) => <option key={align} value={align}>{[text('بداية', 'Start'), text('وسط', 'Center'), text('نهاية', 'End'), text('ضبط', 'Justify')][i]}</option>)}</select></label>
                <label>{text('لون النص', 'Text color')}<input type="color" aria-label={text('لون النص', 'Text color')} disabled={disabled || source} value={editor.getAttributes('pageTextStyle').color || '#000000'} onInput={(e) => editor.chain().focus().setMark('pageTextStyle', { color: e.currentTarget.value }).run()} onChange={(e) => editor.chain().focus().setMark('pageTextStyle', { color: e.target.value }).run()} /></label>
                <label>{text('لون خلفية النص', 'Text background color')}<input type="color" aria-label={text('لون خلفية النص', 'Text background color')} disabled={disabled || source} value={editor.getAttributes('pageTextStyle').backgroundColor || '#ffffff'} onInput={(e) => editor.chain().focus().setMark('pageTextStyle', { backgroundColor: e.currentTarget.value }).run()} onChange={(e) => editor.chain().focus().setMark('pageTextStyle', { backgroundColor: e.target.value }).run()} /></label>
                <button type="button" disabled={disabled || source} onClick={() => editor.chain().focus().unsetMark('pageTextStyle').updateAttributes('paragraph', { textAlign: null, pageColor: null, pageBackground: null }).updateAttributes('heading', { textAlign: null, pageColor: null, pageBackground: null }).run()}>{text('مسح الألوان والمحاذاة', 'Clear colors and alignment')}</button>
            </> : null}
            <select aria-label={text('إدراج رمز تعبيري', 'Insert emoji')} value="" disabled={disabled || source} onChange={(e) => editor.chain().focus().insertContent(e.target.value).run()}><option value="">☺</option>{['✨', '✓', '⭐', '💚', '🎁', '🚚'].map((emoji) => <option key={emoji}>{emoji}</option>)}</select>
            <button type="button" disabled={disabled || source} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>{text('مسح التنسيق', 'Clear formatting')}</button>
            <button type="button" disabled={disabled || source} onClick={() => command('undo')}>{text('تراجع', 'Undo')}</button>
            <button type="button" disabled={disabled || source} onClick={() => command('redo')}>{text('إعادة', 'Redo')}</button>
            <button type="button" disabled={disabled} aria-pressed={source} onClick={() => { if (source) { const clean = sanitizeHtml(value, { formatting: pageContent }); editor.commands.setContent(clean, { emitUpdate: false }); onChange(clean); } setSource(!source); }}>HTML</button>
        </div>
        {showLink && !source ? <div className="product-rich-text__link"><label>{text('عنوان الرابط', 'Link URL')}<input dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" disabled={disabled} /></label><button type="button" disabled={disabled || !/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(link.trim())} onClick={() => { editor.chain().focus().setLink({ href: link.trim() }).run(); setShowLink(false); setLink(''); }}>{text('إدراج الرابط', 'Insert link')}</button></div> : null}
        {mediaKind && !source ? <div className="product-rich-text__link"><label>{text('رابط الصورة أو الفيديو', 'Image or video URL')}<input dir="ltr" value={mediaUrl} disabled={disabled} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" /></label><label>{text('وصف الوسائط', 'Media description')}<input value={mediaAlt} disabled={disabled} maxLength={250} onChange={(e) => setMediaAlt(e.target.value)} /></label><button type="button" disabled={disabled || !/^(https?:\/\/|\/(?!\/))/i.test(mediaUrl.trim())} onClick={() => { editor.chain().focus().insertContent({ type: mediaKind, attrs: { src: mediaUrl.trim(), alt: mediaAlt, title: mediaAlt } }).run(); setMediaKind(''); setMediaUrl(''); setMediaAlt(''); }}>{text('إدراج الوسائط', 'Insert media')}</button></div> : null}
        {source ? <label className="product-rich-text__source">{pageContent ? text('مصدر محتوى الصفحة', 'Page content HTML') : text('مصدر وصف المنتج', 'Product description HTML')}<textarea dir="ltr" rows={12} value={value} disabled={disabled} maxLength={20000} onChange={(e) => onChange(e.target.value)} /></label> : <EditorContent editor={editor} />}
        {media.length ? <label className="product-rich-text__insert">{text('إدراج وسائط محفوظة داخل الوصف', 'Insert saved media into description')}<select value="" disabled={disabled || source} onChange={(e) => { const item = media.find((row) => String(row.id) === e.target.value); if (item) editor.chain().focus().insertContent({ type: item.type === 'video' ? 'video' : 'img', attrs: { src: item.url, alt: item.alt || label } }).run(); }}><option value="">{text('اختر صورة أو فيديو', 'Choose an image or video')}</option>{media.map((item, index) => <option key={item.id} value={item.id}>{item.type === 'video' ? '▶' : '▧'} {index + 1} · {item.alt}</option>)}</select></label> : null}
        <p className="product-rich-text__hint">{pageContent ? text('أضف صورًا أو فيديوهات مباشرة بروابطها، أو استخدم مكتبة وسائط المتجر. تُزال الأكواد والتنسيقات غير المدعومة عند الحفظ.', 'Insert direct image/video URLs or use your store media library. Unsupported code and formatting are removed on save.') : text('ارفع الصور والفيديوهات واحفظ المنتج لإدراجها في الوصف. تُزال الأكواد والتنسيقات غير المدعومة عند الحفظ.', 'Upload media and save the product to insert it here. Unsupported code and formatting are removed on save.')} {value.length}/20000</p>
    </div>;
    return expanded ? createPortal(content, document.body) : content;
}
