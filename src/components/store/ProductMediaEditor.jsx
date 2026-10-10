import { useEffect, useState } from 'react';

export function mediaFileError(files, cover = false) {
    if (files.length > 12) return true;
    return files.some((file) => {
        const video = file.type === 'video/mp4' && /\.mp4$/i.test(file.name);
        const image = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && /\.(jpe?g|png|webp)$/i.test(file.name);
        return (!image && (!video || cover)) || file.size > (video ? 50 : 10) * 1024 * 1024;
    });
}

function FilePreview({ file }) {
    const [url, setUrl] = useState('');
    useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
    if (!url) return null;
    return file.type === 'video/mp4' ? <video className="h-28 w-full rounded-lg bg-slate-950 object-contain" src={url} controls preload="metadata" playsInline /> : <img className="h-28 w-full rounded-lg object-contain" src={url} alt={file.name} />;
}

export default function ProductMediaEditor({ product, cover, setCover, removeCover, setRemoveCover, gallery, setGallery, removed, setRemoved, order, setOrder, setError, ar, fileVersion }) {
    const text = (a, e) => ar ? a : e;
    const hint = text('صور JPG وPNG وWebP حتى 10 ميجابايت، وفيديو MP4 حتى 50 ميجابايت. حتى 12 ملفًا جديدًا في الحفظ الواحد.', 'JPG, PNG and WebP up to 10 MB; MP4 video up to 50 MB. Up to 12 new files per save.');
    const existing = order.map((id) => product?.media?.find((item) => item.id === id)).filter((item) => item && !removed.includes(item.id));
    const button = 'rounded-md border border-slate-200 px-2 py-1 text-xs disabled:opacity-40';
    function choose(event, isCover) {
        const files = Array.from(event.target.files || []);
        if (mediaFileError(files, isCover)) { setError(hint); event.target.value = ''; return; }
        setError(''); if (isCover) { setCover(files[0] || null); setRemoveCover(false); } else setGallery(files);
    }
    function move(index, delta) {
        const ids = existing.map((item) => item.id); [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]]; setOrder(ids);
    }
    return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">{text('صور وفيديوهات المنتج', 'Product images and videos')}</h2><p className="text-xs text-slate-500">{hint}</p>
        {cover ? <FilePreview file={cover} /> : product?.image_url && !removeCover ? <img src={product.image_url} alt={product.name} className="h-36 w-full rounded-lg object-contain" /> : null}
        <label className="block text-sm">{text('الصورة الرئيسية', 'Cover image')}<input key={`cover-${fileVersion}`} type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm" onChange={(event) => choose(event, true)} /></label>
        {product?.image_url || cover ? <button type="button" className={button} onClick={() => { setCover(null); setRemoveCover(!removeCover); }}>{removeCover ? text('استعادة الغلاف', 'Restore cover') : text('إزالة الغلاف', 'Remove cover')}</button> : null}
        <label className="block text-sm">{text('إضافة صور وفيديوهات', 'Add images and videos')}<input key={`gallery-${fileVersion}`} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4" className="mt-2 block w-full text-sm" onChange={(event) => choose(event, false)} /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{existing.map((item, index) => <div key={item.id} className="min-w-0 space-y-2 rounded-lg border border-slate-200 p-2">
            {item.type === 'video' ? <video src={item.url} controls preload="metadata" playsInline className="h-28 w-full rounded-lg bg-slate-950 object-contain" /> : <img src={item.url} alt={item.alt || product.name} className="h-28 w-full rounded-lg object-contain" />}
            <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={index === 0} aria-label={`${text('تقديم الوسائط', 'Move media earlier')} ${index + 1}`} onClick={() => move(index, -1)}>↑</button><button type="button" className={button} disabled={index === existing.length - 1} aria-label={`${text('تأخير الوسائط', 'Move media later')} ${index + 1}`} onClick={() => move(index, 1)}>↓</button><button type="button" className={button} aria-label={`${text('إزالة الوسائط', 'Remove media')} ${index + 1}`} onClick={() => setRemoved([...removed, item.id])}>{text('إزالة', 'Remove')}</button></div>
        </div>)}{gallery.map((file, index) => <div key={`${file.name}-${index}`} className="min-w-0 space-y-2 rounded-lg border border-emerald-200 p-2"><FilePreview file={file} /><p className="break-all text-xs">{file.name}</p><button type="button" className={button} onClick={() => setGallery(gallery.filter((_, i) => i !== index))}>{text('إلغاء الملف الجديد', 'Discard new file')}</button></div>)}</div>
        {removed.length ? <button type="button" className={button} onClick={() => { setRemoved([]); setOrder((product?.media || []).map((item) => item.id)); }}>{text('استعادة الوسائط المحذوفة', 'Restore removed media')} ({removed.length})</button> : null}
    </section>;
}
