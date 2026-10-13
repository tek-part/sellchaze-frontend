import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function useMerchantSettings(context, endpoint) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const [initial, setInitial] = useState(null);
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);
    const [reload, setReload] = useState(0);
    const working = useRef(false);
    const failureMessage = (failure) => Object.values(failure.response?.data?.errors || {}).flat().join(' ') || failure.response?.data?.message || failure.message;
    useEffect(() => {
        let active = true;
        if (!context.access.canStoreSettings) return;
        setLoading(true); setError(''); setSaved(false);
        api.get(`${context.apiBase}/${endpoint}`).then(({ data }) => {
            if (active) { setInitial(data.data); setDraft(data.data); }
        }).catch((failure) => { if (active) setError(failureMessage(failure)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [context.apiBase, context.access.canStoreSettings, endpoint, reload]);
    const change = (next) => { setSaved(false); setDraft(next); };
    const save = async (body) => {
        if (working.current) return false;
        working.current = true; setBusy(true); setError(''); setSaved(false);
        try {
            const { data } = body instanceof FormData
                ? await api.post(`${context.apiBase}/${endpoint}`, body)
                : await api.put(`${context.apiBase}/${endpoint}`, body);
            setInitial(data.data); setDraft(data.data); setSaved(true);
            if (data.store) context.setStore(data.store);
            return true;
        } catch (failure) { setError(failureMessage(failure)); return false; }
        finally { working.current = false; setBusy(false); }
    };
    return { ar, text: (a, e) => ar ? a : e, initial, draft, change, loading, error, saved, busy, save, reload: () => setReload((value) => value + 1) };
}
