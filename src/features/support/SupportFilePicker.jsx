import { useRef } from 'react';
import { ACCEPTED_FILES, MAX_FILES, formatBytes, useSupportCopy } from './supportShared';

/** Attach up to three images/PDFs; shows the chosen files with a remove button each. */
export default function SupportFilePicker({ files, onChange, disabled }) {
    const { text } = useSupportCopy();
    const input = useRef(null);

    return (
        <div className="space-y-2">
            <input ref={input} type="file" multiple accept={ACCEPTED_FILES} className="sr-only" tabIndex={-1} disabled={disabled}
                onChange={(e) => { onChange([...files, ...Array.from(e.target.files || [])]); e.target.value = ''; }} />
            <button type="button" disabled={disabled || files.length >= MAX_FILES} onClick={() => input.current?.click()}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand disabled:opacity-40">
                {text('إرفاق صور أو PDF', 'Attach images or PDF')}
            </button>
            <span className="ms-2 text-xs text-slate-500">{text('حتى 3 ملفات، 5 ميجابايت لكل ملف', 'Up to 3 files, 5 MB each')}</span>
            {files.length ? (
                <ul className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                            <span className="max-w-[12rem] truncate" dir="auto">{file.name}</span>
                            <span className="text-slate-500">{formatBytes(file.size)}</span>
                            <button type="button" disabled={disabled} onClick={() => onChange(files.filter((_, i) => i !== index))}
                                className="font-bold text-slate-500 hover:text-red-600" aria-label={text(`إزالة ${file.name}`, `Remove ${file.name}`)}>×</button>
                        </li>
                    ))}
                </ul>
            ) : null}
            {files.length > MAX_FILES ? <p className="text-xs text-red-600">{text('أزل بعض الملفات.', 'Remove some files.')}</p> : null}
        </div>
    );
}
