import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch, ApiError } from '../../api/client';
import type { PersonalizationChoice, PersonalizationField } from '../../types/personalization';
import './personalization.css';

export function ProductPersonalizationFields({ productId, fields, choice, onChange }: {
  productId: string; fields: ReadonlyArray<PersonalizationField>; choice: PersonalizationChoice;
  onChange: (choice: PersonalizationChoice) => void;
}): ReactElement | null {
  const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar');
  const [error, setError] = useState(''); const mounted = useRef(true); const uploading = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  if (!fields.length) return null;
  function change(field: PersonalizationField, value: string): void {
    onChange({ ...choice, values: { ...choice.values, [field.key]: value }, entries: [
      ...choice.entries.filter((entry) => entry.key !== field.key),
      ...(value.trim() ? [{ key: field.key, type: field.type, label: field.label, value: value.trim() }] : []),
    ] });
  }
  async function upload(field: PersonalizationField, file: File | undefined): Promise<void> {
    if (!file || uploading.current) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError(ar ? 'اختر صورة JPG أو PNG أو WebP حتى 10 ميجابايت.' : 'Choose a JPG, PNG or WebP image up to 10 MB.'); return;
    }
    uploading.current = true; onChange({ ...choice, busy: true });
    const body = new FormData(); body.append('field_key', field.key); body.append('file', file);
    try {
      const { data } = await apiFetch<{ data: { token: string; filename: string; url: string } }>(`/products/${encodeURIComponent(productId)}/personalization-image`, { method: 'POST', body });
      if (mounted.current) onChange({ values: { ...choice.values, [field.key]: data.token }, busy: false, entries: [
        ...choice.entries.filter((entry) => entry.key !== field.key),
        { key: field.key, type: 'image', label: field.label, filename: data.filename, url: data.url },
      ] });
    } catch (e) {
      if (mounted.current) {
        const errors = e instanceof ApiError ? (e.payload as { errors?: Record<string, string[]> } | undefined)?.errors : undefined;
        setError(errors ? Object.values(errors).flat().join(' ') : e instanceof Error ? e.message : (ar ? 'تعذّر رفع الصورة. أعد المحاولة.' : 'Upload failed. Try again.'));
        onChange({ ...choice, busy: false });
      }
    } finally { uploading.current = false; }
  }
  return <fieldset className="sf-personalization" disabled={choice.busy}>
    <legend>{ar ? 'تخصيص المنتج' : 'Personalize your product'}</legend>
    {fields.map((field) => {
      const entry = choice.entries.find((item) => item.key === field.key);
      const label = `${field.label}${field.required ? ' *' : (ar ? ' (اختياري)' : ' (optional)')}`;
      return <div key={field.key} className="sf-personalization__field">
        {field.type === 'text' ? <label><span>{label}</span><textarea rows={2} maxLength={field.max_length} required={field.required} value={choice.values[field.key] ?? ''} onChange={(event) => change(field, event.target.value)} />
          <small>{Array.from(choice.values[field.key] ?? '').length} / {field.max_length}</small></label> : <>
          <label><span>{label}</span><input type="file" accept="image/jpeg,image/png,image/webp" required={field.required && !choice.values[field.key]} onChange={(event) => { void upload(field, event.target.files?.[0]); event.target.value = ''; }} />
            <small>{ar ? 'حتى 10 ميجابايت · 4096 × 4096 بكسل' : 'Up to 10 MB · 4096 × 4096 pixels'}</small></label>
          {entry ? <div className="sf-personalization__preview">{entry.url ? <img src={entry.url} alt={field.label} /> : null}<span>{entry.filename}</span><button type="button" onClick={() => onChange({ ...choice, values: { ...choice.values, [field.key]: '' }, entries: choice.entries.filter((item) => item.key !== field.key) })}>{ar ? 'إزالة الصورة' : 'Remove image'}</button></div> : null}
        </>}
      </div>;
    })}
    {choice.busy ? <p role="status">{ar ? 'جارٍ رفع الصورة…' : 'Uploading image…'}</p> : null}
    {error ? <p className="sf-field__error" role="alert">{error}</p> : null}
  </fieldset>;
}
