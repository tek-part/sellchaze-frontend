import { FaAlignCenter, FaAlignJustify, FaAlignLeft, FaAlignRight, FaBold, FaCode, FaFilm, FaFont, FaImage, FaItalic, FaLink, FaListOl, FaListUl, FaRegSmile, FaStrikethrough, FaUnderline } from 'react-icons/fa';

/** The product toolbar follows the saved merchant reference; writing direction belongs to the document. */
export default function ProductDescriptionToolbar({ editor, ar, disabled, source, onSource, onLink, onMedia }) {
    const text = (arabic, english) => ar ? arabic : english;
    const inactive = disabled || source;
    const action = (command) => editor.chain().focus()[command]().run();
    const heading = [1, 2, 3, 4, 5, 6].find((level) => editor.isActive('heading', { level })) || '';
    const alignment = editor.getAttributes('paragraph').textAlign || editor.getAttributes('heading').textAlign || '';
    const color = editor.getAttributes('pageTextStyle');
    const AlignmentIcon = { center: FaAlignCenter, right: FaAlignRight, justify: FaAlignJustify, end: FaAlignRight }[alignment] || FaAlignLeft;
    const marks = [
        ['bold', 'عريض', 'Bold', 'toggleBold', <FaBold key="bold" aria-hidden />],
        ['italic', 'مائل', 'Italic', 'toggleItalic', <FaItalic key="italic" aria-hidden />],
        ['underline', 'تسطير', 'Underline', 'toggleUnderline', <FaUnderline key="underline" aria-hidden />],
        ['strike', 'شطب', 'Strike', 'toggleStrike', <FaStrikethrough key="strike" aria-hidden />],
        ['orderedList', 'قائمة مرقمة', 'Numbered list', 'toggleOrderedList', <FaListOl key="ordered" aria-hidden />],
        ['bulletList', 'قائمة نقطية', 'Bullet list', 'toggleBulletList', <FaListUl key="bullet" aria-hidden />],
    ];
    return <>
        <span className="product-rich-text__tool-group" data-tool-group="paragraph">
        <label className="product-rich-text__icon-select" title={text('محاذاة النص', 'Text alignment')}><AlignmentIcon aria-hidden /><select aria-label={text('محاذاة النص', 'Text alignment')} value={alignment} disabled={inactive} onChange={(event) => editor.chain().focus().updateAttributes('paragraph', { textAlign: event.target.value || null }).updateAttributes('heading', { textAlign: event.target.value || null }).run()}>
            <option value="">☰</option>{['left', 'center', 'right', 'justify'].map((value, index) => <option key={value} value={value}>{[text('يسار', 'Left'), text('وسط', 'Center'), text('يمين', 'Right'), text('ضبط', 'Justify')][index]}</option>)}
            {['start', 'end'].map(value => <option key={value} value={value}>{value === 'start' ? text('بداية', 'Start') : text('نهاية', 'End')}</option>)}
        </select></label>
        <select className="product-rich-text__heading-level" aria-label={text('مستوى العنوان', 'Heading level')} value={heading} disabled={inactive} onChange={(event) => event.target.value ? editor.chain().focus().setHeading({ level: Number(event.target.value) }).run() : editor.chain().focus().setParagraph().run()}>
            <option value="">Normal</option>{[1, 2, 3, 4, 5, 6].map(level => <option key={level} value={level}>H{level}</option>)}
        </select>
        </span>
        <span className="product-rich-text__tool-group" data-tool-group="marks">
        {marks.map(([mark, arabic, english, command, icon]) => <button key={mark} type="button" title={text(arabic, english)} aria-label={text(arabic, english)} aria-pressed={editor.isActive(mark)} disabled={inactive} onClick={() => action(command)}>{icon}</button>)}
        </span>
        <span className="product-rich-text__tool-group" data-tool-group="insert">
        <button type="button" aria-label={text('صورة', 'Image')} title={text('صورة', 'Image')} disabled={inactive} onClick={() => onMedia('img')}><FaImage aria-hidden /></button>
        <button type="button" aria-label={text('رابط', 'Link')} title={text('رابط', 'Link')} disabled={inactive} aria-pressed={editor.isActive('link')} onClick={onLink}><FaLink aria-hidden /></button>
        <button type="button" aria-label={text('فيديو', 'Video')} title={text('فيديو', 'Video')} disabled={inactive} onClick={() => onMedia('video')}><FaFilm aria-hidden /></button>
        {[['color', 'لون النص', 'Text color', '#000000'], ['backgroundColor', 'لون خلفية النص', 'Text background color', '#ffffff']].map(([property, arabic, english, fallback]) => <label className={`product-rich-text__swatch product-rich-text__swatch--${property}`} key={property} title={text(arabic, english)}>
            <span aria-hidden="true"><FaFont /></span><span className="product-rich-text__swatch-line" style={{ backgroundColor: color[property] || fallback }} aria-hidden="true" />
            <input type="color" aria-label={text(arabic, english)} value={color[property] || fallback} disabled={inactive} onChange={(event) => editor.chain().focus().setMark('pageTextStyle', { [property]: event.target.value }).run()} />
        </label>)}
        <label className="product-rich-text__icon-select" title={text('إدراج رمز تعبيري', 'Insert emoji')}><FaRegSmile aria-hidden /><select aria-label={text('إدراج رمز تعبيري', 'Insert emoji')} value="" disabled={inactive} onChange={(event) => editor.chain().focus().insertContent(event.target.value).run()}><option value="">☺</option>{['✨', '✓', '⭐', '💚', '🎁', '🚚'].map(emoji => <option key={emoji}>{emoji}</option>)}</select></label>
        <button type="button" aria-label="HTML" title="HTML" aria-pressed={source} disabled={disabled} onClick={onSource}><FaCode aria-hidden /></button>
        </span>
    </>;
}
