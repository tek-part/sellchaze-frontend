import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import { previewDashboardGuide } from '../../lib/dashboard-guide-state';

const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
export default function useDashboardGuide(enabled) {
    const [data, setData] = useState(null);const [loading, setLoading] = useState(enabled);const [busy, setBusy] = useState(false);const [error, setError] = useState('');const [attempt, setAttempt] = useState(0);
    const active = useRef(false);const working = useRef(false);
    useEffect(() => {
        active.current = true;return () => { active.current = false; };
    }, []);
    useEffect(() => {
        if (!enabled) return;let live = true;setLoading(true);setError('');
        api.get('/my-store/dashboard-guide').then(({ data: response }) => { if (live) setData(response.data); }).catch((failure) => { if (live) setError(errorText(failure)); }).finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [enabled, attempt]);
    const save = async (changes) => {
        if (!data || loading || working.current) return;const previous=data;working.current = true;setBusy(true);setError('');setData(previewDashboardGuide(data,changes));
        try { const { data: response } = await api.put('/my-store/dashboard-guide', { ...data.preferences, ...changes });if (active.current) setData(response.data); }
        catch (failure) { if (active.current) { setData(previous);setError(errorText(failure)); } }
        finally { working.current = false;if (active.current) setBusy(false); }
    };
    return { data, loading, busy, error, reload: () => setAttempt((value) => value + 1),
        complete: (key, value) => save({ completed: { ...data.preferences.completed, [key]: value } }),
        dismiss: (panel) => save({ hidden_panels: [...new Set([...data.preferences.hidden_panels, panel])] }) };
}
