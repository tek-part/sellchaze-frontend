import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import { Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { sanitizeHtml } from '../../shared/utils/sanitizeHtml';
import './product-rich-text.css';

const mediaNode = (tag) => Node.create({
    name: tag, group: 'block', atom: true, draggable: true,
    addAttributes: () => ({ src: { default: null }, alt: { default: null }, title: { default: null } }),
    parseHTML: () => [{ tag: `${tag}[src]` }],
    renderHTML: ({ HTMLAttributes }) => [tag, { ...HTMLAttributes, ...(tag === 'video' ? { controls: '', playsinline: '', preload: 'metadata' } : { loading: 'lazy' }) }],
});
const extensions = [StarterKit.configure({ link: { openOnClick: false } }), mediaNode('img'), mediaNode('video')];

export default function ProductRichText({ value, onChange, label, locale, disabled = false, ar, media = [] }) {
    const text = (a, e) => ar ? a : e;
    const [source, setSource] = useState(false); const [expanded, setExpanded] = useState(false);
    const [link, setLink] = useState(''); const [showLink, setShowLink] = useState(false);
    const editor = useEditor({ extensions, content: sanitizeHtml(value), editable: !disabled,
        editorProps: { attributes: { role: 'textbox', 'aria-label': label, 'aria-multiline': 'true', dir: locale === 'ar' ? 'rtl' : 'ltr' } },
        onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
    });
    useEffect(() => { editor?.setEditable(!disabled, false); }, [editor, disabled]);
    useEffect(() => {
        if (editor && !source && editor.getHTML() !== value && !editor.isFocused) editor.commands.setContent(sanitizeHtml(value), { emitUpdate: false });
    }, [editor, source, value]);
    if (!editor) return null;
    const command = (name) => editor.chain().focus()[name]().run();
    const tools = [['bold', 'عريض', 'Bold', 'toggleBold'], ['italic', 'مائل', 'Italic', 'toggleItalic'], ['underline', 'تسطير', 'Underline', 'toggleUnderline'], ['strike', 'شطب', 'Strike', 'toggleStrike'], ['bulletList', 'قائمة نقطية', 'Bullet list', 'toggleBulletList'], ['orderedList', 'قائمة مرقمة', 'Numbered list', 'toggleOrderedList'], ['blockquote', 'اقتباس', 'Quote', 'toggleBlockquote']];
    const content = <div className={`product-rich-text ${expanded ? 'product-rich-text--expanded' : ''}`} onKeyDown={(event) => { if (event.key === 'Escape') setExpanded(false); }}>
        <div className="product-rich-text__heading"><span>{label}</span><button type="button" onClick={() => setExpanded(!expanded)}>{expanded ? text('تصغير المحرر', 'Collapse editor') : text('توسيع المحرر', 'Expand editor')}</button></div>
        <div className="product-rich-text__toolbar" role="group" aria-label={text('تنسيق وصف المنتج', 'Product description formatting')}>
            <select aria-label={text('مستوى العنوان', 'Heading level')} disabled={disabled || source} value={[1, 2, 3, 4, 5, 6].find((level) => editor.isActive('heading', { level })) || ''} onChange={(e) => e.target.value ? editor.chain().focus().setHeading({ level: Number(e.target.value) }).run() : editor.chain().focus().setParagraph().run()}><option value="">{text('نص عادي', 'Paragraph')}</option>{[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>H{level}</option>)}</select>
            {tools.map(([mark, a, e, action]) => <button key={mark} type="button" disabled={disabled || source} aria-pressed={editor.isActive(mark)} onClick={() => command(action)}>{text(a, e)}</button>)}
            <button type="button" disabled={disabled || source} onClick={() => setShowLink(!showLink)}>{text('رابط', 'Link')}</button>
            <button type="button" disabled={disabled || source} onClick={() => editor.chain().focus().unsetLink().run()}>{text('إزالة الرابط', 'Unlink')}</button>
            <select aria-label={text('إدراج رمز تعبيري', 'Insert emoji')} value="" disabled={disabled || source} onChange={(e) => editor.chain().focus().insertContent(e.target.value).run()}><option value="">☺</option>{['✨', '✓', '⭐', '💚', '🎁', '🚚'].map((emoji) => <option key={emoji}>{emoji}</option>)}</select>
            <button type="button" disabled={disabled || source} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>{text('مسح التنسيق', 'Clear formatting')}</button>
            <button type="button" disabled={disabled || source} onClick={() => command('undo')}>{text('تراجع', 'Undo')}</button>
            <button type="button" disabled={disabled || source} onClick={() => command('redo')}>{text('إعادة', 'Redo')}</button>
            <button type="button" disabled={disabled} aria-pressed={source} onClick={() => { if (source) { const clean = sanitizeHtml(value); editor.commands.setContent(clean, { emitUpdate: false }); onChange(clean); } setSource(!source); }}>HTML</button>
        </div>
        {showLink && !source ? <div className="product-rich-text__link"><label>{text('عنوان الرابط', 'Link URL')}<input dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" disabled={disabled} /></label><button type="button" disabled={disabled || !/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(link.trim())} onClick={() => { editor.chain().focus().setLink({ href: link.trim() }).run(); setShowLink(false); setLink(''); }}>{text('إدراج الرابط', 'Insert link')}</button></div> : null}
        {source ? <label className="product-rich-text__source">{text('مصدر وصف المنتج', 'Product description HTML')}<textarea dir="ltr" rows={12} value={value} disabled={disabled} maxLength={20000} onChange={(e) => onChange(e.target.value)} /></label> : <EditorContent editor={editor} />}
        {media.length ? <label className="product-rich-text__insert">{text('إدراج وسائط محفوظة داخل الوصف', 'Insert saved media into description')}<select value="" disabled={disabled || source} onChange={(e) => { const item = media.find((row) => String(row.id) === e.target.value); if (item) editor.chain().focus().insertContent({ type: item.type === 'video' ? 'video' : 'img', attrs: { src: item.url, alt: item.alt || label } }).run(); }}><option value="">{text('اختر صورة أو فيديو', 'Choose an image or video')}</option>{media.map((item, index) => <option key={item.id} value={item.id}>{item.type === 'video' ? '▶' : '▧'} {index + 1} · {item.alt}</option>)}</select></label> : null}
        <p className="product-rich-text__hint">{text('ارفع الصور والفيديوهات واحفظ المنتج لإدراجها في الوصف. تُزال الأكواد والتنسيقات غير المدعومة عند الحفظ.', 'Upload media and save the product to insert it here. Unsupported code and formatting are removed on save.')} {value.length}/20000</p>
    </div>;
    return expanded ? createPortal(content, document.body) : content;
}
