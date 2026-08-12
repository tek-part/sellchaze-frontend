import { useRef, useState } from 'react';
import { HiOutlineArrowUpTray, HiOutlinePause, HiOutlinePlay, HiOutlineTrash } from 'react-icons/hi2';
import { uploadCommunityFile } from '../api/uploads';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf';

export default function MediaUploader({ onChange, organizationId, reelOnly = false }) {
    const inputRef = useRef(null);
    const controllers = useRef(new Map());
    const [items, setItems] = useState([]);

    const patchItem = (key, patch) => setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

    const startUpload = async (item) => {
        const controller = new AbortController();
        controllers.current.set(item.key, controller);
        patchItem(item.key, { status: 'uploading', error: '', controller });
        try {
            const asset = await uploadCommunityFile(item.file, {
                organizationId,
                signal: controller.signal,
                onProgress: (progress) => patchItem(item.key, { progress }),
            });
            patchItem(item.key, { status: asset.status === 'failed' ? 'failed' : 'ready', progress: 100, asset });
            onChange?.((current) => current.some((entry) => entry.id === asset.id) ? current : [...current, asset]);
        } catch (error) {
            patchItem(item.key, {
                status: error?.name === 'CanceledError' || error?.name === 'AbortError' ? 'paused' : 'failed',
                error: error?.response?.data?.message || error.message,
            });
        }
    };

    const addFiles = (files) => {
        [...files].slice(0, Math.max(0, 12 - items.length)).forEach((file) => {
            if (reelOnly && !file.type.startsWith('video/')) return;
            const item = { key: crypto.randomUUID(), file, preview: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : '', progress: 0, status: 'queued' };
            setItems((current) => [...current, item]);
            setTimeout(() => startUpload(item), 0);
        });
    };

    const remove = (item) => {
        controllers.current.get(item.key)?.abort();
        if (item.preview) URL.revokeObjectURL(item.preview);
        setItems((current) => current.filter((entry) => entry.key !== item.key));
        if (item.asset) onChange?.((current) => current.filter((asset) => asset.id !== item.asset.id));
    };

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}
                className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-5 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
            >
                <HiOutlineArrowUpTray className="h-7 w-7 text-brand" />
                <span className="mt-2 text-sm font-semibold text-slate-800">اسحب الملفات هنا أو اخترها من جهازك</span>
                <span className="mt-1 text-xs text-slate-500">رفع متجزئ قابل للاستكمال · صور وفيديو وPDF · حتى 2GB</span>
            </button>
            <input ref={inputRef} type="file" hidden multiple={!reelOnly} accept={reelOnly ? 'video/mp4,video/webm,video/quicktime' : ACCEPT} onChange={(event) => addFiles(event.target.files)} />
            {items.map((item) => (
                <div key={item.key} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    {item.preview ? (item.file.type.startsWith('video/') ? <video src={item.preview} className="h-14 w-14 rounded-lg object-cover" muted /> : <img src={item.preview} alt="" className="h-14 w-14 rounded-lg object-cover" />) : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">PDF</div>}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{item.file.name}</p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${item.progress}%` }} /></div>
                        <p className={`mt-1 text-xs ${item.status === 'failed' ? 'text-red-600' : 'text-slate-500'}`}>{item.error || (item.status === 'ready' ? 'تم الرفع والمعالجة في الخلفية' : item.status === 'paused' ? 'متوقف مؤقتاً' : `${item.progress}%`)}</p>
                    </div>
                    {item.status === 'uploading' ? <button type="button" onClick={() => controllers.current.get(item.key)?.abort()} className="p-2 text-slate-500"><HiOutlinePause className="h-5 w-5" /></button> : null}
                    {['paused', 'failed'].includes(item.status) ? <button type="button" onClick={() => startUpload(item)} className="p-2 text-brand"><HiOutlinePlay className="h-5 w-5" /></button> : null}
                    <button type="button" onClick={() => remove(item)} className="p-2 text-red-500"><HiOutlineTrash className="h-5 w-5" /></button>
                </div>
            ))}
        </div>
    );
}
