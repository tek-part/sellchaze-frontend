import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowPath,
    HiOutlineArrowUpTray,
    HiOutlineCheck,
    HiOutlineClipboard,
    HiOutlineMagnifyingGlass,
    HiOutlinePencilSquare,
    HiOutlinePhoto,
    HiOutlineTrash,
} from 'react-icons/hi2';
import PageHeader from '../components/PageHeader';
import useStoreMedia from '../components/store/useStoreMedia';
import { confirmDialog } from '../components/ui/confirmDialog';
import FormField, { INPUT_CLASS } from '../components/ui/FormField';
import { notify } from '../components/ui/notify';
import useStoreContext from '../hooks/useStoreContext';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

function formatBytes(bytes) {
    const n = Number(bytes || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetCard({ asset, onCopy, onEdit, onDelete, copied }) {
    const { t } = useTranslation();
    return (
        <figure className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:shadow-lg">
            <div className="relative aspect-square bg-slate-100">
                <img src={asset.url} alt={asset.alt_text || ''} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 flex items-end justify-center gap-1 bg-linear-to-t from-slate-900/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <button type="button" onClick={onCopy} className="rounded-lg bg-white/95 p-1.5 text-slate-700 shadow-sm hover:text-brand" aria-label={t('store_media_copy_url', 'Copy URL')}>
                        {copied ? <HiOutlineCheck className="h-4 w-4 text-emerald-600" aria-hidden /> : <HiOutlineClipboard className="h-4 w-4" aria-hidden />}
                    </button>
                    <button type="button" onClick={onEdit} className="rounded-lg bg-white/95 p-1.5 text-slate-700 shadow-sm hover:text-brand" aria-label={t('store_media_edit_alt', 'Edit alt text')}>
                        <HiOutlinePencilSquare className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" onClick={onDelete} className="rounded-lg bg-white/95 p-1.5 text-slate-700 shadow-sm hover:text-red-600" aria-label={t('action_delete', 'Delete')}>
                        <HiOutlineTrash className="h-4 w-4" aria-hidden />
                    </button>
                </div>
            </div>
            <figcaption className="px-2.5 py-2">
                <p className="truncate text-xs font-medium text-slate-700" title={asset.name}>{asset.name}</p>
                <p className="mt-0.5 text-[10px] text-slate-400" dir="ltr">
                    {asset.width || '?'} × {asset.height || '?'} · {formatBytes(asset.size_bytes)}
                </p>
            </figcaption>
        </figure>
    );
}

/** Full-page media library: upload, search, alt text and delete. */
export default function StoreMediaPage() {
    const { t } = useTranslation();
    const { apiBase } = useStoreContext();
    const [search, setSearch] = useState('');
    const [dragging, setDragging] = useState(false);
    const [editing, setEditing] = useState(null); // { id, alt }
    const [copiedId, setCopiedId] = useState(null);
    const inputRef = useRef(null);
    const { rows, meta, loading, uploading, error, upload, updateAlt, remove, load } = useStoreMedia(apiBase, { search, perPage: 60 });

    const handleUpload = async (files) => {
        const count = files?.length || 0;
        if (!count) return;
        try {
            await upload(files);
            notify.success(t('store_media_uploaded', '{{count}} file(s) uploaded', { count }));
        } catch (e) {
            notify.error(t('store_media_upload_failed', 'Upload failed'), e.response?.data?.message || e.message);
        }
    };

    const copyUrl = async (asset) => {
        try {
            await navigator.clipboard.writeText(asset.url);
            setCopiedId(asset.id);
            setTimeout(() => setCopiedId(null), 1500);
        } catch {
            /* clipboard unavailable */
        }
    };

    const del = async (asset) => {
        const ok = await confirmDialog({
            title: t('store_media_delete_title', 'Delete this file?'),
            text: t('store_media_delete_text', 'Pages or theme settings that still reference it will show a broken image.'),
            confirmText: t('action_delete', 'Delete'),
            danger: true,
        });
        if (!ok) return;
        try {
            await remove(asset.id);
            notify.success(t('store_media_deleted', 'File removed'));
        } catch (e) {
            notify.error(t('store_media_delete_failed', 'Could not delete'), e.response?.data?.message || e.message);
        }
    };

    const saveAlt = async (e) => {
        e.preventDefault();
        if (!editing) return;
        try {
            await updateAlt(editing.id, editing.alt.trim());
            notify.success(t('ui_changes_saved', 'Changes saved'));
            setEditing(null);
        } catch (err) {
            notify.error(t('ui_save_failed', 'Could not save changes'), err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <PageHeader
                title={t('store_media_title', 'Media library')}
                subtitle={t('store_media_page_subtitle', 'Images for pages, theme settings and menus. JPG, PNG, WebP or GIF up to 12 MB.')}
                badge={meta?.total !== undefined ? (
                    <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand">
                        {t('store_media_count', '{{count}} files', { count: meta.total })}
                    </span>
                ) : null}
                action={
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-50"
                    >
                        {uploading ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" aria-hidden /> : <HiOutlineArrowUpTray className="h-4 w-4" aria-hidden />}
                        {uploading ? t('store_media_uploading', 'Uploading…') : t('store_media_upload_files', 'Upload files')}
                    </button>
                }
            />
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => { void handleUpload(e.target.files); e.target.value = ''; }}
            />

            {/* Drop zone + search */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); void handleUpload(e.dataTransfer.files); }}
                className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3 transition ${dragging ? 'border-brand bg-brand-light/60' : 'border-slate-200 bg-white'}`}
            >
                <HiOutlinePhoto className="h-5 w-5 text-brand" aria-hidden />
                <p className="text-sm text-slate-600">{t('store_media_drop_hint', 'Drag images here to upload')}</p>
                <div className="relative ms-auto w-full sm:w-64">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('store_media_search', 'Search files…')}
                        className={`${INPUT_CLASS} ps-9`}
                    />
                </div>
            </div>

            {error ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                    <button type="button" onClick={() => void load()} className="ms-3 font-semibold underline">{t('action_retry', 'Retry')}</button>
                </p>
            ) : null}

            {loading && rows.length === 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-slate-100" />)}
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-card">
                    <HiOutlinePhoto className="h-9 w-9 text-slate-300" aria-hidden />
                    <p className="text-base font-semibold text-slate-700">{search ? t('store_media_no_matches', 'No files match your search') : t('store_media_empty_title', 'No media yet')}</p>
                    <p className="max-w-sm text-sm text-slate-500">{search ? t('store_media_no_matches_body', 'Try a different name.') : t('store_media_empty_body', 'Upload the first image for this store.')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {rows.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            copied={copiedId === asset.id}
                            onCopy={() => copyUrl(asset)}
                            onEdit={() => setEditing({ id: asset.id, alt: asset.alt_text || '', name: asset.name })}
                            onDelete={() => del(asset)}
                        />
                    ))}
                </div>
            )}

            {editing ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
                    <form onSubmit={saveAlt} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/80">
                        <h2 className="text-lg font-bold text-slate-900">{t('store_media_edit_alt', 'Edit alt text')}</h2>
                        <p className="mt-1 truncate text-xs text-slate-500" title={editing.name}>{editing.name}</p>
                        <FormField label={t('store_media_alt_label', 'Alt text')} htmlFor="media-alt" hint={t('store_media_alt_hint', 'Describes the image for screen readers and search engines.')} className="mt-4">
                            <input id="media-alt" value={editing.alt} onChange={(e) => setEditing((v) => ({ ...v, alt: e.target.value }))} className={INPUT_CLASS} maxLength={500} autoFocus />
                        </FormField>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{t('cancel', 'Cancel')}</button>
                            <button type="submit" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">{t('ui_save_changes', 'Save changes')}</button>
                        </div>
                    </form>
                </div>
            ) : null}
        </div>
    );
}
