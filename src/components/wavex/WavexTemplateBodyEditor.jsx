import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

function ToolbarButton({ active, onClick, children, disabled }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={[
                'rounded-lg px-2 py-1 text-xs font-semibold transition',
                active ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                disabled ? 'cursor-not-allowed opacity-50' : '',
            ].join(' ')}
        >
            {children}
        </button>
    );
}

export default function WavexTemplateBodyEditor({ initialHtml, onChange, disabled, placeholder }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            Placeholder.configure({
                placeholder: placeholder || '',
            }),
        ],
        content: initialHtml || '<p></p>',
        editable: !disabled,
        onUpdate: ({ editor: ed }) => {
            onChange(ed.getHTML());
        },
    });

    if (!editor) {
        return <div className="min-h-[200px] rounded-xl border border-slate-200 bg-slate-50" />;
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap gap-1 border-b border-slate-100 bg-slate-50/80 px-2 py-2">
                <ToolbarButton
                    active={editor.isActive('bold')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    B
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('italic')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    I
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('strike')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    S
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('bulletList')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    •
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('orderedList')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    1.
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('blockquote')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    “
                </ToolbarButton>
            </div>
            <div className="px-3 py-2">
                <EditorContent
                    editor={editor}
                    className="min-h-[180px] text-sm text-slate-900 [&_.ProseMirror]:min-h-[176px] [&_.ProseMirror]:outline-hidden [&_.ProseMirror_p]:my-1 [&_.ProseMirror_ul]:my-1 [&_.ProseMirror_ol]:my-1"
                />
            </div>
        </div>
    );
}
