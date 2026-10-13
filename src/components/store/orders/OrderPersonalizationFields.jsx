import { useEffect, useRef } from 'react';
import api from '../../../api/client';
import Field from './ManualOrderField';

export default function PersonalizationFields({ line, apiBase, ar, busy, onChange, onUploadState, onError }) {
    const live = useRef(true);
    useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
    async function upload(field, file) {
        if (!file) return;
        onUploadState(true);
        try {
            const form = new FormData(); form.append('field_key', field.key); form.append('file', file);
            const { data } = await api.post(`${apiBase}/orders/manual/products/${line.product.id}/personalization-image`, form);
            if (live.current) onChange(field.key, data.data.token, data.data.filename);
        } catch (error) { if (live.current) onError(error.response?.data?.message || error.message); }
        finally { if (live.current) onUploadState(false); }
    }
    return line.product.personalization_fields?.length ? <div className="ws-manual-personalization">{line.product.personalization_fields.map(field => field.type === 'image' ? <label key={field.key}>{field.label}{field.required ? ' *' : ''}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} required={field.required && !line.personalization?.[field.key]} aria-label={field.label} onChange={event => void upload(field, event.target.files?.[0])} />{line.uploadNames?.[field.key] ? <small>{line.uploadNames[field.key]}</small> : null}</label> : <Field key={field.key} label={field.label} value={line.personalization?.[field.key] || ''} required={field.required} disabled={busy} maxLength={field.max_length} onChange={value => onChange(field.key, value)} />)}<small>{ar ? 'تُحفظ التخصيصات مع هذا الطلب.' : 'Customization is saved with this order.'}</small></div> : null;
}
