import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/client';

const changed = 'sellchaze:notifications-changed';
const errorMessage = (e) => e.response?.data?.message || e.message;

export default function useNotificationFeed({ page = 1, perPage = 25, status = 'all' } = {}) {
    const [feed, setFeed] = useState({ items: [], meta: null, unreadCount: 0 });
    const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
    const sequence = useRef(0); const mutation = useRef(false); const mounted = useRef(false);
    const load = useCallback(async (background = false) => {
        const revision = ++sequence.current; if (!background) setLoading(true); setError('');
        try {
            const { data } = await api.get('/notifications', { params: { page, per_page: perPage, status } });
            if (mounted.current && revision === sequence.current) setFeed({ items: Array.isArray(data.data) ? data.data : [], meta: data.meta ?? null, unreadCount: Number(data.unread_count) || 0 });
        } catch (e) { if (mounted.current && revision === sequence.current) setError(errorMessage(e)); }
        finally { if (mounted.current && revision === sequence.current) setLoading(false); }
    }, [page, perPage, status]);
    useEffect(() => {
        const requests = sequence;
        mounted.current = true; setFeed((current) => ({ ...current, items: [], meta: null })); void load();
        const refresh = () => { if (document.visibilityState === 'visible') void load(true); };
        const interval = setInterval(refresh, 45000); window.addEventListener(changed, refresh); document.addEventListener('visibilitychange', refresh);
        return () => { mounted.current = false; requests.current++; clearInterval(interval); window.removeEventListener(changed, refresh); document.removeEventListener('visibilitychange', refresh); };
    }, [load]);
    const markRead = async (item) => {
        if (item?.read_at) return true; if (mutation.current) return false;
        mutation.current = true; setBusy(true); setError(''); ++sequence.current;
        try {
            const { data } = await api.post(`/notifications/${encodeURIComponent(item.id)}/read`);
            if (mounted.current) { setFeed((current) => ({ ...current, unreadCount: data.unread_count, items: current.items.map((row) => row.id === item.id ? { ...row, read_at: new Date().toISOString() } : row) })); window.dispatchEvent(new Event(changed)); }
            return true;
        } catch (e) { if (mounted.current) setError(errorMessage(e)); return false; }
        finally { mutation.current = false; if (mounted.current) { setBusy(false); setLoading(false); } }
    };
    const markAllRead = async () => {
        if (mutation.current) return; mutation.current = true; setBusy(true); setError(''); ++sequence.current;
        try {
            const { data } = await api.post('/notifications/read-all');
            if (mounted.current) { setFeed((current) => ({ ...current, unreadCount: data.unread_count, items: current.items.map((row) => ({ ...row, read_at: row.read_at || new Date().toISOString() })) })); window.dispatchEvent(new Event(changed)); }
        } catch (e) { if (mounted.current) setError(errorMessage(e)); }
        finally { mutation.current = false; if (mounted.current) { setBusy(false); setLoading(false); } }
    };
    return { ...feed, loading, error, busy, reload: load, markRead, markAllRead };
}
