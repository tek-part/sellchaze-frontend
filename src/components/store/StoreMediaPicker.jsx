import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';

export default function StoreMediaPicker({ apiBase, value, onChange }) {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!open) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get(`${apiBase}/media`, { params: { search, per_page: 60 } });
            setRows(data.data || []);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    }, [apiBase, open, search]);

    useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);

    const upload = async (files) => {
        if (!files?.length) return;
        setUploading(true);
        setError('');
        try {
            let latest = null;
            for (const file of Array.from(files)) {
                const body = new FormData();
                body.append('file', file);
                const { data } = await api.post(`${apiBase}/media`, body);
                latest = data.data;
            }
            await load();
            if (latest) onChange(latest.url);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setUploading(false); }
    };

    return (
        <div>
            {value ? <img src={value} alt="" className="mb-2 h-28 w-full rounded-xl border border-slate-200 object-cover" /> : <div className="mb-2 grid h-24 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">No image selected</div>}
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Choose from library</button><label className="cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />{uploading ? 'Uploading…' : 'Upload'}</label>{value ? <button type="button" onClick={() => onChange('')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Remove</button> : null}</div>

            {open ? <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Store media library" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
                <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4"><div><h2 className="text-lg font-bold text-slate-900">Media library</h2><p className="text-xs text-slate-500">Reusable files for this store only</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files…" className="ms-auto min-w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm" /><label className="cursor-pointer rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />{uploading ? 'Uploading…' : 'Upload files'}</label><button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Close</button></div>
                    {error ? <p className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
                    <div className="overflow-y-auto p-4">{loading ? <p className="py-16 text-center text-sm text-slate-400">Loading media…</p> : rows.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{rows.map((asset) => <button key={asset.id} type="button" onClick={() => { onChange(asset.url); setOpen(false); }} className={`overflow-hidden rounded-2xl border bg-white text-start transition hover:-translate-y-0.5 hover:shadow-lg ${value === asset.url ? 'border-brand ring-2 ring-brand/20' : 'border-slate-200'}`}><img src={asset.url} alt={asset.alt_text || ''} className="aspect-square w-full bg-slate-100 object-cover" loading="lazy" /><span className="block truncate px-2 py-2 text-xs font-medium text-slate-700">{asset.name}</span><span className="block px-2 pb-2 text-[10px] text-slate-400">{asset.width || '?'} × {asset.height || '?'}</span></button>)}</div> : <div className="py-16 text-center"><p className="font-semibold text-slate-700">No media yet</p><p className="mt-1 text-sm text-slate-400">Upload the first image for this store.</p></div>}</div>
                </div>
            </div> : null}
        </div>
    );
}
