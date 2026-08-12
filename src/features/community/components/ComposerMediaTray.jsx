import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowUpTray, HiOutlineDocumentText, HiOutlineXMark } from 'react-icons/hi2';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf';
const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime';
const MAX_FILES = 12;

const kindOf = (file) => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('image/')) return 'image';
    return 'document';
};

/**
 * The composer's media strip: picks files, shows real previews — a playable
 * player for video, a photo grid for images — and hands the parent plain
 * descriptors ({ key, blob, name, kind, previewUrl }). No uploading happens
 * here: publishing is deferred to the background queue, so the member can hit
 * Publish immediately and keep browsing while everything uploads.
 */
export default function ComposerMediaTray({ files, onChange, mode = 'post' }) {
    const { t } = useTranslation();
    const inputRef = useRef(null);
    const videoOnly = mode === 'reel';

    const addFiles = (picked) => {
        const room = Math.max(0, MAX_FILES - files.length);
        const accepted = [...picked]
            .filter((file) => (videoOnly ? file.type.startsWith('video/') : true))
            .slice(0, videoOnly ? 1 : room)
            .map((file) => ({
                key: crypto.randomUUID(),
                blob: file,
                name: file.name,
                kind: kindOf(file),
                previewUrl: kindOf(file) === 'document' ? '' : URL.createObjectURL(file),
            }));
        if (!accepted.length) return;
        onChange?.(videoOnly ? accepted : [...files, ...accepted]);
    };

    const remove = (key) => {
        const target = files.find((file) => file.key === key);
        if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
        onChange?.(files.filter((file) => file.key !== key));
    };

    const videos = files.filter((file) => file.kind === 'video');
    const images = files.filter((file) => file.kind === 'image');
    const documents = files.filter((file) => file.kind === 'document');

    return (
        <div className="space-y-3">
            {/* Videos preview large and playable — the member checks the clip
                before publishing, exactly like the big networks. */}
            {videos.map((file) => (
                <div key={file.key} className="relative overflow-hidden rounded-2xl bg-black">
                    <video src={file.previewUrl} controls playsInline preload="metadata" className="max-h-96 w-full object-contain" />
                    <button
                        type="button"
                        onClick={() => remove(file.key)}
                        aria-label={t('action_remove', 'Remove')}
                        className="sc-press absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                    >
                        <HiOutlineXMark className="h-5 w-5" aria-hidden />
                    </button>
                </div>
            ))}

            {images.length ? (
                <div className={`grid gap-1.5 overflow-hidden rounded-2xl ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {images.map((file) => (
                        <div key={file.key} className="relative">
                            <img src={file.previewUrl} alt="" className={`w-full object-cover ${images.length === 1 ? 'max-h-96' : 'aspect-square'}`} />
                            <button
                                type="button"
                                onClick={() => remove(file.key)}
                                aria-label={t('action_remove', 'Remove')}
                                className="sc-press absolute end-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                            >
                                <HiOutlineXMark className="h-4 w-4" aria-hidden />
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}

            {documents.map((file) => (
                <div key={file.key} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                        <HiOutlineDocumentText className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{file.name}</span>
                    <button
                        type="button"
                        onClick={() => remove(file.key)}
                        aria-label={t('action_remove', 'Remove')}
                        className="sc-press rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    >
                        <HiOutlineXMark className="h-5 w-5" aria-hidden />
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                    event.preventDefault();
                    addFiles(event.dataTransfer.files);
                }}
                className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-5 py-5 text-center transition hover:border-brand/40 hover:bg-brand-light/40"
            >
                <HiOutlineArrowUpTray className="h-6 w-6 text-brand" aria-hidden />
                <span className="mt-1.5 text-sm font-bold text-slate-700">
                    {videoOnly ? t('composer_drop_video', 'Drop a video here or choose one') : t('composer_drop_files', 'Drop files here or choose from your device')}
                </span>
                <span className="mt-0.5 text-xs text-slate-500">
                    {t('composer_upload_hint', 'Uploads continue in the background after you publish · up to 2GB')}
                </span>
            </button>
            <input
                ref={inputRef}
                type="file"
                hidden
                multiple={!videoOnly}
                accept={videoOnly ? VIDEO_ACCEPT : ACCEPT}
                onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = '';
                }}
            />
        </div>
    );
}
