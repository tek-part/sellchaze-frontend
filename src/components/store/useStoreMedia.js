import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';

/**
 * Store media library data: list (search + paging), upload, update alt text,
 * delete. Shared by the full Media page and the inline StoreMediaPicker.
 *
 * `enabled: false` skips loading (the picker only fetches while its dialog is
 * open). `search` is debounced by the caller-supplied delay.
 */
export default function useStoreMedia(apiBase, { search = '', perPage = 60, page = 1, enabled = true, debounce = 250 } = {}) {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get(`${apiBase}/media`, { params: { search, per_page: perPage, page } });
            setRows(Array.isArray(data?.data) ? data.data : []);
            setMeta(data?.meta ?? null);
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, [apiBase, enabled, search, perPage, page]);

    useEffect(() => {
        if (!enabled) return undefined;
        const timer = window.setTimeout(() => { void load(); }, debounce);
        return () => window.clearTimeout(timer);
    }, [load, enabled, debounce]);

    /** Uploads each file in turn; resolves with the last created asset (or null). */
    const upload = useCallback(async (files, { altText } = {}) => {
        const list = Array.from(files || []);
        if (list.length === 0) return null;
        setUploading(true);
        setError('');
        try {
            let latest = null;
            for (const file of list) {
                const body = new FormData();
                body.append('file', file);
                if (altText) body.append('alt_text', altText);
                const { data } = await api.post(`${apiBase}/media`, body);
                latest = data?.data ?? null;
            }
            await load();
            return latest;
        } catch (e) {
            setError(e.response?.data?.message || e.message);
            throw e;
        } finally {
            setUploading(false);
        }
    }, [apiBase, load]);

    /** The API only exposes alt text for editing, so "rename" updates the alt text. */
    const updateAlt = useCallback(async (id, altText) => {
        const { data } = await api.patch(`${apiBase}/media/${id}`, { alt_text: altText });
        const next = data?.data;
        if (next) setRows((current) => current.map((row) => (row.id === id ? { ...row, ...next } : row)));
        return next;
    }, [apiBase]);

    const remove = useCallback(async (id) => {
        await api.delete(`${apiBase}/media/${id}`);
        setRows((current) => current.filter((row) => row.id !== id));
        setMeta((current) => (current ? { ...current, total: Math.max(0, (current.total || 1) - 1) } : current));
    }, [apiBase]);

    return { rows, meta, loading, uploading, error, load, upload, updateAlt, remove, setError };
}
